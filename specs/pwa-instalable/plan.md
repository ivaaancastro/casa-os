# Plan — PWA instalable

## Contexto

El Hito 1 exige que casa-os se pueda **instalar en el móvil** y que, sin
conexión, muestre algo mejor que el error del navegador ("offline básica").

La app ya cumple la parte difícil de la navegación móvil:

- `Sidebar` es off-canvas por debajo de `lg` (hamburguesa + overlay).
- `NotesLayout` tiene panel lateral deslizante y barra superior en móvil.
- Producción corre sobre HTTPS en Vercel (requisito de contexto seguro para
  service workers).

Lo que falta es la capa PWA: manifest, iconos, service worker, página offline y
metadatos de instalación.

## Enfoque técnico

1. **Manifest** — `src/app/manifest.ts` (Metadata Route de Next.js 14) con
   nombre, `start_url`, `display: standalone`, colores y los iconos.
2. **Iconos PNG** — `public/icons/`:
   - `icon-192.png`, `icon-512.png` (fondo blanco, monograma negro).
   - `maskable-512.png` (fondo negro, monograma blanco, contenido dentro de la
     zona segura del 80 %).
   - `apple-touch-icon.png` (180×180).
   - Fuente visual versionada en `assets/icon.svg`.
3. **Service worker** — `public/sw.js`, escrito a mano y minimalista:
   - Precacea **solo** `/offline`.
   - Navegaciones (`request.mode === 'navigate'`): red primero y, si falla,
     `/offline` desde caché.
   - **No** intercepta `/api/*`, **no** cachea HTML autenticado ni chunks de
     Next.js. Así no hay datos privados en caché ni assets obsoletos.
   - Cache versionada, limpieza de versiones antiguas, `skipWaiting` + `claim`
     (seguro porque solo contiene una página autocontenida).
4. **Página offline** — `src/app/offline/route.ts` devuelve HTML + CSS inline,
   sin dependencias de assets ni JS. Es pública (excluida del middleware), por
   lo que se puede precachear sin sesión y se ve igual sin red.
5. **Registro** — `src/components/pwa/ServiceWorkerRegister.tsx` (client) en el
   layout raíz. Solo registra en producción para no interferir con HMR.
6. **Metadatos** — `manifest`, `appleWebApp`, `icons`, `applicationName` y
   `themeColor` en `layout.tsx`.
7. **Middlewares y cabeceras**:
   - Excluir del matcher `offline`, `sw.js`, `manifest.webmanifest` e `icons/`.
   - `Cache-Control: no-cache` para `/sw.js` y `/manifest.webmanifest` (que un
     deploy nuevo no quede servido desde caché).
8. **Tests y verificación**:
   - Test del manifest (campos e iconos).
   - Test de la política del service worker (helpers puros expuestos solo para
     test) y de los listeners registrados.
   - Actualizar el test del matcher con las rutas públicas nuevas.
   - Build de producción + Chrome: SW activo, instalabilidad, offline real y
     comprobación de que la caché no contiene datos privados.

## Dependencias

Ninguna nueva: manifest y SW son APIs nativas de la plataforma; Next.js ya
soporta Metadata Routes.

## Riesgos

| Riesgo | Mitigación |
|---|---|
| Cachear HTML autenticado o `/api/*` (fuga entre usuarios) | El SW no cachea respuestas de navegación ni APIs; solo precachea `/offline` |
| Assets obsoletos por caché | No se cachean `/_next/static`; solo la página offline |
| Offline sin estilos | HTML autocontenido con CSS inline (sin fuentes ni chunks) |
| Chrome no ofrece instalar | Manifest con 192 + 512 + maskable, `start_url`, `display` y SW con `fetch` |
| SW activo en desarrollo (HMR raro) | Registro limitado a `NODE_ENV === 'production'` |
| Dejar rutas sensibles públicas al tocar el matcher | Test del matcher + revisión de que solo se excluyen assets y `/offline` |

## Fuera de alcance

- Datos offline (leer/editar notas o dispositivos sin conexión).
- Push notifications, background sync, periodic sync.
- Pantalla de instalación propia o prompt personalizado.
- Dominio propio.
