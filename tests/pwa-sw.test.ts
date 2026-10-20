import { describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Evalúa `public/sw.js` con un `self` simulado para probar su política sin
 * arrancar un navegador. Los listeners de install/activate no se ejecutan;
 * el de fetch sí, para comprobar qué intercepta.
 */

type PwaApi = {
  CACHE_VERSION: string;
  CACHE_NAME: string;
  OFFLINE_URL: string;
  PRECACHE_URLS: string[];
  isNavigationRequest: (request: { method: string; mode: string }) => boolean;
};

const source = readFileSync(join(process.cwd(), 'public', 'sw.js'), 'utf8');
const listeners = new Map<string, (...args: never[]) => unknown>();

const cachesMock = {
  open: async () => ({
    addAll: async () => undefined,
    match: async () => null,
  }),
  keys: async () => [] as string[],
  delete: async () => true,
};

const selfMock = {
  addEventListener: (type: string, handler: (...args: never[]) => unknown) => {
    listeners.set(type, handler);
  },
  skipWaiting: async () => undefined,
  clients: { claim: async () => undefined },
  location: { origin: 'https://casa.test' },
  __casaOsPwa: undefined as PwaApi | undefined,
};

// eslint-disable-next-line no-new-func
new Function('self', 'caches', 'fetch', 'Response', source)(
  selfMock,
  cachesMock,
  () => Promise.reject(new Error('sin red')),
  class {},
);

const api = selfMock.__casaOsPwa as PwaApi;
const fetchHandler = listeners.get('fetch') as (event: {
  request: { method: string; mode: string };
  respondWith: (response: Promise<unknown>) => void;
}) => void;

function dispatchFetch(mode: string) {
  const respondWith = vi.fn();
  fetchHandler({ request: { method: 'GET', mode }, respondWith });
  return respondWith;
}

describe('service worker', () => {
  it('expone su configuración', () => {
    expect(api).toBeTruthy();
    expect(api.CACHE_NAME).toBe(`casa-os-${api.CACHE_VERSION}`);
    expect(api.OFFLINE_URL).toBe('/offline');
  });

  it('solo precachea la página offline', () => {
    expect(api.PRECACHE_URLS).toEqual(['/offline']);
    expect(api.PRECACHE_URLS.some((url) => url.startsWith('/api/'))).toBe(false);
  });

  it('trata solo navegaciones GET como navegaciones', () => {
    expect(api.isNavigationRequest({ method: 'GET', mode: 'navigate' })).toBe(true);
    expect(api.isNavigationRequest({ method: 'POST', mode: 'navigate' })).toBe(false);
    expect(api.isNavigationRequest({ method: 'GET', mode: 'cors' })).toBe(false);
    expect(api.isNavigationRequest({ method: 'GET', mode: 'same-origin' })).toBe(false);
  });

  it('registra install, activate y fetch', () => {
    expect(listeners.has('install')).toBe(true);
    expect(listeners.has('activate')).toBe(true);
    expect(listeners.has('fetch')).toBe(true);
  });

  it('intercepta las navegaciones', () => {
    expect(dispatchFetch('navigate')).toHaveBeenCalledTimes(1);
  });

  it('no intercepta APIs ni assets (solo navegaciones)', () => {
    expect(dispatchFetch('cors')).not.toHaveBeenCalled();
    expect(dispatchFetch('same-origin')).not.toHaveBeenCalled();
    expect(dispatchFetch('no-cors')).not.toHaveBeenCalled();
  });

  it('nunca guarda respuestas en la caché', () => {
    // La única escritura permitida es el precache de /offline (cache.addAll);
    // no debe haber cache.put de respuestas de red.
    expect(source).not.toMatch(/cache\.put\(/);
    expect(source).not.toMatch(/caches\.put\(/);
  });
});
