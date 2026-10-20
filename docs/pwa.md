# PWA instalable

casa-os se puede instalar como aplicación en el móvil y muestra una página de
aviso cuando no hay conexión. No hay app nativa ni tienda: es la web de siempre
con manifest y service worker.

## Instalar

La app debe abrirse desde **HTTPS** (producción) o `localhost`.

### Android (Chrome)

1. Abrir <https://casa-os-mauve.vercel.app> e iniciar sesión.
2. Menú de Chrome → **Instalar aplicación** (o "Añadir a pantalla de inicio").
3. Se abre en ventana propia, sin barra del navegador.

### iOS (Safari)

1. Abrir la URL en **Safari** (no funciona desde Chrome en iOS).
2. Botón **Compartir** → **Añadir a pantalla de inicio**.
3. Se abre a pantalla completa con el título `casa·os`.

## Qué hace sin conexión

- Si se recarga una página sin red, se muestra `/offline`: un aviso claro con un
  botón **Reintentar**. El HTML es autocontenido (CSS inline, sin JS ni fuentes),
  así que se ve bien aunque no se pueda descargar nada.
- **No hay datos offline**: notas, dispositivos y familia necesitan conexión.
  Es una decisión deliberada para no guardar información privada en la caché del
  navegador.
- El service worker **solo precachea `/offline`**. No intercepta `/api/*` ni
  `/_next/static/*`, y no guarda HTML autenticado.

## Piezas

| Pieza | Archivo |
|---|---|
| Manifest | `src/app/manifest.ts` → `/manifest.webmanifest` |
| Service worker | `public/sw.js` → `/sw.js` |
| Página offline | `src/app/offline/route.ts` → `/offline` |
| Registro del SW | `src/components/pwa/ServiceWorkerRegister.tsx` |
| Metadatos | `src/app/layout.tsx` (`manifest`, `icons`, `appleWebApp`, `themeColor`) |
| Iconos | `public/icons/*.png` |
| Generador de iconos | `scripts/generate-pwa-icons.mjs` |

El registro del service worker solo ocurre en producción
(`NODE_ENV === 'production'`), para no interferir con el HMR de desarrollo.

## Iconos

Se generan sin dependencias (dibujo propio + codificador PNG con `zlib`):

```bash
npm run icons
```

Produce `icon-32.png`, `icon-192.png`, `icon-512.png`, `apple-touch-icon.png`
(180) y `maskable-512.png` en `public/icons/`. El maskable usa fondo negro y
mantiene la marca dentro de la zona segura.

## Actualizar el service worker

`sw.js` se sirve con `Cache-Control: public, max-age=0, must-revalidate`, así
que el navegador lo revisa en cada visita. Si cambia su lógica (por ejemplo, qué
se precachea), **subir `CACHE_VERSION`** en `public/sw.js`: en `activate` se
borran las cachés con otro nombre.

## Verificación

```bash
npm run build && npm start
```

En Chrome (build de producción):

1. DevTools → Application → Manifest: nombre, iconos y `standalone` sin errores.
2. Application → Service Workers: `/sw.js` activo y controlando la página.
3. Network → Offline + recargar `/notas`: aparece `No hay red.`
4. Cache Storage → solo `casa-os-v1` con `/offline`; ninguna respuesta de `/api`.

## Fuera de alcance

- Datos offline (leer o editar sin red).
- Push notifications y background sync.
- Prompt de instalación personalizado.
