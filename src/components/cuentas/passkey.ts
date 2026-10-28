import {
  startAuthentication,
  startRegistration,
  type AuthenticationResponseJSON,
  type PublicKeyCredentialCreationOptionsJSON,
  type PublicKeyCredentialRequestOptionsJSON,
  type RegistrationResponseJSON,
} from '@simplewebauthn/browser';
import {
  decryptKeyring,
  derivePasskeyKey,
  encryptKeyring,
  fromBase64,
  memzero,
} from '@/lib/vault/crypto';
import type { VaultKeyring } from '@/lib/vault/types';

function toBytes(value: BufferSource | undefined | null): Uint8Array | null {
  if (!value) return null;
  if (value instanceof ArrayBuffer) return new Uint8Array(value);
  if (ArrayBuffer.isView(value)) {
    return new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
  }
  return null;
}

function prfOutput(extensions: unknown): Uint8Array {
  const prf = (extensions as {
    prf?: { enabled?: boolean; results?: { first?: unknown } };
  } | undefined)?.prf;
  if (prf?.enabled !== true) {
    throw new Error(
      'Este dispositivo no permite desbloquear con passkey. Usa la master password',
    );
  }
  const output = toBytes(prf.results?.first as BufferSource | undefined);
  if (!output || output.length < 32) {
    throw new Error('El autenticador no devolvió la clave PRF. Usa la master password');
  }
  return output;
}

function withPrfEval<T extends { extensions?: unknown }>(options: T, prfSalt: string): T {
  return {
    ...options,
    extensions: {
      ...(options.extensions as Record<string, unknown> | undefined),
      prf: { eval: { first: fromBase64(prfSalt) } },
    },
  } as T;
}

/** Registra una passkey y envuelve el keyring con la clave derivada del PRF. */
export async function registerPasskeyOnDevice(input: {
  options: PublicKeyCredentialCreationOptionsJSON;
  prfSalt: string;
  keyring: VaultKeyring;
}): Promise<{
  response: RegistrationResponseJSON;
  wrappedKeyring: string;
  keyringNonce: string;
}> {
  const response = await startRegistration({
    optionsJSON: withPrfEval(input.options, input.prfSalt),
  });
  const output = prfOutput(response.clientExtensionResults);
  const passkeyKey = await derivePasskeyKey(output);
  try {
    const wrapped = await encryptKeyring(input.keyring, passkeyKey);
    return {
      response,
      wrappedKeyring: wrapped.wrappedKeyring,
      keyringNonce: wrapped.keyringNonce,
    };
  } finally {
    memzero(passkeyKey);
    memzero(output);
  }
}

/**
 * Ejecuta la aserción con PRF. La clave derivada se devuelve para descifrar el
 * keyring que el servidor entrega **después** de verificar la aserción y el TOTP.
 */
export async function authenticatePasskeyOnDevice(input: {
  options: PublicKeyCredentialRequestOptionsJSON;
  prfSalt: string;
}): Promise<{ response: AuthenticationResponseJSON; passkeyKey: Uint8Array }> {
  const response = await startAuthentication({
    optionsJSON: withPrfEval(input.options, input.prfSalt),
  });
  const output = prfOutput(response.clientExtensionResults);
  const passkeyKey = await derivePasskeyKey(output);
  memzero(output);
  return { response, passkeyKey };
}

export async function decryptPasskeyKeyring(input: {
  wrappedKeyring: string;
  keyringNonce: string;
  passkeyKey: Uint8Array;
}): Promise<VaultKeyring> {
  return decryptKeyring(input.wrappedKeyring, input.keyringNonce, input.passkeyKey);
}
