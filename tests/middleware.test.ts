import { describe, it, expect } from 'vitest';

/**
 * Tests del middleware de NextAuth.
 *
 * Valida que todas las rutas esten protegidas excepto las publicas:
 * login, callbacks de auth, health y los assets de la PWA.
 */

function isProtectedPath(pathname: string): boolean {
  // Ignorar archivos estaticos
  if (pathname.startsWith('/_next/') || pathname === '/favicon.ico') {
    return false;
  }

  // Ignorar rutas de auth
  if (pathname.startsWith('/auth/login')) return false;
  if (pathname.startsWith('/api/auth/')) return false;

  // Health publico (solo estado, sin datos)
  if (pathname.startsWith('/api/health')) return false;

  // La importacion de escaneo aplica requireAdmin y devuelve 401/403 JSON
  if (
    pathname === '/api/devices/import' ||
    pathname.startsWith('/api/devices/import/')
  ) {
    return false;
  }

  // La API de eventos aplica requireUser y devuelve 401 JSON
  if (pathname === '/api/events' || pathname.startsWith('/api/events/')) {
    return false;
  }

  // Cuentas aplica requireVaultUser y devuelve 401/403 JSON (nunca redirect)
  if (pathname === '/api/cuentas' || pathname.startsWith('/api/cuentas/')) {
    return false;
  }

  // Push y recordatorios aplican requireUser o CRON_SECRET y devuelven JSON
  if (pathname === '/api/push' || pathname.startsWith('/api/push/')) {
    return false;
  }
  if (
    pathname === '/api/reminders' ||
    pathname.startsWith('/api/reminders/')
  ) {
    return false;
  }

  // PWA: aviso sin conexion, service worker, manifest e iconos
  if (pathname === '/offline' || pathname.startsWith('/offline/')) return false;
  if (pathname === '/sw.js' || pathname === '/manifest.webmanifest') return false;
  if (pathname.startsWith('/icons/')) return false;

  // Todo lo demas esta protegido
  return true;
}

describe('proteccion de rutas', () => {
  it('debe proteger la raiz /', () => {
    expect(isProtectedPath('/')).toBe(true);
  });

  it('debe proteger /devices y subrutas', () => {
    expect(isProtectedPath('/devices')).toBe(true);
    expect(isProtectedPath('/devices/')).toBe(true);
    expect(isProtectedPath('/devices/123')).toBe(true);
  });

  it('debe proteger /notas y subrutas', () => {
    expect(isProtectedPath('/notas')).toBe(true);
    expect(isProtectedPath('/notas/')).toBe(true);
    expect(isProtectedPath('/notas/456')).toBe(true);
  });

  it('debe proteger rutas de API (excepto auth)', () => {
    expect(isProtectedPath('/api/notes')).toBe(true);
    expect(isProtectedPath('/api/notes/123')).toBe(true);
    expect(isProtectedPath('/api/devices')).toBe(true);
  });

  it('NO debe proteger /auth/login', () => {
    expect(isProtectedPath('/auth/login')).toBe(false);
  });

  it('NO debe proteger archivos estaticos', () => {
    expect(isProtectedPath('/_next/static/chunk.js')).toBe(false);
  });

  it('NO debe proteger favicon', () => {
    expect(isProtectedPath('/favicon.ico')).toBe(false);
  });

  it('NO debe proteger la API de auth', () => {
    expect(isProtectedPath('/api/auth/callback/credentials')).toBe(false);
    expect(isProtectedPath('/api/auth/session')).toBe(false);
    expect(isProtectedPath('/api/auth/csrf')).toBe(false);
  });

  it('NO debe proteger /api/health (estado publico)', () => {
    expect(isProtectedPath('/api/health')).toBe(false);
  });

  it('deja la importacion de escaneo al guard de la ruta', () => {
    expect(isProtectedPath('/api/devices/import')).toBe(false);
    expect(isProtectedPath('/api/devices/import/')).toBe(false);
    expect(isProtectedPath('/api/devices/import-extra')).toBe(true);
  });

  it('deja la API de eventos al guard de la ruta', () => {
    expect(isProtectedPath('/api/events')).toBe(false);
    expect(isProtectedPath('/api/events/evt_1')).toBe(false);
    expect(isProtectedPath('/api/events-extra')).toBe(true);
  });

  it('deja Cuentas a su guard para devolver 401/403 JSON', () => {
    expect(isProtectedPath('/api/cuentas/status')).toBe(false);
    expect(isProtectedPath('/api/cuentas/accounts/acc_1')).toBe(false);
    expect(isProtectedPath('/api/cuentas-extra')).toBe(true);
  });

  it('deja push y recordatorios a sus guards', () => {
    expect(isProtectedPath('/api/push/config')).toBe(false);
    expect(isProtectedPath('/api/push/subscriptions')).toBe(false);
    expect(isProtectedPath('/api/push/subscriptions/sub_1')).toBe(false);
    expect(isProtectedPath('/api/push-extra')).toBe(true);

    expect(isProtectedPath('/api/reminders/upcoming')).toBe(false);
    expect(isProtectedPath('/api/reminders/dispatch')).toBe(false);
    expect(isProtectedPath('/api/reminders-extra')).toBe(true);
  });

  it('NO debe proteger la pagina offline', () => {
    expect(isProtectedPath('/offline')).toBe(false);
    expect(isProtectedPath('/offline/')).toBe(false);
  });

  it('NO debe proteger los assets de la PWA', () => {
    expect(isProtectedPath('/sw.js')).toBe(false);
    expect(isProtectedPath('/manifest.webmanifest')).toBe(false);
    expect(isProtectedPath('/icons/icon-192.png')).toBe(false);
  });

  it('debe proteger rutas que solo empiezan por "offline"', () => {
    expect(isProtectedPath('/offline-extra')).toBe(true);
  });
});
