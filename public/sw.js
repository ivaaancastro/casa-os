/*
 * Service worker de casa-os.
 *
 * Objetivo: offline básica sin poner en riesgo los datos de la casa.
 *
 * - Solo se precachea /offline (HTML autocontenido, sin assets).
 * - Las navegaciones van a la red primero; si fallan, se sirve /offline.
 * - NO se interceptan APIs, ni se cachean HTML autenticado ni chunks de
 *   Next.js. Así la caché nunca contiene notas, dispositivos ni sesiones.
 *
 * Al cambiar el comportamiento, subir CACHE_VERSION para limpiar la caché
 * anterior en el siguiente arranque.
 */

const CACHE_VERSION = 'v2';
const CACHE_NAME = `casa-os-${CACHE_VERSION}`;
const OFFLINE_URL = '/offline';
const PRECACHE_URLS = [OFFLINE_URL];
const DEFAULT_NOTIFICATION = {
  title: 'casa·os',
  body: 'Tienes un recordatorio.',
  url: '/calendario',
  tag: 'casa-os-reminder',
};

/** Una navegación es una carga de documento (no fetch de datos ni assets). */
function isNavigationRequest(request) {
  return request.method === 'GET' && request.mode === 'navigate';
}

/** Normaliza el payload que envía el servidor, sin confiar en su forma. */
function parsePushPayload(raw) {
  if (!raw || typeof raw !== 'object') return DEFAULT_NOTIFICATION;

  const title =
    typeof raw.title === 'string' && raw.title.trim()
      ? raw.title.trim().slice(0, 120)
      : DEFAULT_NOTIFICATION.title;
  const body =
    typeof raw.body === 'string' && raw.body.trim()
      ? raw.body.trim().slice(0, 500)
      : DEFAULT_NOTIFICATION.body;
  const url =
    typeof raw.url === 'string' && raw.url.trim()
      ? raw.url.trim()
      : DEFAULT_NOTIFICATION.url;
  const tag =
    typeof raw.tag === 'string' && raw.tag.trim()
      ? raw.tag.trim().slice(0, 64)
      : DEFAULT_NOTIFICATION.tag;

  return { title, body, url, tag };
}

/** Solo permite URLs del mismo origen; cualquier otra vuelve al calendario. */
function safeNotificationUrl(raw) {
  const fallback = `${self.location.origin}/calendario`;
  if (typeof raw !== 'string' || !raw.trim()) return fallback;

  try {
    const url = new URL(raw, self.location.origin);
    return url.origin === self.location.origin ? url.href : fallback;
  } catch {
    return fallback;
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Todo lo que no sea una navegación sigue su curso normal (incluidas
  // /api/* y /_next/static/*): no se cachea nada.
  if (!isNavigationRequest(request)) return;

  event.respondWith(
    fetch(request).catch(async () => {
      const cache = await caches.open(CACHE_NAME);
      const offline = await cache.match(OFFLINE_URL);

      if (offline) return offline;

      return new Response('Sin conexión', {
        status: 503,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }),
  );
});

self.addEventListener('push', (event) => {
  let raw = null;

  if (event.data) {
    try {
      raw = event.data.json();
    } catch {
      try {
        raw = JSON.parse(event.data.text());
      } catch {
        raw = null;
      }
    }
  }

  const payload = parsePushPayload(raw);
  const options = {
    body: payload.body,
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: payload.tag,
    renotify: false,
    data: { url: safeNotificationUrl(payload.url) },
  };

  event.waitUntil(self.registration.showNotification(payload.title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = safeNotificationUrl(
    event.notification.data && event.notification.data.url,
  );

  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      });

      for (const client of windows) {
        if ('focus' in client) {
          try {
            await client.focus();
            if ('navigate' in client) await client.navigate(target);
            return;
          } catch {
            // Si la pestaña ya no se puede controlar, probamos a abrir otra.
          }
        }
      }

      if (self.clients.openWindow) {
        await self.clients.openWindow(target);
      }
    })(),
  );
});

// Superficie mínima para los tests (Vitest evalúa este archivo con un `self`
// simulado). No se usa desde la app.
self.__casaOsPwa = {
  CACHE_VERSION,
  CACHE_NAME,
  OFFLINE_URL,
  PRECACHE_URLS,
  DEFAULT_NOTIFICATION,
  isNavigationRequest,
  parsePushPayload,
  safeNotificationUrl,
};
