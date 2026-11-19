'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { vaultFetch } from './api';
import {
  AutoLockController,
  readAutoLockMinutes,
  type VaultLockReason,
} from './session-lifecycle';
import { destroySession, type VaultSession } from './session';

type VaultSessionContextValue = {
  session: VaultSession | null;
  lockReason: VaultLockReason | null;
  unlock: (session: VaultSession) => void;
  lock: (reason?: VaultLockReason) => void;
  clearLockReason: () => void;
  autoLockMinutes: number;
};

const VaultSessionContext = createContext<VaultSessionContextValue | null>(null);

/**
 * Mantiene la bóveda desbloqueada mientras la app sigue en primer plano.
 *
 * Se monta en el layout raíz (AppShell), así que cambiar de pestaña no lo
 * desmonta: la clave descifrada sobrevive a la navegación. Se bloquea al salir
 * de la app (background / cierre), por inactividad o manualmente. Las claves
 * nunca se persisten; `destroySession` las cerra en memoria con `memzero`.
 */
export function VaultSessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<VaultSession | null>(null);
  const [lockReason, setLockReason] = useState<VaultLockReason | null>(null);
  const sessionRef = useRef<VaultSession | null>(null);
  const controllerRef = useRef<AutoLockController | null>(null);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  const lock = useCallback((reason: VaultLockReason = 'manual') => {
    const current = sessionRef.current;
    controllerRef.current?.disarm();
    destroySession(current);
    sessionRef.current = null;
    setSession(null);
    setLockReason(reason);
    // Limpia el grant del servidor aunque ya no quede sesión local.
    void vaultFetch('/api/cuentas/lock', { method: 'POST' }).catch(() => undefined);
  }, []);

  const unlock = useCallback(
    (next: VaultSession) => {
      controllerRef.current?.disarm();
      const current = sessionRef.current;
      if (current && current !== next) destroySession(current);
      sessionRef.current = next;
      setSession(next);
      setLockReason(null);

      const minutes = readAutoLockMinutes((key) =>
        typeof window === 'undefined' ? null : window.localStorage.getItem(key),
      );
      controllerRef.current = new AutoLockController({
        minutes,
        onInactivity: () => lock('inactivity'),
      });
      controllerRef.current.arm();
    },
    [lock],
  );

  // Cualquier actividad rearma el temporizador de inactividad.
  useEffect(() => {
    if (!session) return undefined;
    const onActivity = () => controllerRef.current?.arm();
    const onVisible = () => {
      if (document.visibilityState === 'visible') onActivity();
    };
    window.addEventListener('pointerdown', onActivity, { passive: true });
    window.addEventListener('keydown', onActivity);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.removeEventListener('pointerdown', onActivity);
      window.removeEventListener('keydown', onActivity);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [session]);

  // Salir de la app (cambiar de app, bloquear pantalla, cerrar pestaña) bloquea.
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') lock('background');
    };
    const onPageHide = () => lock('background');
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', onPageHide);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', onPageHide);
    };
  }, [lock]);

  // Desmontaje completo: descarta los secretos sin hacer peticiones de red.
  useEffect(
    () => () => {
      controllerRef.current?.dispose();
      destroySession(sessionRef.current);
      sessionRef.current = null;
    },
    [],
  );

  const value = useMemo<VaultSessionContextValue>(
    () => ({
      session,
      lockReason,
      unlock,
      lock,
      clearLockReason: () => setLockReason(null),
      autoLockMinutes: readAutoLockMinutes((key) =>
        typeof window === 'undefined' ? null : window.localStorage.getItem(key),
      ),
    }),
    [session, lockReason, unlock, lock],
  );

  return (
    <VaultSessionContext.Provider value={value}>
      {children}
    </VaultSessionContext.Provider>
  );
}

export function useVaultSession(): VaultSessionContextValue {
  const context = useContext(VaultSessionContext);
  if (!context) {
    throw new Error('useVaultSession debe usarse dentro de VaultSessionProvider');
  }
  return context;
}
