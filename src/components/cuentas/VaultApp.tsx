'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { DEFAULT_AUTO_LOCK_MINUTES } from '@/lib/vault/constants';
import type { VaultStatusResponse } from '@/lib/vault/types';
import { errorMessage, vaultFetch } from './api';
import { destroySession, type VaultSession } from './session';
import { Alert, Spinner } from './ui';
import { VaultOnboarding } from './VaultOnboarding';
import { VaultRecovery } from './VaultRecovery';
import { VaultUnlock } from './VaultUnlock';
import { VaultWorkspace } from './VaultWorkspace';

const AUTO_LOCK_KEY = 'casa-os:cuentas:auto-lock';

function autoLockMinutes(): number {
  if (typeof window === 'undefined') return DEFAULT_AUTO_LOCK_MINUTES;
  const stored = Number(window.localStorage.getItem(AUTO_LOCK_KEY));
  return Number.isFinite(stored) && stored >= 1 && stored <= 15
    ? stored
    : DEFAULT_AUTO_LOCK_MINUTES;
}

export function VaultApp({
  userId,
  email,
}: {
  userId: string;
  email: string;
}) {
  const [status, setStatus] = useState<VaultStatusResponse | null>(null);
  const [session, setSession] = useState<VaultSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [recovering, setRecovering] = useState(false);
  const sessionRef = useRef<VaultSession | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  const refreshStatus = useCallback(async () => {
    try {
      const result = await vaultFetch<VaultStatusResponse>('/api/cuentas/status');
      setStatus(result);
      setError('');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshStatus();
  }, [refreshStatus]);

  const lock = useCallback(
    (message: string) => {
      destroySession(sessionRef.current);
      sessionRef.current = null;
      setSession(null);
      setRecovering(false);
      setNotice(message);
      void vaultFetch('/api/cuentas/lock', { method: 'POST' }).catch(() => undefined);
      void refreshStatus();
    },
    [refreshStatus],
  );

  useEffect(() => {
    if (!session) return undefined;

    const minutes = autoLockMinutes();
    const arm = () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(
        () =>
          lock('La bóveda se ha bloqueado por inactividad. Vuelve a introducir la master password.'),
        minutes * 60_000,
      );
    };

    const onActivity = () => arm();
    const onVisibility = () => {
      if (document.visibilityState === 'visible') arm();
    };

    arm();
    window.addEventListener('pointerdown', onActivity, { passive: true });
    window.addEventListener('keydown', onActivity);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
      window.removeEventListener('pointerdown', onActivity);
      window.removeEventListener('keydown', onActivity);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [session, lock]);

  // Los secretos se descartan si la pestaña se cierra o el componente se desmonta.
  useEffect(
    () => () => {
      destroySession(sessionRef.current);
    },
    [],
  );

  if (loading && !status) {
    return (
      <div className="mx-auto w-full max-w-7xl px-5 py-16 md:px-10 lg:px-16">
        <Spinner label="Comprobando la bóveda" />
      </div>
    );
  }

  if (error && !status) {
    return (
      <div className="mx-auto w-full max-w-2xl px-5 py-16 md:px-10">
        <Alert>{error}</Alert>
        <div className="mt-4">
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              void refreshStatus();
            }}
            className="border border-mist px-4 py-2.5 text-sm transition-colors hover:border-ink"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (!status) return null;

  if (!status.twoFactorEnabled) {
    return (
      <div className="mx-auto w-full max-w-2xl px-5 py-16 md:px-10">
        <p className="text-xs tracking-wider2 text-ash">Cuentas</p>
        <h1 className="mt-3 font-display text-4xl leading-[0.95] tracking-editorial md:text-5xl">
          Activa el 2FA primero.
        </h1>
        <p className="mt-4 text-sm text-ash">
          La bóveda exige un segundo factor en cada desbloqueo. Actívalo en Perfil → Seguridad y
          vuelve aquí. Sin 2FA el servidor rechaza crear o abrir la bóveda.
        </p>
        <a
          href="/perfil"
          className="mt-6 inline-flex border border-ink bg-ink px-4 py-2.5 text-sm text-canvas transition-colors hover:bg-ash"
        >
          Ir a Perfil → Seguridad
        </a>
      </div>
    );
  }

  if (!status.vault) {
    if (recovering) {
      return (
        <div className="px-5 py-8 md:px-10 lg:px-16">
          <VaultRecovery
            email={email}
            onCancel={() => setRecovering(false)}
            onRecovered={async (nextSession) => {
              setSession(nextSession);
              setRecovering(false);
              setNotice('Bóveda recuperada. Guarda el kit nuevo si aún no lo has hecho.');
              await refreshStatus();
            }}
          />
        </div>
      );
    }
    return (
      <div className="px-5 py-8 md:px-10 lg:px-16">
        <VaultOnboarding
          email={email}
          onCreated={async (nextSession) => {
            setSession(nextSession);
            setNotice('');
            await refreshStatus();
          }}
        />
      </div>
    );
  }

  if (recovering) {
    return (
      <div className="px-5 py-8 md:px-10 lg:px-16">
        <VaultRecovery
          email={email}
          onCancel={() => setRecovering(false)}
          onRecovered={async (nextSession) => {
            setSession(nextSession);
            setRecovering(false);
            setNotice('Bóveda recuperada. Las passkeys anteriores se han invalidado.');
            await refreshStatus();
          }}
        />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="px-5 py-8 md:px-10 lg:px-16">
        <VaultUnlock
          email={email}
          vault={status.vault}
          notice={notice || (status.grantActive ? 'La sesión de la bóveda caducó. Vuelve a desbloquearla.' : undefined)}
          onUnlocked={async (nextSession) => {
            setSession(nextSession);
            setNotice('');
            await refreshStatus();
          }}
          onRecovery={() => {
            setNotice('');
            setRecovering(true);
          }}
        />
      </div>
    );
  }

  return (
    <VaultWorkspace
      status={{ ...status, vault: status.vault }}
      session={session}
      userId={userId}
      email={email}
      onLocked={lock}
      onRefreshStatus={refreshStatus}
      onSessionReplaced={(nextSession) => setSession(nextSession)}
      onVaultDeleted={async () => {
        destroySession(sessionRef.current);
        sessionRef.current = null;
        setSession(null);
        setNotice('La bóveda se ha borrado. Puedes crear una nueva cuando quieras.');
        await refreshStatus();
        void vaultFetch('/api/cuentas/lock', { method: 'POST' }).catch(() => undefined);
      }}
    />
  );
}
