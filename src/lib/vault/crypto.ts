/**
 * Criptografía de la bóveda. Se ejecuta en el navegador (y en tests Node).
 *
 * El servidor nunca importa este módulo para descifrar: solo recibe blobs.
 *
 * - Argon2id para la master password.
 * - `crypto_kdf` (BLAKE2b) para separar `kek` y `authKey`.
 * - XChaCha20-Poly1305 para el keyring y el contenido de cada cuenta.
 * - X25519 + `crypto_box_seal` para envolver las DEKs por destinatario.
 */
import sodium from 'libsodium-wrappers-sumo';
import { KEY_BYTES, NONCE_BYTES } from './constants';
import type { AccountPayload, VaultKeyring } from './types';

const KDF_CONTEXT_KEK = 'casaosKE';
const KDF_CONTEXT_AUTH = 'casaosAU';
const KDF_CONTEXT_PASSKEY = 'casaosPK';

export class VaultCryptoError extends Error {
  constructor(message = 'No se pudo descifrar') {
    super(message);
    this.name = 'VaultCryptoError';
  }
}

async function ready(): Promise<void> {
  await sodium.ready;
}

export function toBase64(bytes: Uint8Array): string {
  return sodium.to_base64(bytes, sodium.base64_variants.ORIGINAL);
}

export function fromBase64(value: string): Uint8Array {
  try {
    return sodium.from_base64(value, sodium.base64_variants.ORIGINAL);
  } catch {
    throw new VaultCryptoError('Base64 no válido');
  }
}

export function toBase64Url(bytes: Uint8Array): string {
  return sodium.to_base64(bytes, sodium.base64_variants.URLSAFE_NO_PADDING);
}

export function fromBase64Url(value: string): Uint8Array {
  try {
    return sodium.from_base64(value, sodium.base64_variants.URLSAFE_NO_PADDING);
  } catch {
    throw new VaultCryptoError('Base64URL no válido');
  }
}

export async function randomBytes(length: number): Promise<Uint8Array> {
  await ready();
  return sodium.randombytes_buf(length);
}

export async function randomBase64(length: number): Promise<string> {
  return toBase64(await randomBytes(length));
}

/**
 * Deriva `kek` y `authKey` de la master password.
 *
 * `authKey` se envía al servidor para verificar; `kek` nunca sale del cliente.
 * La `masterKey` intermedia se borra en cuanto se derivan las dos subclaves.
 */
export async function deriveMasterKeys(
  password: string,
  saltBase64: string,
  opsLimit: number,
  memLimit: number,
): Promise<{ kek: Uint8Array; authKey: Uint8Array }> {
  await ready();
  const salt = fromBase64(saltBase64);
  if (salt.length !== sodium.crypto_pwhash_SALTBYTES) {
    throw new VaultCryptoError('Sal de derivación no válida');
  }

  const masterKey = sodium.crypto_pwhash(
    KEY_BYTES,
    password,
    salt,
    opsLimit,
    memLimit,
    sodium.crypto_pwhash_ALG_ARGON2ID13,
  );

  try {
    const kek = sodium.crypto_kdf_derive_from_key(
      KEY_BYTES,
      1,
      KDF_CONTEXT_KEK,
      masterKey,
    );
    const authKey = sodium.crypto_kdf_derive_from_key(
      KEY_BYTES,
      2,
      KDF_CONTEXT_AUTH,
      masterKey,
    );
    return { kek, authKey };
  } finally {
    memzero(masterKey);
  }
}

export async function deriveRecoveryKek(
  recoveryKey: Uint8Array,
  saltBase64: string,
  opsLimit: number,
  memLimit: number,
): Promise<Uint8Array> {
  await ready();
  const salt = fromBase64(saltBase64);
  if (salt.length !== sodium.crypto_pwhash_SALTBYTES) {
    throw new VaultCryptoError('Sal de recuperación no válida');
  }

  const password = toBase64(recoveryKey);
  return sodium.crypto_pwhash(
    KEY_BYTES,
    password,
    salt,
    opsLimit,
    memLimit,
    sodium.crypto_pwhash_ALG_ARGON2ID13,
  );
}

/** Clave que envuelve el keyring cuando se desbloquea con una passkey PRF. */
export async function derivePasskeyKey(prfOutput: Uint8Array): Promise<Uint8Array> {
  await ready();
  if (prfOutput.length < KEY_BYTES) {
    throw new VaultCryptoError('Salida PRF no válida');
  }
  return sodium.crypto_kdf_derive_from_key(
    KEY_BYTES,
    1,
    KDF_CONTEXT_PASSKEY,
    prfOutput.subarray(0, KEY_BYTES),
  );
}

function encryptBytes(
  plaintext: Uint8Array,
  key: Uint8Array,
): { ciphertext: string; nonce: string } {
  if (key.length !== KEY_BYTES) throw new VaultCryptoError('Clave no válida');
  const nonce = sodium.randombytes_buf(NONCE_BYTES);
  const ciphertext = sodium.crypto_aead_xchacha20poly1305_ietf_encrypt(
    plaintext,
    null,
    null,
    nonce,
    key,
  );
  return { ciphertext: toBase64(ciphertext), nonce: toBase64(nonce) };
}

function decryptBytes(ciphertextBase64: string, nonceBase64: string, key: Uint8Array): Uint8Array {
  if (key.length !== KEY_BYTES) throw new VaultCryptoError('Clave no válida');
  const nonce = fromBase64(nonceBase64);
  if (nonce.length !== NONCE_BYTES) throw new VaultCryptoError('Nonce no válido');

  try {
    return sodium.crypto_aead_xchacha20poly1305_ietf_decrypt(
      null,
      fromBase64(ciphertextBase64),
      null,
      nonce,
      key,
    );
  } catch {
    throw new VaultCryptoError();
  }
}

/** Cifra un objeto JSON con XChaCha20-Poly1305. */
export async function encryptJson(
  value: unknown,
  key: Uint8Array,
): Promise<{ ciphertext: string; nonce: string }> {
  await ready();
  return encryptBytes(sodium.from_string(JSON.stringify(value)), key);
}

/** Descifra y valida que el JSON sea un objeto. */
export async function decryptJson<T>(ciphertext: string, nonce: string, key: Uint8Array): Promise<T> {
  await ready();
  const bytes = decryptBytes(ciphertext, nonce, key);
  try {
    const parsed = JSON.parse(sodium.to_string(bytes)) as unknown;
    if (!parsed || typeof parsed !== 'object') throw new Error('no-object');
    return parsed as T;
  } catch {
    throw new VaultCryptoError('Contenido no válido');
  } finally {
    memzero(bytes);
  }
}

export async function generateKey(): Promise<Uint8Array> {
  return randomBytes(KEY_BYTES);
}

export async function generateSalt(): Promise<string> {
  await ready();
  return toBase64(sodium.randombytes_buf(sodium.crypto_pwhash_SALTBYTES));
}

export async function createIdentity(): Promise<{
  publicKey: string;
  privateKey: string;
}> {
  await ready();
  const pair = sodium.crypto_box_keypair();
  return {
    publicKey: toBase64(pair.publicKey),
    privateKey: toBase64(pair.privateKey),
  };
}

/** Envuelve una DEK para un destinatario concreto. */
export async function wrapKeyForRecipient(
  key: Uint8Array,
  recipientPublicKeyBase64: string,
): Promise<string> {
  await ready();
  try {
    const wrapped = sodium.crypto_box_seal(
      key,
      fromBase64(recipientPublicKeyBase64),
    );
    return toBase64(wrapped);
  } catch {
    throw new VaultCryptoError('Clave pública del destinatario no válida');
  }
}

/** Desenvuelve una DEK con la clave privada X25519 del usuario. */
export async function unwrapKeyForRecipient(
  wrappedBase64: string,
  ownPublicKeyBase64: string,
  ownPrivateKeyBase64: string,
): Promise<Uint8Array> {
  await ready();
  try {
    return sodium.crypto_box_seal_open(
      fromBase64(wrappedBase64),
      fromBase64(ownPublicKeyBase64),
      fromBase64(ownPrivateKeyBase64),
    );
  } catch {
    throw new VaultCryptoError('No se pudo abrir la clave de la cuenta');
  }
}

export async function encryptKeyring(
  keyring: VaultKeyring,
  kek: Uint8Array,
): Promise<{ wrappedKeyring: string; keyringNonce: string }> {
  const { ciphertext, nonce } = await encryptJson(keyring, kek);
  return { wrappedKeyring: ciphertext, keyringNonce: nonce };
}

export async function decryptKeyring(
  wrappedKeyring: string,
  keyringNonce: string,
  kek: Uint8Array,
): Promise<VaultKeyring> {
  const keyring = await decryptJson<Partial<VaultKeyring>>(
    wrappedKeyring,
    keyringNonce,
    kek,
  );
  if (
    keyring.version !== 1 ||
    typeof keyring.sk !== 'string' ||
    typeof keyring.pk !== 'string'
  ) {
    throw new VaultCryptoError('Keyring no válido');
  }
  return keyring as VaultKeyring;
}

export async function encryptAccount(
  payload: AccountPayload,
  dek: Uint8Array,
): Promise<{ ciphertext: string; nonce: string }> {
  return encryptJson(payload, dek);
}

export async function decryptAccount(
  ciphertext: string,
  nonce: string,
  dek: Uint8Array,
): Promise<AccountPayload> {
  const payload = await decryptJson<Partial<AccountPayload>>(ciphertext, nonce, dek);
  if (typeof payload.title !== 'string' || typeof payload.password !== 'string') {
    throw new VaultCryptoError('Cuenta no válida');
  }
  return {
    title: payload.title,
    username: typeof payload.username === 'string' ? payload.username : '',
    password: payload.password,
    url: typeof payload.url === 'string' ? payload.url : '',
    notes: typeof payload.notes === 'string' ? payload.notes : '',
    category: typeof payload.category === 'string' ? payload.category : 'Otros',
    customFields: Array.isArray(payload.customFields)
      ? payload.customFields
          .filter(
            (field): field is { label: string; value: string } =>
              !!field &&
              typeof field === 'object' &&
              typeof (field as { label?: unknown }).label === 'string' &&
              typeof (field as { value?: unknown }).value === 'string',
          )
          .slice(0, 20)
      : [],
  };
}

/** Borrado best-effort de material sensible en memoria. */
export function memzero(value: Uint8Array | null | undefined): void {
  if (!value) return;
  try {
    sodium.memzero(value);
  } catch {
    value.fill(0);
  }
}
