# Tasks — PWA instalable

> Orden por dependencia. Cada tarea deja el repo en estado verificable.

1. **Generador de iconos** — `scripts/generate-pwa-icons.mjs` (PNG sin
   dependencias, con supersampling) y script `npm run icons`. Genera
   `public/icons/{icon-32,icon-192,icon-512,maskable-512,apple-touch-icon}.png`.
   Revisar visualmente el 512 y el maskable.

2. **Manifest** — `src/app/manifest.ts` con los campos del RF1 y los iconos.

3. **Página offline** — `src/app/offline/route.ts`: HTML autocontenido con CSS
   inline, `force-static`, sin JS ni assets.

4. **Service worker** — `public/sw.js`: precache de `/offline`, navegaciones
   red-primero con fallback, sin interceptar APIs ni assets, versión y limpieza
   de cachés, helpers de test.

5. **Registro y metadatos** — `src/components/pwa/ServiceWorkerRegister.tsx`,
   integración en `src/app/layout.tsx` (`manifest`, `icons`, `appleWebApp`,
   `applicationName`, `themeColor`) y registro solo en producción.

6. **Middleware y cabeceras** — excluir `offline`, `sw.js`,
   `manifest.webmanifest` e `icons/` en `src/middleware.ts`; añadir
   `Cache-Control` para `sw.js` y el manifest en `next.config.js`.

7. **Tests** — `tests/manifest.test.ts`, `tests/pwa-sw.test.ts`, actualizar
   `tests/middleware.test.ts`.

8. **Documentación** — `docs/pwa.md` (instalar en iOS/Android, qué hace offline,
   regenerar iconos), README, CHANGELOG y MEMORY (estado del hito).

9. **Verificación local** — `lint && typecheck && vitest run && build`;
   `npm start` + Chrome: manifest, iconos, SW activo, offline real, caché sin
   datos privados, login/notas/familia, consola limpia.

10. **PR y producción** — PR, CI verde, squash merge, deploy de Vercel y
    comprobación en producción (manifest, SW, `/offline`, health y login).
