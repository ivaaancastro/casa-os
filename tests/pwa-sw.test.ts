import { describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Evalúa `public/sw.js` con un `self` simulado para probar su política sin
 * arrancar un navegador. Los listeners de install/activate no se ejecutan;
 * fetch se llama directamente y push/notificationclick se simulan.
 */

type PushPayload = {
  title: string;
  body: string;
  url: string;
  tag: string;
};

type PwaApi = {
  CACHE_VERSION: string;
  CACHE_NAME: string;
  OFFLINE_URL: string;
  PRECACHE_URLS: string[];
  DEFAULT_NOTIFICATION: PushPayload;
  isNavigationRequest: (request: { method: string; mode: string }) => boolean;
  parsePushPayload: (raw: unknown) => PushPayload;
  safeNotificationUrl: (raw: unknown) => string;
};

type PushEvent = {
  data?: {
    json: () => unknown;
    text: () => string;
  };
  waitUntil: (promise: Promise<unknown>) => void;
};

type NotificationClickEvent = {
  notification: {
    close: () => void;
    data?: { url?: string };
  };
  waitUntil: (promise: Promise<unknown>) => void;
};

const source = readFileSync(join(process.cwd(), 'public', 'sw.js'), 'utf8');
const listeners = new Map<string, (...args: never[]) => unknown>();

const showNotification = vi.fn(async () => undefined);
const matchAll = vi.fn(async () => [] as unknown[]);
const openWindow = vi.fn(async () => null);

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
  registration: { showNotification },
  clients: { claim: async () => undefined, matchAll, openWindow },
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
const pushHandler = listeners.get('push') as (event: PushEvent) => void;
const notificationClickHandler = listeners.get('notificationclick') as (
  event: NotificationClickEvent,
) => void;

function dispatchFetch(mode: string) {
  const respondWith = vi.fn();
  fetchHandler({ request: { method: 'GET', mode }, respondWith });
  return respondWith;
}

function dispatchPush(data?: PushEvent['data']) {
  const waitUntil = vi.fn();
  pushHandler({ data, waitUntil });
  return waitUntil.mock.calls[0][0] as Promise<unknown>;
}

function dispatchNotificationClick(data?: { url?: string }) {
  const close = vi.fn();
  const waitUntil = vi.fn();
  notificationClickHandler({
    notification: { close, data },
    waitUntil,
  });
  return {
    close,
    promise: waitUntil.mock.calls[0][0] as Promise<unknown>,
  };
}

describe('service worker', () => {
  it('expone su configuración', () => {
    expect(api).toBeTruthy();
    expect(api.CACHE_NAME).toBe(`casa-os-${api.CACHE_VERSION}`);
    expect(api.OFFLINE_URL).toBe('/offline');
    expect(api.CACHE_VERSION).toBe('v2');
  });

  it('solo precachea la página offline', () => {
    expect(api.PRECACHE_URLS).toEqual(['/offline']);
    expect(api.PRECACHE_URLS.some((url) => url.startsWith('/api/'))).toBe(false);
  });

  it('trata solo navegaciones GET como navegaciones', () => {
    expect(api.isNavigationRequest({ method: 'GET', mode: 'navigate' })).toBe(
      true,
    );
    expect(api.isNavigationRequest({ method: 'POST', mode: 'navigate' })).toBe(
      false,
    );
    expect(api.isNavigationRequest({ method: 'GET', mode: 'cors' })).toBe(false);
    expect(api.isNavigationRequest({ method: 'GET', mode: 'same-origin' })).toBe(
      false,
    );
  });

  it('registra install, activate, fetch, push y notificationclick', () => {
    expect(listeners.has('install')).toBe(true);
    expect(listeners.has('activate')).toBe(true);
    expect(listeners.has('fetch')).toBe(true);
    expect(listeners.has('push')).toBe(true);
    expect(listeners.has('notificationclick')).toBe(true);
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

  it('normaliza el payload de push', () => {
    expect(api.parsePushPayload(null)).toEqual(api.DEFAULT_NOTIFICATION);
    expect(
      api.parsePushPayload({
        title: '  Recordatorio  ',
        body: '  Hoy a las 20:00  ',
        url: '/calendario?date=2026-10-26',
        tag: 'event-1',
      }),
    ).toEqual({
      title: 'Recordatorio',
      body: 'Hoy a las 20:00',
      url: '/calendario?date=2026-10-26',
      tag: 'event-1',
    });
  });

  it('solo permite URLs del mismo origen', () => {
    expect(api.safeNotificationUrl('/calendario?date=2026-10-26')).toBe(
      'https://casa.test/calendario?date=2026-10-26',
    );
    expect(api.safeNotificationUrl('https://otra-web.test/phishing')).toBe(
      'https://casa.test/calendario',
    );
    expect(api.safeNotificationUrl('javascript:alert(1)')).toBe(
      'https://casa.test/calendario',
    );
  });

  it('muestra una notificación al recibir un push', async () => {
    showNotification.mockClear();

    await dispatchPush({
      json: () => ({
        title: 'Recordatorio · Cena',
        body: 'Hoy a las 20:00',
        url: '/calendario?date=2026-10-26',
        tag: 'event-1',
      }),
      text: () => '',
    });

    expect(showNotification).toHaveBeenCalledWith(
      'Recordatorio · Cena',
      expect.objectContaining({
        body: 'Hoy a las 20:00',
        tag: 'event-1',
        data: { url: 'https://casa.test/calendario?date=2026-10-26' },
      }),
    );
  });

  it('usa el payload por defecto si el push no trae JSON válido', async () => {
    showNotification.mockClear();

    await dispatchPush({
      json: () => {
        throw new Error('no json');
      },
      text: () => 'texto roto',
    });

    expect(showNotification).toHaveBeenCalledWith(
      api.DEFAULT_NOTIFICATION.title,
      expect.objectContaining({ body: api.DEFAULT_NOTIFICATION.body }),
    );
  });

  it('abre el calendario al pulsar la notificación', async () => {
    matchAll.mockResolvedValueOnce([]);
    openWindow.mockClear();

    const { close, promise } = dispatchNotificationClick({
      url: '/calendario?date=2026-10-26',
    });
    await promise;

    expect(close).toHaveBeenCalledTimes(1);
    expect(openWindow).toHaveBeenCalledWith(
      'https://casa.test/calendario?date=2026-10-26',
    );
  });

  it('enfoca y navega una pestaña existente', async () => {
    const focus = vi.fn(async () => undefined);
    const navigate = vi.fn(async () => null);
    matchAll.mockResolvedValueOnce([{ focus, navigate }]);
    openWindow.mockClear();

    const { promise } = dispatchNotificationClick({ url: '/calendario' });
    await promise;

    expect(focus).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith(
      'https://casa.test/calendario',
    );
    expect(openWindow).not.toHaveBeenCalled();
  });
});
