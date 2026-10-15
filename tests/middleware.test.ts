import { describe, it, expect } from 'vitest';

/**
 * Tests del middleware de NextAuth.
 * 
 * Nota: El middleware real usa next-auth/middleware que requiere
 * un entorno de Next.js completo. Estos tests validan la lógica
 * de protección de rutas de forma aislada.
 */

const PROTECTED_PATTERNS = [
  '/devices',
  '/devices/',
  '/devices/123',
  '/notas',
  '/notas/',
  '/api/devices',
  '/api/notes',
];

const PUBLIC_PATTERNS = [
  '/auth/login',
  '/',
  '/_next/static/chunk.js',
];

function isProtectedPath(pathname: string): boolean {
  // Ignorar archivos estáticos y rutas de API auth
  if (pathname.startsWith('/_next/') || pathname.startsWith('/api/auth/')) {
    return false;
  }

  // Rutas protegidas
  if (pathname.startsWith('/devices')) return true;
  if (pathname.startsWith('/notas')) return true;
  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/auth/')) return true;

  return false;
}

describe('protección de rutas', () => {
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
    expect(isProtectedPath('/api/devices')).toBe(true);
    expect(isProtectedPath('/api/notes')).toBe(true);
  });

  it('NO debe proteger /auth/login', () => {
    expect(isProtectedPath('/auth/login')).toBe(false);
  });

  it('NO debe proteger archivos estáticos', () => {
    expect(isProtectedPath('/_next/static/chunk.js')).toBe(false);
  });

  it('NO debe proteger la API de auth', () => {
    expect(isProtectedPath('/api/auth/callback/credentials')).toBe(false);
    expect(isProtectedPath('/api/auth/session')).toBe(false);
  });

  it('NO debe proteger la raíz /', () => {
    expect(isProtectedPath('/')).toBe(false);
  });
});
