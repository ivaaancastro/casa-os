'use client';

import { useState } from 'react';
import {
  decryptKeyring,
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
import {
  decodeRecoveryCode,
  encodeRecoveryKey,
} from '@/lib/vault/recovery-code';
import { isMasterPasswordAcceptable, passwordStrength } from '@/lib/vault/password';
import type { RecoveryKit, VaultKeyring } from '@/lib/vault/types';
import { errorMessage, vaultFetch } from './api';
import { buildRecoveryKit, downloadRecoveryKit } from './kit';
import { createSession, type VaultSession } from './session';
import { Alert, Button, Field } from './ui';

interface RecoveryBlob {
  kdfSalt: string;
  kdfOpsLimit: number;
  kdfMemLimit: number;
  wrappedKeyring: string;
  nonce: string;
}

export function VaultRecovery({
  email,
  onCancel,
  onRecovered,
}: {
  email: string;
  onCancel: () => void;
  onRecovered: (session: VaultSession, kit: RecoveryKit) => void;
}) {
  const [code, setCode] = useState('');
  const [totp, setTotp] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [recovered, setRecovered] = useState<{
    session: VaultSession;
    kit: RecoveryKit;
  } | null>(null);

  const strength = passwordStrength(password);

  async function recover(event: React.FormEvent) {
    event.preventDefault();
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

    setPending(true);
    let recoveryKek: Uint8Array | null = null;
    let newKek: Uint8Array | null = null;
    let newRecoveryKek: Uint8Array | null = null;
    let recoveryKey: Uint8Array | null = null;
    try {
      const blob = await vaultFetch<{ recovery: RecoveryBlob }>('/api/cuentas/recovery');
      recoveryKey = await decodeRecoveryCode(code);
      recoveryKek = await deriveRecoveryKek(
        recoveryKey,
        blob.recovery.kdfSalt,
        blob.recovery.kdfOpsLimit,
        blob.recovery.kdfMemLimit,
      );
      const keyring = await decryptKeyring(
        blob.recovery.wrappedKeyring,
        blob.recovery.nonce,
        recoveryKek,
      );

      const newSalt = await generateSalt();
      const derived = await deriveMasterKeys(password, newSalt, KDF_OPS_LIMIT, KDF_MEM_LIMIT);
      newKek = derived.kek;

      const newRecoveryKey = await generateKey();
      const newRecoverySalt = await generateSalt();
      newRecoveryKek = await deriveRecoveryKek(
        newRecoveryKey,
        newRecoverySalt,
        KDF_OPS_LIMIT,
        KDF_MEM_LIMIT,
      );

      try {
        const masterBlob = await encryptKeyring(keyring, derived.kek);
        const newRecoveryBlob = await encryptKeyring(keyring, newRecoveryKek);

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
        }>('/api/cuentas/recovery/reset', {
          method: 'POST',
          body: {
            kdfSalt: newSalt,
            kdfOpsLimit: KDF_OPS_LIMIT,
            kdfMemLimit: KDF_MEM_LIMIT,
            authKey: toBase64(derived.authKey),
            wrappedKeyring: masterBlob.wrappedKeyring,
            keyringNonce: masterBlob.keyringNonce,
            code: totp,
            recovery: {
              kdfSalt: newRecoverySalt,
              kdfOpsLimit: KDF_OPS_LIMIT,
              kdfMemLimit: KDF_MEM_LIMIT,
              wrappedKeyring: newRecoveryBlob.wrappedKeyring,
              nonce: newRecoveryBlob.keyringNonce,
            },
          },
        });

        const kit = buildRecoveryKit({
          email,
          recoveryKey: await encodeRecoveryKey(newRecoveryKey),
        });
        const session = createSession(keyring, result.vault);
        setRecovered({ session, kit });
        setCode('');
        setTotp('');
        setPassword('');
        setConfirm('');
      } finally {
        memzero(newRecoveryKey);
      }
    } catch (err) {
      setError(
        err instanceof Error && /checksum|código/i.test(err.message)
          ? 'El código de recuperación no es válido. Revisa que esté completo.'
          : errorMessage(err),
      );
    } finally {
      memzero(recoveryKek);
      memzero(newKek);
      memzero(newRecoveryKek);
      memzero(recoveryKey);
      setPending(false);
    }
  }

  if (recovered) {
    return (
      <section className="mx-auto w-full max-w-2xl border-t border-mist pt-8">
        <p className="text-xs tracking-wider2 text-ash">Recuperación completada</p>
        <h1 className="mt-3 font-display text-4xl leading-[0.95] tracking-editorial md:text-5xl">
          Guarda el kit nuevo.
        </h1>
        <p className="mt-4 max-w-2xl text-sm text-ash">
          La master password se ha cambiado y las passkeys anteriores se han invalidado. El kit
          anterior ya no abre la bóveda: descarga y guarda este.
        </p>

        <div className="mt-6 border border-mist bg-pearl p-5">
          <p className="text-xs tracking-wider2 text-ash">Código de recuperación</p>
          <code className="mt-3 block break-all font-mono text-base leading-relaxed text-ink">
            {recovered.kit.recoveryKey}
          </code>
          <div className="mt-4">
            <Button type="button" variant="ghost" onClick={() => downloadRecoveryKit(recovered.kit)}>
              Descargar kit .txt
            </Button>
          </div>
        </div>

        <div className="mt-6">
          <Button type="button" onClick={() => onRecovered(recovered.session, recovered.kit)}>
            Entrar en la bóveda
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-2xl border-t border-mist pt-8">
      <p className="text-xs tracking-wider2 text-ash">Recuperación de la bóveda</p>
      <h1 className="mt-3 font-display text-4xl leading-[0.95] tracking-editorial md:text-5xl">
        Recupera el acceso.
      </h1>
      <p className="mt-4 max-w-2xl text-sm text-ash">
        Necesitas el código de recuperación de tu kit o el que te entregue tu contacto de
        confianza, además del código 2FA. Después elegirás una master password nueva. Las
        cuentas no cambian.
      </p>

      <form onSubmit={recover} className="mt-6 grid max-w-xl gap-5">
        <Field
          label="Código de recuperación"
          htmlFor="vault-recovery-code"
          hint="Empieza por CASAOS. Se aceptan minúsculas y espacios."
        >
          <textarea
            id="vault-recovery-code"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            rows={3}
            spellCheck={false}
            autoComplete="off"
            className="w-full resize-none border border-mist bg-canvas px-3 py-2.5 font-mono text-sm outline-none focus:border-ink"
          />
        </Field>

        <Field label="Código de verificación (2FA)" htmlFor="vault-recovery-totp">
          <input
            id="vault-recovery-totp"
            type="text"
            inputMode="numeric"
            value={totp}
            onChange={(event) => setTotp(event.target.value)}
            autoComplete="one-time-code"
            required
            className="w-full border border-mist bg-canvas px-3 py-2.5 text-sm outline-none focus:border-ink"
          />
        </Field>

        <Field
          label="Nueva master password"
          htmlFor="vault-recovery-password"
          hint={`Mínimo ${MASTER_PASSWORD_MIN_LENGTH} caracteres.`}
        >
          <input
            id="vault-recovery-password"
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

        <Field label="Repite la nueva master password" htmlFor="vault-recovery-confirm">
          <input
            id="vault-recovery-confirm"
            type="password"
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
            autoComplete="new-password"
            className="w-full border border-mist bg-canvas px-3 py-2.5 text-sm outline-none focus:border-ink"
          />
        </Field>

        {error ? <Alert>{error}</Alert> : null}

        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={pending}>
            {pending ? 'Recuperando…' : 'Recuperar bóveda'}
          </Button>
          <Button type="button" variant="ghost" onClick={onCancel} disabled={pending}>
            Volver
          </Button>
        </div>
      </form>
    </section>
  );
}
