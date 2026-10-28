'use client';

import { useState } from 'react';
import {
  createIdentity,
  deriveMasterKeys,
  deriveRecoveryKek,
  encryptKeyring,
  generateKey,
  generateSalt,
  memzero,
  toBase64,
} from '@/lib/vault/crypto';
import {
  KDF_MEM_LIMIT,
  KDF_OPS_LIMIT,
  MASTER_PASSWORD_MIN_LENGTH,
} from '@/lib/vault/constants';
import { encodeRecoveryKey } from '@/lib/vault/recovery-code';
import { isMasterPasswordAcceptable, passwordStrength } from '@/lib/vault/password';
import type { RecoveryKit, VaultKeyring } from '@/lib/vault/types';
import { vaultFetch, errorMessage } from './api';
import { buildRecoveryKit, downloadRecoveryKit } from './kit';
import { registerPasskeyOnDevice } from './passkey';
import { createSession, type VaultSession } from './session';
import { Alert, Button, Field } from './ui';

interface PreparedVault {
  keyring: VaultKeyring;
  kdfSalt: string;
  kdfOpsLimit: number;
  kdfMemLimit: number;
  authKey: Uint8Array;
  wrappedKeyring: string;
  keyringNonce: string;
  recovery: {
    kdfSalt: string;
    kdfOpsLimit: number;
    kdfMemLimit: number;
    wrappedKeyring: string;
    nonce: string;
  };
  kit: RecoveryKit;
}

interface PasskeyOptions {
  options: Parameters<typeof registerPasskeyOnDevice>[0]['options'];
  prfSalt: string;
}

/**
 * Deja pintar el estado «Preparando claves…» antes del KDF.
 *
 * `requestAnimationFrame` se pausa en pestañas ocultas; el timeout garantiza que
 * la creación continúe aunque el usuario cambie de pestaña mientras espera.
 */
function nextFrame(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve();
      return;
    }
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      resolve();
    };
    window.requestAnimationFrame(finish);
    window.setTimeout(finish, 50);
  });
}

async function buildVault(email: string, password: string): Promise<PreparedVault> {
  const kdfSalt = await generateSalt();
  const { kek, authKey } = await deriveMasterKeys(
    password,
    kdfSalt,
    KDF_OPS_LIMIT,
    KDF_MEM_LIMIT,
  );

  let keyring!: VaultKeyring;
  let masterBlob!: { wrappedKeyring: string; keyringNonce: string };
  let recoverySalt!: string;
  let recoveryBlob!: { wrappedKeyring: string; keyringNonce: string };
  let kit!: RecoveryKit;

  try {
    const identity = await createIdentity();
    keyring = { sk: identity.privateKey, pk: identity.publicKey, version: 1 };
    masterBlob = await encryptKeyring(keyring, kek);

    const recoveryKey = await generateKey();
    try {
      recoverySalt = await generateSalt();
      const recoveryKek = await deriveRecoveryKek(
        recoveryKey,
        recoverySalt,
        KDF_OPS_LIMIT,
        KDF_MEM_LIMIT,
      );
      try {
        recoveryBlob = await encryptKeyring(keyring, recoveryKek);
      } finally {
        memzero(recoveryKek);
      }

      kit = buildRecoveryKit({
        email,
        recoveryKey: await encodeRecoveryKey(recoveryKey),
      });
    } finally {
      memzero(recoveryKey);
    }
  } finally {
    memzero(kek);
  }

  return {
    keyring,
    kdfSalt,
    kdfOpsLimit: KDF_OPS_LIMIT,
    kdfMemLimit: KDF_MEM_LIMIT,
    authKey,
    wrappedKeyring: masterBlob.wrappedKeyring,
    keyringNonce: masterBlob.keyringNonce,
    recovery: {
      kdfSalt: recoverySalt,
      kdfOpsLimit: KDF_OPS_LIMIT,
      kdfMemLimit: KDF_MEM_LIMIT,
      wrappedKeyring: recoveryBlob.wrappedKeyring,
      nonce: recoveryBlob.keyringNonce,
    },
    kit,
  };
}

export function VaultOnboarding({
  email,
  onCreated,
}: {
  email: string;
  onCreated: (session: VaultSession) => void;
}) {
  const [step, setStep] = useState<'password' | 'kit' | 'passkey'>('password');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [prepared, setPrepared] = useState<PreparedVault | null>(null);
  const [session, setSession] = useState<VaultSession | null>(null);
  const [acknowledged, setAcknowledged] = useState(false);
  const [pending, setPending] = useState<'prepare' | 'create' | 'passkey' | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const strength = passwordStrength(password);

  async function prepare() {
    setError('');
    if (!isMasterPasswordAcceptable(password)) {
      setError(
        `Usa al menos ${MASTER_PASSWORD_MIN_LENGTH} caracteres y evita contraseñas comunes o repetidas.`,
      );
      return;
    }
    if (password !== confirm) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setPending('prepare');
    await nextFrame();
    try {
      setPrepared(await buildVault(email, password));
      setPassword('');
      setConfirm('');
      setStep('kit');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setPending(null);
    }
  }

  async function createVault() {
    if (!prepared) return;
    setPending('create');
    setError('');
    try {
      const result = await vaultFetch<{
        vault: {
          kdfSalt: string;
          kdfOpsLimit: number;
          kdfMemLimit: number;
          publicKey: string;
          wrappedKeyring: string;
          keyringNonce: string;
          keyringVersion: number;
        };
      }>('/api/cuentas/vault', {
        method: 'POST',
        body: {
          kdfSalt: prepared.kdfSalt,
          kdfOpsLimit: prepared.kdfOpsLimit,
          kdfMemLimit: prepared.kdfMemLimit,
          authKey: toBase64(prepared.authKey),
          publicKey: prepared.keyring.pk,
          wrappedKeyring: prepared.wrappedKeyring,
          keyringNonce: prepared.keyringNonce,
          recovery: prepared.recovery,
        },
      });
      memzero(prepared.authKey);
      const nextSession = createSession(prepared.keyring, result.vault);
      setSession(nextSession);
      setStep('passkey');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setPending(null);
    }
  }

  async function addPasskey() {
    if (!prepared || !session) return;
    setPending('passkey');
    setError('');
    try {
      const options = await vaultFetch<PasskeyOptions>('/api/cuentas/passkeys/options', {
        method: 'POST',
        body: {},
      });
      const result = await registerPasskeyOnDevice({
        options: options.options,
        prfSalt: options.prfSalt,
        keyring: prepared.keyring,
      });
      await vaultFetch('/api/cuentas/passkeys', {
        method: 'POST',
        body: {
          response: result.response,
          prfSalt: options.prfSalt,
          wrappedKeyring: result.wrappedKeyring,
          keyringNonce: result.keyringNonce,
        },
      });
      onCreated(session);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setPending(null);
    }
  }

  if (step === 'kit' && prepared) {
    return (
      <section className="mx-auto w-full max-w-2xl border-t border-mist pt-8">
        <p className="text-xs tracking-wider2 text-ash">Paso 2 de 3 · Kit de recuperación</p>
        <h2 className="mt-3 font-display text-3xl leading-[0.95] tracking-editorial md:text-4xl">
          Guarda el kit offline
        </h2>
        <p className="mt-3 max-w-2xl text-sm text-ash">
          Es la única forma de recuperar la bóveda si olvidas la master password. Casa-os no
          guarda este código y no puede recuperarlo por ti.
        </p>

        <div className="mt-6 border border-mist bg-pearl p-5">
          <p className="text-xs tracking-wider2 text-ash">Código de recuperación</p>
          <code className="mt-3 block break-all font-mono text-base leading-relaxed text-ink">
            {prepared.kit.recoveryKey}
          </code>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button type="button" variant="ghost" onClick={() => downloadRecoveryKit(prepared.kit)}>
              Descargar kit .txt
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={async () => {
                await navigator.clipboard.writeText(prepared.kit.recoveryKey);
                setCopied(true);
              }}
            >
              {copied ? 'Copiado' : 'Copiar código'}
            </Button>
          </div>
        </div>

        <label className="mt-5 flex items-start gap-3 text-sm text-ink">
          <input
            type="checkbox"
            checked={acknowledged}
            onChange={(event) => setAcknowledged(event.target.checked)}
            className="mt-1 h-4 w-4 accent-ink"
          />
          <span>
            He guardado el kit en un lugar seguro. Entiendo que sin la master password ni el kit
            no hay recuperación posible.
          </span>
        </label>

        {error ? (
          <div className="mt-4">
            <Alert>{error}</Alert>
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-3">
          <Button type="button" onClick={createVault} disabled={!acknowledged || pending !== null}>
            {pending === 'create' ? 'Creando bóveda…' : 'Crear bóveda'}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setStep('password');
              setPrepared(null);
              setAcknowledged(false);
            }}
            disabled={pending !== null}
          >
            Volver
          </Button>
        </div>
      </section>
    );
  }

  if (step === 'passkey' && session) {
    return (
      <section className="mx-auto w-full max-w-2xl border-t border-mist pt-8">
        <p className="text-xs tracking-wider2 text-ash">Paso 3 de 3 · Passkey (opcional)</p>
        <h2 className="mt-3 font-display text-3xl leading-[0.95] tracking-editorial md:text-4xl">
          Desbloqueo con passkey
        </h2>
        <p className="mt-3 max-w-2xl text-sm text-ash">
          Si este dispositivo soporta PRF, podrás desbloquear la bóveda con tu passkey y el
          código 2FA. La master password seguirá funcionando siempre. Si el autenticador no
          soporta PRF, no se registra nada.
        </p>

        {error ? (
          <div className="mt-5">
            <Alert>{error}</Alert>
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-3">
          <Button type="button" onClick={addPasskey} disabled={pending !== null}>
            {pending === 'passkey' ? 'Esperando al autenticador…' : 'Añadir passkey'}
          </Button>
          <Button type="button" variant="ghost" onClick={() => onCreated(session)}>
            Ahora no
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-2xl border-t border-mist pt-8">
      <p className="text-xs tracking-wider2 text-ash">Paso 1 de 3 · Master password</p>
      <h1 className="mt-3 font-display text-4xl leading-[0.95] tracking-editorial md:text-5xl">
        Crea tu bóveda.
      </h1>
      <p className="mt-4 max-w-2xl text-sm text-ash">
        Casa-os no puede leer tus cuentas. La master password se queda en este navegador: el
        servidor solo recibe blobs cifrados y un verificador que no permite descifrar nada.
      </p>

      <div className="mt-6 grid max-w-xl gap-5">
        <Field
          label="Master password"
          htmlFor="vault-password"
          hint={`Mínimo ${MASTER_PASSWORD_MIN_LENGTH} caracteres. Mejor una frase de varias palabras.`}
        >
          <input
            id="vault-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="new-password"
            className="w-full border border-mist bg-canvas px-3 py-2.5 text-sm outline-none focus:border-ink"
          />
        </Field>

        <div aria-live="polite">
          <div className="flex gap-1">
            {[0, 1, 2, 3, 4].map((segment) => (
              <span
                key={segment}
                className={`h-1 flex-1 ${segment <= strength.score ? 'bg-ink' : 'bg-mist'}`}
              />
            ))}
          </div>
          <p className="mt-2 text-xs text-ash">
            {strength.label}
            {strength.suggestions.length > 0 ? ` · ${strength.suggestions[0]}` : ''}
          </p>
        </div>

        <Field label="Repite la master password" htmlFor="vault-password-confirm">
          <input
            id="vault-password-confirm"
            type="password"
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
            autoComplete="new-password"
            className="w-full border border-mist bg-canvas px-3 py-2.5 text-sm outline-none focus:border-ink"
          />
        </Field>

        {error ? <Alert>{error}</Alert> : null}

        <div>
          <Button
            type="button"
            onClick={prepare}
            disabled={pending !== null || password.length === 0}
          >
            {pending === 'prepare' ? 'Preparando claves…' : 'Continuar'}
          </Button>
        </div>
      </div>
    </section>
  );
}
