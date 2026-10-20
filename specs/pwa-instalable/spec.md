# Spec — PWA instalable

## Objetivo

Que casa-os se pueda **instalar como app** en Android e iOS desde el navegador
y que, sin conexión, muestre una página de aviso clara en lugar del error del
navegador. Sin cachear datos privados.

## Requisitos funcionales

### RF1 — Manifest

`GET /manifest.webmanifest` responde `200` con, como mínimo:

| Campo | Valor |
|---|---|
| `name` | `casa·os — Tu hogar digital` |
| `short_name` | `casa·os` |
| `description` | Gestión de dispositivos, notas familiares y más |
| `start_url` | `/` |
| `scope` | `/` |
| `display` | `standalone` |
| `background_color` | `#FFFFFF` |
| `theme_color` | `#FFFFFF` |
| `lang` | `es` |
| `icons` | 192×192, 512×512 y 512×512 `maskable`, todos PNG |

### RF2 — Iconos

- `GET /icons/icon-192.png`, `/icons/icon-512.png`,
  `/icons/maskable-512.png` y `/icons/apple-touch-icon.png` responden `200`,
  `Content-Type: image/png` y el tamaño declarado.
- Estética Inditex: fondo blanco, monograma negro `c·` (Bodoni/Didot); el
  maskable usa fondo negro y monograma blanco, con el contenido dentro de la
  zona segura.
- El HTML declara `apple-touch-icon` de 180×180.

### RF3 — Service worker

`GET /sw.js` responde `200` con `Content-Type` de JavaScript y
`Cache-Control: public, max-age=0, must-revalidate`.

Comportamiento:

1. En `install`, precachea `/offline` y activa de inmediato (`skipWaiting`).
2. En `activate`, elimina cachés de versiones anteriores y toma el control
   (`clients.claim`).
3. En `fetch`:
   - Solo actúa sobre `GET` del mismo origen.
   - **Navegaciones** (`request.mode === 'navigate'`): red primero; si falla,
     responde con `/offline` cacheado.
   - **Cualquier otra petición** (incluido `/api/*` y `/_next/static/*`): no se
     intercepta ni se cachea.
   - Nunca guarda respuestas de navegación ni de API en Cache Storage.

### RF4 — Página offline

`GET /offline` responde `200` con HTML autocontenido (CSS inline, sin JS, sin
fuentes ni chunks externos):

- Marca `casa·os`, mensaje "Sin conexión" y texto explicativo.
- Enlace "Reintentar" a `/`.
- Se ve correctamente con la red desactivada.
- Es pública (no requiere sesión) y no expone datos.

### RF5 — Registro

- En producción, al cargar la app se registra `/sw.js` (scope `/`).
- Si el registro falla, se informa por consola (`console.error`) sin romper la
  app.
- En desarrollo (`npm run dev`) **no** se registra.
- Tras la primera carga, `navigator.serviceWorker.controller` no es `null`.

### RF6 — Metadatos de instalación

- `layout.tsx` declara `applicationName`, `manifest`, `icons` (incluido Apple) y
  `appleWebApp: { capable: true, title: 'casa·os' }`.
- `themeColor` blanco (`viewport`).
- En iOS, "Añadir a pantalla de inicio" abre en modo standalone con el título
  `casa·os`.

### RF7 — Rutas públicas y seguridad

- El middleware sigue protegiendo `/`, `/devices`, `/notas`, `/familia`,
  `/perfil` y `/api/*` (salvo `api/auth` y `api/health`).
- Se excluyen únicamente: `/offline`, `/sw.js`, `/manifest.webmanifest`,
  `/icons/*`, `/_next/*`, `/favicon.ico` y las rutas de auth ya existentes.
- Las cabeceras de seguridad actuales (CSP, HSTS, `nosniff`, `X-Frame-Options`,
  `Referrer-Policy`, `Permissions-Policy`) se mantienen.

## Requisitos no funcionales

- Sin dependencias nuevas.
- Sin cambios en base de datos, API de negocio ni autenticación.
- La app existente (login, notas, familia, perfil) sigue funcionando igual.
- Código y comentarios en español, coherentes con el resto del proyecto.
- `lint`, `typecheck`, `test` y `build` en verde antes de reportar.

## Superficie nueva

| Ruta | Tipo | Auth |
|---|---|---|
| `/manifest.webmanifest` | Metadata Route | Pública |
| `/sw.js` | Estático (`public/`) | Pública |
| `/offline` | Route Handler (HTML) | Pública |
| `/icons/*.png` | Estático (`public/`) | Pública |

## Criterios de aceptación

1. `GET /manifest.webmanifest` devuelve el JSON del RF1 y Next inyecta
   `<link rel="manifest">`.
2. Los cuatro iconos responden `200` con `image/png`; sus dimensiones coinciden
   con las declaradas.
3. En Chrome (build de producción) `navigator.serviceWorker.ready` resuelve y
   `navigator.serviceWorker.controller` no es `null` tras recargar.
4. Con la red desactivada, navegar a `/notas` (recarga completa) muestra la
   página "Sin conexión" con estilos.
5. Cache Storage contiene solo `/offline` (y, si se precachean, iconos/manifest);
   **no** contiene `/api/*` ni HTML de `/notas`, `/familia` o `/`.
6. Chrome considera la app instalable: manifest válido, iconos 192 + 512,
   `start_url`, `display: standalone` y SW con handler `fetch`. Se comprueba
   además que `beforeinstallprompt` se dispara (o, si el navegador headless no
   lo emite, que se cumplen todos los criterios anteriores).
7. Con la red activa, login, notas (crear/borrar), familia y perfil siguen
   funcionando; la consola no muestra errores ni warnings.
8. `npm run lint`, `npm run typecheck`, `npx vitest run` y `npm run build` pasan.
9. Tras el merge, la producción de Vercel sirve el manifest, el SW y `/offline`,
   y el login sigue operativo.

## Verificación prevista

- Local: `npm run build && npm start` (Postgres arriba) + Chrome MCP:
  manifest, iconos, registro del SW, recarga, modo offline, inspección de
  `caches.keys()`/`caches.open(...).keys()`, login y notas.
- Tests automatizados: manifest, helpers del SW y matcher del middleware.
- Producción: comprobación con `curl` (manifest, SW, offline, cabeceras) y
  smoke con Chrome tras el deploy.
