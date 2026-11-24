'use client';

import { useCallback, useEffect, useState } from 'react';
import type { VaultStatusResponse } from '@/lib/vault/types';
import { errorMessage, vaultFetch } from './api';
import { useVaultSession } from './VaultSessionProvider';
import type { VaultLockReason } from './session-lifecycle';
import { Alert, Spinner } from './ui';
import { VaultOnboarding } from './VaultOnboarding';
import { VaultRecovery } from './VaultRecovery';
import { VaultUnlock } from './VaultUnlock';
import { VaultWorkspace } from './VaultWorkspace';

export function VaultApp({
  userId,
  email,
}: {
  userId: string;
  email: string;
}) {
  const { session, lockReason, unlock, lock } = useVaultSession();
  const [status, setStatus] = useState<VaultStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [recovering, setRecovering] = useState(false);

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

  // El provider bloquea por background/inactividad: el aviso se decide aquí.
  useEffect(() => {
    if (lockReason === 'inactivity') {
      setNotice('La bóveda se ha bloqueado por inactividad. Vuelve a desbloquearla.');
    } else if (lockReason === 'background') {
      setNotice('La bóveda se ha bloqueado al salir de la app. Vuelve a desbloquearla.');
    }
  }, [lockReason]);

  const lockWithNotice = useCallback(
    (reason: VaultLockReason, message: string) => {
      lock(reason);
      setRecovering(false);
      setNotice(message);
      void refreshStatus();
    },
    [lock, refreshStatus],
  );

  const handleUnlocked = useCallback(
    async (nextSession: Parameters<typeof unlock>[0]) => {
      unlock(nextSession);
      setNotice('');
      await refreshStatus();
      // El botón de desbloqueo desaparece: llevar el foco al buscador evita que
      // quede en una tarjeta y se lea como selección (hallazgo P2 de auditoría).
      requestAnimationFrame(() => {
        document.getElementById('cuentas-search')?.focus();
      });
    },
    [unlock, refreshStatus],
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
            className="border border-mist/60 px-4 py-2.5 text-sm transition-colors hover:border-ink"
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
        <h1 className="mt-3 font-ui text-xl font-medium leading-tight text-ink md:font-display md:text-5xl md:leading-[0.95] md:tracking-editorial">
          Activa el 2FA primero.
        </h1>
        <p className="mt-4 text-sm text-ash">
          La bóveda exige un segundo factor en cada desbloqueo con contraseña.
          Actívalo en Perfil → Seguridad y vuelve aquí. Sin 2FA el servidor
          rechaza crear o abrir la bóveda.
        </p>
        <a
          href="/perfil"
          className="mt-6 inline-flex border border-accent bg-accent px-4 py-2.5 text-sm text-white transition-colors hover:opacity-90"
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
              await handleUnlocked(nextSession);
              setRecovering(false);
              setNotice('Bóveda recuperada. Guarda el kit nuevo si aún no lo has hecho.');
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
            await handleUnlocked(nextSession);
            setNotice('');
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
            await handleUnlocked(nextSession);
            setRecovering(false);
            setNotice('Bóveda recuperada. Las passkeys anteriores se han invalidado.');
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
          onUnlocked={handleUnlocked}
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
      onLocked={(message) => lockWithNotice('manual', message)}
      onRefreshStatus={refreshStatus}
      onSessionReplaced={(nextSession) => unlock(nextSession)}
      onVaultDeleted={async () => {
        lockWithNotice(
          'deleted',
          'La bóveda se ha borrado. Puedes crear una nueva cuando quieras.',
        );
      }}
    />
  );
}
