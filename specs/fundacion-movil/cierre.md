# Cierre — Fase 1: Fundación móvil

**Estado:** cerrada
**Fecha:** 2026-11-19
**Feature:** `fundacion-movil`
**Rama:** `feat/fundacion-movil` (borrada tras el merge)

## Resumen

Se entrega la base móvil de casa-os: tab bar inferior de cuatro pestañas, menú
«Más» para el resto de secciones, sidebar de escritorio conservado, aviso de
instalación PWA y cabeceras compactas con jerarquía Jost/Bodoni. Es la Fase 1 del
roadmap móvil-first y no modifica datos, APIs ni autenticación.

## Alcance entregado

- Navegación de una mano con cuatro pestañas y estado activo sobrio.
- Acceso a Dashboard, Dispositivos, Familia y cierre de sesión desde el menú «Más».
- Aviso de instalación PWA una vez por dispositivo, con alternativa para iOS Safari.
- Tipografía y espaciado móviles coherentes en dashboard, notas, Cuentas,
  Calendario y Perfil.
- Test E2E de la navegación y auditoría visual con capturas de la sesión.

## Cambios principales

| Área | Archivos | Qué cambió |
|---|---|---|
| Shell | `src/components/AppShell.tsx`, `src/app/layout.tsx`, `src/components/Sidebar.tsx`, `src/components/navigation/nav-items.ts` | Un único shell por breakpoint; navegación compartida; `/auth/*` sin chrome de app. |
| Móvil | `src/components/mobile/BottomTabBar.tsx`, `src/components/mobile/MoreDrawer.tsx` | Cuatro pestañas con `aria-current` y zona segura; bottom sheet con portal, Escape y `aria-modal`. |
| PWA | `src/components/pwa/InstallPrompt.tsx` | Aviso compacto en el flujo, `beforeinstallprompt`, fallback iOS y dismiss persistente. |
| UI | `src/components/PageHeader.tsx`, `src/app/{page,notas,cuentas,calendario,perfil}/page.tsx`, componentes de notas/Cuentas/Calendario | Cabeceras Jost 21 px en móvil (Bodoni en `md:`), metadatos 13 px, menos aire en dashboard. |
| Tests | `tests/e2e/navigation.spec.ts`, `playwright.config.ts`, `vitest.config.ts` | 4 E2E con login real a 390 px; Vitest excluye `tests/e2e`. |
| Docs | `specs/fundacion-movil/*`, `README.md`, `CHANGELOG.md`, `MEMORY.md`, `docs/roadmap.md` | Spec aprobada, tareas, auditoría y registro de la entrega. |

## Verificación

### Código y tests

| Comando | Resultado |
|---|---|
| `npm run lint` | OK (sin warnings) |
| `npm run typecheck` | OK |
| `npm run test` | OK — 408 tests en 32 ficheros |
| `npm run build` | OK — todas las rutas generadas |
| `npm run test:e2e` | OK — 4/4 con login real contra BD local sembrada (Pixel 7 / Chromium) |
| CI del PR #45 | OK — `quality`, `build`, `test` y Vercel en verde (`44575681116`) |
| CI de `main` tras el merge | OK — `44579022483` en verde tras un rerun (ver incidencia abajo) |

### UI / Chrome

- Navegador y viewport: Chromium (Chrome MCP), 390×844, sesión real contra BD local.
- Flujos comprobados: login → dashboard → Notas → Cuentas → Calendario →
  Perfil → menú «Más»; pestaña activa, drawer, cierre con Escape y aviso de
  instalación.
- Consola: sin errores durante la sesión de capturas.
- Responsive / overflow: sin desbordamiento horizontal a 390 px en las cuatro rutas.
- Evidencia visual: 7 capturas referenciadas en
  [`auditoria.md`](auditoria.md). Dos hallazgos P2 corregidos y reverificados
  (`f1-07-dashboard-final.png`).

### Producción

| Campo | Valor |
|---|---|
| URL | <https://casa-os-mauve.vercel.app> |
| Deployment | `5m5KBVDokWkixJnfVjkQVvFqcAXK` (estado `success` en GitHub status; la API de Vercel no se consultó por falta de token) |
| Commit | `4de6b8b` (merge squash del PR #45) |
| Health | `200` — `{"status":"ok","db":"ok"}` verificado tras el merge |
| Rutas | `/auth/login` → `200`, `/` → `307` |
| Smoke autenticado | No ejecutado en producción: no hay credenciales válidas del propietario en este entorno. Se verificó con login real en local (BD sembrada). Lo confirma el propietario con sus credenciales. |

## Documentación actualizada

- [x] `MEMORY.md`: estado, roadmap, registro y foco.
- [x] `CHANGELOG.md`: entrada de la entrega.
- [x] `README.md`: comando `test:e2e` y uso de Playwright.
- [x] `docs/*`: `docs/roadmap.md` con Fase 1 ✅ y Fase 2 como siguiente.
- [x] `spec.md` y `plan.md`: decisiones aprobadas por el usuario.
- [x] `tasks.md`: todas las tareas en `[x]`.
- [x] `AGENTS.md`: no aplica (no cambian las reglas del arnés).
- [x] `npm run docs:check -- fundacion-movil` pasa.

## Tareas

### Completadas

- Fase 0 — preparación (1).
- Fase 1 — shell, tab bar, drawer, fuente de navegación y sidebar (2–6).
- Fase 2 — aviso de instalación y verificación PWA (7–8).
- Fase 3 — cabeceras y pantallas (9–10).
- Fase 4 — E2E, verificaciones, Chrome MCP y auditoría (11–14).
- Fase 5 — PR #45 mergeado, CI verde y cierre documental (15–16).

### Pendientes / follow-ups

- Verificación en dispositivo real iOS y Android: no disponible en este entorno;
  se comprueba en el terminal del propietario antes de dar la app por cerrada en
  móvil real. No se presenta Chromium como prueba de iOS/Android.
- Contraste de `ash` a 11–13 px y foco al cerrar el drawer con teclado/lector de
  pantalla: requiere prueba de accesibilidad específica (ver `auditoria.md`).
- Acceso «Más» fuera de Perfil: se decide en la Fase 2 (spec de Cuentas móvil).
- CI intermitente de `next/font/google`: el primer run de `main` falló al
  descargar Bodoni Moda (`TypeError` en el loader) y pasó al rerun. No es un
  fallo del código de esta feature; si se repite, valorar fuentes autoalojadas
  con `next/font/local` en una feature separada.

## Decisiones y lecciones

- Cuatro pestañas y Dashboard en el menú «Más»: más espacio para el pulgar y
  menos decisiones por pantalla (decisión aprobada en la spec).
- Se descarta `#C41E3A` como acento: el rojo (`#8E2222`) queda reservado a error.
- Los `h1/h2/h3` tenían `font-display` forzado en `globals.css`: en móvil hay que
  añadir `font-ui` explícito para que la jerarquía Jost se aplique de verdad.
- `next build` mientras corre `next dev` sobrescribe `.next` y deja el servidor
  sirviendo 404; hay que reiniciar el dev server antes de repetir los E2E.
- El aviso de instalación va en el flujo, no flotante: ocupa menos y no tapa contenido.

## Riesgos residuales

- La pestaña activa no existe en `/` (Dashboard no es pestaña): es esperado según
  la decisión de cuatro pestañas; el usuario puede no ver marcada ninguna opción.
- El prompt de iOS Safari no se ha probado en un dispositivo real.

## Checklist de cierre

- [x] El PR de la feature (#45) está mergeado (squash) y la rama borrada.
- [x] El CI de `main` está verde tras el merge (`44579022483`).
- [x] Producción está desplegada y verificada; el smoke autenticado está
      documentado como no ejecutable en este entorno.
- [x] `tasks.md` no tiene casillas pendientes.
- [x] `cierre.md` no tiene casillas pendientes.
- [x] `MEMORY.md` enlaza este cierre y tiene el registro actualizado.
- [x] `CHANGELOG.md`, `README.md` y `docs/*` están al día.
- [x] `npm run docs:check -- fundacion-movil` pasa.
- [x] El PR de cierre tiene el CI verde (se verifica en el PR #46 antes del merge).
