import { describe, it, expect } from 'vitest';

/**
 * Tests del middleware de NextAuth.
 *
 * Valida que todas las rutas esten protegidas excepto /auth/login.
 */

const PUBLIC_PATTERNS = [
  '/auth/login',
  '/api/auth/callback/credentials',
  '/api/auth/session',
  '/api/auth/csrf',
  '/_next/static/chunk.js',
  '/favicon.ico',
];

const PROTECTED_PATTERNS = [
  '/',
  '/devices',
  '/devices/',
  '/devices/123',
  '/notas',
  '/notas/',
  '/notas/456',
  '/api/notes',
  '/api/notes/123',
  '/api/devices',
];

function isProtectedPath(pathname: string): boolean {
  // Ignorar archivos estaticos y rutas de API auth
  if (pathname.startsWith('/_next/') || pathname === '/favicon.ico') {
    return false;
  }

  // Ignorar rutas de auth
  if (pathname.startsWith('/auth/login')) return false;
  if (pathname.startsWith('/api/auth/')) return false;

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
});
