'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
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
  isPasskeyCancellation,
  platformAuthenticatorAvailable,
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
  const [softError, setSoftError] = useState('');
  const [showPassword, setShowPassword] = useState(vault.passkeys.length === 0);
  const [biometricLabel, setBiometricLabel] = useState('Desbloquear con biometría');
  const autoAttempted = useRef(false);

  const hasPasskeys = vault.passkeys.length > 0;

  useEffect(() => {
    let active = true;
    void platformAuthenticatorAvailable().then((available) => {
      if (!active) return;
      setBiometricLabel(
        available ? 'Desbloquear con Face ID / Huella' : 'Desbloquear con passkey',
      );
    });
    return () => {
      active = false;
    };
  }, []);

  const attemptPasskey = useCallback(async () => {
    setError('');
    setSoftError('');
    setPending('passkey');
    let passkeyKey: Uint8Array | null = null;
    try {
      // Fase 2: sin TOTP. WebAuthn con verificación de usuario es el 2º factor.
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
        body: { response: assertion.response },
      });
      const blob = result.vault.passkeyKeyring;
      if (!blob) throw new Error('La passkey no tiene una copia válida de la bóveda');
      const keyring = await decryptPasskeyKeyring({
        wrappedKeyring: blob.wrappedKeyring,
        keyringNonce: blob.nonce,
        passkeyKey,
      });
      onUnlocked(createSession(keyring, result.vault));
    } catch (err) {
      if (isPasskeyCancellation(err)) {
        setSoftError('Desbloqueo biométrico cancelado.');
      } else {
        setSoftError('No se pudo desbloquear con biometría en este dispositivo.');
        setError(errorMessage(err));
      }
    } finally {
      memzero(passkeyKey);
      setPending(null);
    }
  }, [passkeyId, onUnlocked]);

  // Decisión 3: se intenta la biometría al entrar, una sola vez por montaje.
  useEffect(() => {
    if (!hasPasskeys || autoAttempted.current || showPassword) return;
    autoAttempted.current = true;
    void attemptPasskey();
  }, [hasPasskeys, showPassword, attemptPasskey]);

  async function unlockWithPassword(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    setSoftError('');
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

  return (
    <section className="mx-auto w-full max-w-xl border-t border-mist/60 pt-6 md:pt-8">
      <p className="mb-3 text-[13px] tracking-wider2 text-ash">
        Cuentas · bóveda bloqueada
      </p>
      <h1 className="font-ui text-xl font-medium leading-tight text-ink md:font-display md:text-5xl md:leading-[0.95] md:tracking-editorial">
        Desbloquea tus cuentas.
      </h1>
      <p className="mt-3 max-w-prose text-sm text-ash">
        {email} · La bóveda se bloquea al salir de la app o tras 15 minutos de
        inactividad.
      </p>

      <p className="sr-only" role="status" aria-live="polite">
        {pending === 'passkey'
          ? 'Esperando a la huella o Face ID'
          : pending === 'password'
            ? 'Desbloqueando con contraseña'
            : ''}
      </p>

      {notice ? (
        <div className="mt-5">
          <Alert tone="warning">{notice}</Alert>
        </div>
      ) : null}

      {hasPasskeys ? (
        <div className="mt-6">
          <button
            type="button"
            onClick={() => void attemptPasskey()}
            disabled={pending !== null}
            aria-label={biometricLabel}
            className="flex min-h-14 w-full items-center justify-center gap-3 bg-accent px-5 text-sm text-white transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <svg
              aria-hidden="true"
              className="h-5 w-5 shrink-0"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              viewBox="0 0 24 24"
            >
              <rect x="5" y="2.5" width="14" height="19" rx="2" />
              <circle cx="12" cy="11" r="2.5" />
              <path d="M10 17.5h4" />
            </svg>
            {pending === 'passkey' ? 'Esperando al autenticador…' : biometricLabel}
          </button>

          {vault.passkeys.length > 1 ? (
            <div className="mt-3">
              <label htmlFor="vault-unlock-passkey" className="block text-xs text-ash">
                Passkey
              </label>
              <select
                id="vault-unlock-passkey"
                value={passkeyId}
                onChange={(event) => setPasskeyId(event.target.value)}
                className="mt-1 w-full border border-mist/60 bg-canvas px-3 py-2.5 text-sm outline-none focus:border-ink"
              >
                {vault.passkeys.map((passkey, index) => (
                  <option key={passkey.id} value={passkey.id}>
                    Passkey {index + 1}
                    {passkey.lastUsedAt ? ' · usada recientemente' : ''}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          {softError ? <p className="mt-3 text-xs text-ash">{softError}</p> : null}

          {!showPassword ? (
            <button
              type="button"
              onClick={() => {
                setShowPassword(true);
                setSoftError('');
                setError('');
              }}
              className="mt-3 flex min-h-11 items-center text-sm text-ink underline decoration-mist underline-offset-4 transition-colors hover:decoration-ink"
            >
              Usar la master password
            </button>
          ) : null}
        </div>
      ) : (
        <p className="mt-6 border-t border-mist/60 pt-4 text-sm text-ash">
          No hay desbloqueo biométrico configurado en este dispositivo. Usa tu
          master password.
        </p>
      )}

      {showPassword ? (
        <form onSubmit={unlockWithPassword} className="mt-6 grid gap-4 border-t border-mist/60 pt-6">
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
              className="w-full border border-mist/60 bg-canvas px-3 py-2.5 text-sm outline-none focus:border-ink"
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
              className="w-full border border-mist/60 bg-canvas px-3 py-2.5 text-sm outline-none focus:border-ink"
            />
          </Field>

          {error && !softError ? <Alert>{error}</Alert> : null}

          <Button type="submit" disabled={pending !== null}>
            {pending === 'password' ? 'Desbloqueando…' : 'Desbloquear'}
          </Button>
        </form>
      ) : null}

      <div className="mt-6 border-t border-mist/60 pt-5">
        <button
          type="button"
          onClick={onRecovery}
          className="flex min-h-11 items-center text-sm text-ink underline decoration-mist underline-offset-4 transition-colors hover:decoration-ink"
        >
          He olvidado la master password
        </button>
      </div>
    </section>
  );
}
