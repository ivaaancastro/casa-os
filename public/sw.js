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

const CACHE_VERSION = 'v1';
const CACHE_NAME = `casa-os-${CACHE_VERSION}`;
const OFFLINE_URL = '/offline';
const PRECACHE_URLS = [OFFLINE_URL];

/** Una navegación es una carga de documento (no fetch de datos ni assets). */
function isNavigationRequest(request) {
  return request.method === 'GET' && request.mode === 'navigate';
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

// Superficie mínima para los tests (Vitest evalúa este archivo con un `self`
// simulado). No se usa desde la app.
self.__casaOsPwa = {
  CACHE_VERSION,
  CACHE_NAME,
  OFFLINE_URL,
  PRECACHE_URLS,
  isNavigationRequest,
};
