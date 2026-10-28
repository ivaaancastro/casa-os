'use client';

import { useState } from 'react';
import {
  decryptKeyring,
  deriveMasterKeys,
  memzero,
  toBase64,
} from '@/lib/vault/crypto';
import type { VaultStatusResponse } from '@/lib/vault/types';
import { errorMessage, vaultFetch } from './api';
import {
  authenticatePasskeyOnDevice,
  decryptPasskeyKeyring,
} from './passkey';
import { createSession, type VaultSession } from './session';
import { Alert, Button, Field } from './ui';

type VaultBlob = NonNullable<VaultStatusResponse['vault']>;

interface UnlockedResponse {
  vault: {
    kdfSalt: string;
    kdfOpsLimit: number;
    kdfMemLimit: number;
    publicKey: string;
    wrappedKeyring: string;
    keyringNonce: string;
    keyringVersion: number;
    passkeyKeyring?: { wrappedKeyring: string; nonce: string };
  };
}

interface PasskeyOptionsResponse {
  options: Parameters<typeof authenticatePasskeyOnDevice>[0]['options'];
  prfSalt: string;
  passkeyId: string;
}

export function VaultUnlock({
  email,
  vault,
  notice,
  onUnlocked,
  onRecovery,
}: {
  email: string;
  vault: VaultBlob;
  notice?: string;
  onUnlocked: (session: VaultSession) => void;
  onRecovery: () => void;
}) {
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [passkeyId, setPasskeyId] = useState(vault.passkeys[0]?.id ?? '');
  const [pending, setPending] = useState<'password' | 'passkey' | null>(null);
  const [error, setError] = useState('');

  async function unlockWithPassword(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    setPending('password');
    let kek: Uint8Array | null = null;
    try {
      const derived = await deriveMasterKeys(
        password,
        vault.kdfSalt,
        vault.kdfOpsLimit,
        vault.kdfMemLimit,
      );
      kek = derived.kek;
      const result = await vaultFetch<UnlockedResponse>('/api/cuentas/unlock', {
        method: 'POST',
        body: { authKey: toBase64(derived.authKey), code },
      });
      const keyring = await decryptKeyring(
        result.vault.wrappedKeyring,
        result.vault.keyringNonce,
        derived.kek,
      );
      onUnlocked(createSession(keyring, result.vault));
      setPassword('');
      setCode('');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      memzero(kek);
      setPending(null);
    }
  }

  async function unlockWithPasskey() {
    setError('');
    if (!code.trim()) {
      setError('Introduce el código de verificación para usar la passkey.');
      return;
    }
    setPending('passkey');
    let passkeyKey: Uint8Array | null = null;
    try {
      const options = await vaultFetch<PasskeyOptionsResponse>(
        '/api/cuentas/unlock/passkey/options',
        { method: 'POST', body: passkeyId ? { passkeyId } : {} },
      );
      const assertion = await authenticatePasskeyOnDevice({
        options: options.options,
        prfSalt: options.prfSalt,
      });
      passkeyKey = assertion.passkeyKey;
      const result = await vaultFetch<UnlockedResponse>('/api/cuentas/unlock/passkey', {
        method: 'POST',
        body: { response: assertion.response, code },
      });
      const blob = result.vault.passkeyKeyring;
      if (!blob) throw new Error('La passkey no tiene una copia válida de la bóveda');
      const keyring = await decryptPasskeyKeyring({
        wrappedKeyring: blob.wrappedKeyring,
        keyringNonce: blob.nonce,
        passkeyKey,
      });
      onUnlocked(createSession(keyring, result.vault));
      setCode('');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      memzero(passkeyKey);
      setPending(null);
    }
  }

  return (
    <section className="mx-auto w-full max-w-xl border-t border-mist pt-8">
      <p className="text-xs tracking-wider2 text-ash">Bóveda bloqueada</p>
      <h1 className="mt-3 font-display text-4xl leading-[0.95] tracking-editorial md:text-5xl">
        Desbloquea
        <br />
        tus cuentas.
      </h1>
      <p className="mt-4 max-w-prose text-sm text-ash">
        {email} · La master password y el código se comprueban aquí y en el servidor. La
        bóveda se bloquea sola tras unos minutos de inactividad.
      </p>

      {notice ? (
        <div className="mt-5">
          <Alert tone="warning">{notice}</Alert>
        </div>
      ) : null}

      <form onSubmit={unlockWithPassword} className="mt-6 grid gap-5">
        <Field
          label="Master password"
          htmlFor="vault-unlock-password"
          hint="Se queda en este navegador; solo viaja un verificador derivado."
        >
          <input
            id="vault-unlock-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
            className="w-full border border-mist bg-canvas px-3 py-2.5 text-sm outline-none focus:border-ink"
          />
        </Field>

        <Field
          label="Código de verificación (2FA)"
          htmlFor="vault-unlock-code"
          hint="TOTP de 6 dígitos o uno de tus códigos de recuperación."
        >
          <input
            id="vault-unlock-code"
            type="text"
            inputMode="numeric"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            autoComplete="one-time-code"
            required
            className="w-full border border-mist bg-canvas px-3 py-2.5 text-sm outline-none focus:border-ink"
          />
        </Field>

        {error ? <Alert>{error}</Alert> : null}

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={pending !== null}>
            {pending === 'password' ? 'Desbloqueando…' : 'Desbloquear'}
          </Button>

          {vault.passkeys.length > 0 ? (
            <Button
              type="button"
              variant="ghost"
              onClick={unlockWithPasskey}
              disabled={pending !== null}
            >
              {pending === 'passkey' ? 'Esperando passkey…' : 'Usar passkey'}
            </Button>
          ) : null}
        </div>

        {vault.passkeys.length > 1 ? (
          <Field label="Passkey" htmlFor="vault-unlock-passkey">
            <select
              id="vault-unlock-passkey"
              value={passkeyId}
              onChange={(event) => setPasskeyId(event.target.value)}
              className="w-full border border-mist bg-canvas px-3 py-2.5 text-sm outline-none focus:border-ink"
            >
              {vault.passkeys.map((passkey, index) => (
                <option key={passkey.id} value={passkey.id}>
                  Passkey {index + 1}
                  {passkey.lastUsedAt ? ' · usada recientemente' : ''}
                </option>
              ))}
            </select>
          </Field>
        ) : null}
      </form>

      <div className="mt-6 border-t border-mist pt-5">
        <button
          type="button"
          onClick={onRecovery}
          className="text-sm text-ink underline decoration-mist underline-offset-4 transition-colors hover:decoration-ink"
        >
          He olvidado la master password
        </button>
      </div>
    </section>
  );
}
