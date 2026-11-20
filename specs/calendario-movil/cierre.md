# Cierre — Fase 4: Calendario móvil + avisos

**Estado:** cerrada
**Fecha:** 2026-11-20
**Feature:** `calendario-movil`
**Rama:** `feat/calendario-movil` (borrada tras el merge)

## Resumen

Se entrega `/calendario` como pantalla de uso con una mano: rejilla de mes con
chips táctiles y agenda del día, semana en tarjetas, creación con FAB y paneles
de evento/avisos como hojas inferiores. Se unifica el breakpoint móvil con el
resto de la app (1023 px) y se reutiliza el Web Push real ya cerrado en
`specs/recordatorios`: no se tocó la infraestructura de envío. El escritorio
conserva su layout.

## Alcance entregado

- Un solo `useIsMobile()` compartido (`< 1024px`) y una sola vista montada por
  breakpoint: `CalendarMobileView` / `CalendarDesktopView`.
- Mes con celdas ≥ 44 px y hasta 2 chips + «+N más»; agenda del día con chips
  de ≥ 44 px; semana en tarjetas con botón «+» táctil.
- FAB portado a `body` para flotar sobre la tab bar y la zona segura.
- `EventPanel` y `ReminderPanel` adaptados a hoja inferior con `createPortal`,
  campos apilados, acciones pegajosas y Jost en móvil.
- Panel Avisos accesible desde la toolbar del calendario, con VAPID,
  suscripciones, cron y service worker intactos.
- 7 E2E con login real, 7 tests unitarios de chips y auditoría visual con 8
  capturas a 390×844.

## Cambios principales

| Área | Archivos | Qué cambió |
|---|---|---|
| Breakpoint | `src/components/mobile/useIsMobile.ts`, `NotesLayout.tsx`, `CalendarApp.tsx` | Hook compartido a 1023 px; se eliminó el local de 767 px |
| Vistas | `CalendarApp.tsx`, `CalendarDesktopView.tsx`, `CalendarMobileView.tsx`, `MonthViewMobile.tsx`, `WeekViewMobile.tsx`, `types.ts` | Estado centralizado, una vista por breakpoint, chips y agenda |
| Lógica | `src/lib/utils/calendar-chips.ts` | `eventsForDayChips()` puro con límite y contador |
| Paneles | `EventPanel.tsx`, `ReminderPanel.tsx`, `globals.css` | Hojas inferiores, safe-area, ≥ 44 px, animaciones y Jost móvil |
| Tests | `tests/calendar-chips.test.ts`, `tests/e2e/calendario-movil.spec.ts`, `tests/e2e/helpers/events-setup.ts` | 7 unitarios y 7 E2E con fixtures `e2e-*` |
| Docs | `specs/calendario-movil/*`, `MEMORY.md`, `CHANGELOG.md`, `README.md`, `docs/roadmap.md` | Spec aprobada, tareas, auditoría y registro de la entrega |

## Verificación

### Código y tests

| Comando | Resultado |
|---|---|
| `npm run lint` | OK (sin warnings) |
| `npm run typecheck` | OK |
| `npm run test` | OK — 443 tests en 36 ficheros |
| `npm run build` | OK — todas las rutas generadas |
| `npm run test:e2e` | OK — 18/18 con login real (Pixel 7 / Chromium), 7 nuevos de Calendario |
| CI del PR #51 | OK — `quality`, `build`, `test` y Vercel en verde (`44715792186`) |
| CI de `main` tras el merge | OK — `44716034360` en verde (`quality`, `build`, `test`) |

### UI / Chrome

- Navegador y viewport: Chromium (Chrome MCP), 390×844, sesión real contra BD
  local sembrada; además se revisó con `next start` para el panel Avisos.
- Flujos comprobados: mes → día/agenda → semana → FAB/formulario → avisos →
  deep link `?date=`.
- Consola: sin errores ni avisos en las capturas finales.
- Responsive: sin desbordamiento horizontal a 390 px (E2E + capturas).
- Evidencia: 8 capturas referenciadas en [`auditoria.md`](auditoria.md). Dos
  hallazgos P1 corregidos y reverificados: FAB no flotante por `transform` de
  `animate-fade-rise`, y Bodoni en títulos móviles.
- Panel Avisos con build de producción local: estado «Los avisos no están
  configurados en el servidor» por falta de VAPID locales; el envío real está
  documentado en `specs/recordatorios/cierre.md`.

### Producción

| Campo | Valor |
|---|---|
| URL | <https://casa-os-mauve.vercel.app> |
| Deployment | `DyxZZpk7bWEWt5PUnzRyTgKSSBvZ` (estado `success` en GitHub status; la API de Vercel no se consultó por falta de token). Preview del PR: `Ax2RNXz1HZirYRgPyQCRhDLqwDbz` |
| Commit | `3e558ea` (merge squash del PR #51) |
| Health | `200` — `{"status":"ok","db":"ok","timestamp":"2026-11-20T10:05:51.353Z"}` verificado tras el merge |
| Rutas | `/auth/login` → `200`, `/` → `307` |
| Smoke autenticado | No ejecutado en producción: no hay credenciales válidas del propietario en este entorno. Se verificó con login real en local (BD sembrada). Lo confirma el propietario con sus credenciales. |

## Documentación actualizada

- [x] `MEMORY.md`: Fase 4 ✅, registro del PR #51, foco en Fase 5, notas técnicas y lecciones.
- [x] `CHANGELOG.md`: entrada de la Fase 4.
- [x] `README.md`: E2E de Calendario incluido en la descripción de `test:e2e`.
- [x] `docs/roadmap.md`: Fase 4 ✅ y Fase 5 como siguiente.
- [x] `spec.md` y `plan.md`: decisiones aprobadas y criterios verificados.
- [x] `tasks.md`: 20/20 tareas completadas, sin casillas pendientes.
- [x] `AGENTS.md`: no aplica (no cambian las reglas del arnés).
- [x] `npm run docs:check -- calendario-movil` pasa.

## Tareas

### Completadas

- Fase 0 — rama y documentos de spec (1).
- Fase 1 — breakpoint compartido, vistas y estado centralizado (2-4).
- Fase 2 — chips, rejilla, semana y agenda táctiles (5-8).
- Fase 3 — FAB, hojas inferiores y estilos táctiles (9-12).
- Fase 4 — accesibilidad y permisos (13-14).
- Fase 5 — E2E, verificaciones, build de producción y auditoría (15-18).
- Fase 6 — PR #51 mergeado, CI verde y cierre documental (19-20).

### Pendientes / follow-ups

- **Chips de la rejilla**: a 390 px se truncan a «Event…» por el ancho de 7
  columnas; el `title` y la agenda dan el nombre completo. Evaluar otro
  patrón solo si se re-abre la decisión de vista Mes.
- **Primer viewport**: si hoy cae tarde en el mes, los eventos quedan por debajo
  del `PageHeader`. Se descartó el autosccroll porque ocultaría la cabecera y
  el selector de vista; revisar con dispositivo real.
- **Dispositivo real y accesibilidad**: no hay iOS/Android; repetir prueba con
  teclado virtual, lector de pantalla, Face ID/huella (Fase 2) y contraste de
  `ash` a 10-13 px.
- **Push en dispositivo**: no se solicitó permiso de notificación ni se envió
  una notificación real al SO. La infraestructura ya está verificada en
  producción en `specs/recordatorios/cierre.md`; queda la prueba en móvil real.
- **CI intermitente de `next/font/google`**: no se repitió en esta fase; si
  vuelve, valorar `next/font/local` en una feature separada.

## Decisiones y lecciones

- Las seis decisiones se aprobaron con la opción A: rejilla con chips y agenda,
  FAB, hoja inferior, Avisos en la toolbar, breakpoint 1023 px y no tocar el
  push cerrado.
- La auditoría visual encontró un defecto que los E2E no veían: el FAB existía
  y medía 56 px pero estaba a 1181 px por el `transform` de `animate-fade-rise`.
  Portarlo a `body` es la misma solución que ya usaban los paneles.
- `font-display` se aplica a todos los encabezados desde `globals.css`: en
  móvil hay que poner `font-ui` explícitamente para cumplir la Fase 1.
- En local con `next start` el service worker se registra, pero sin VAPID el
  panel muestra «no configurado en el servidor». Es un estado válido, no un
  fallo, y no se documentó como evidencia de envío real.

## Riesgos residuales

- Los chips de la rejilla no sustituyen a la agenda para leer títulos largos.
- El panel Avisos en producción depende del cron de GitHub Actions cada 5 min,
  con follow-ups ya documentados en `specs/recordatorios/cierre.md`
  (inactividad a 60 días y purga de entregas).
- El smoke autenticado en producción sigue pendiente del propietario.

## Checklist de cierre

- [x] El PR de la feature (#51) está mergeado (squash) y la rama borrada.
- [x] El CI de `main` está verde tras el merge (`44716034360`).
- [x] Producción desplegada y verificada; el smoke autenticado está documentado
      como no ejecutable en este entorno.
- [x] `tasks.md` no tiene casillas pendientes.
- [x] `cierre.md` no tiene casillas pendientes.
- [x] `MEMORY.md` enlaza este cierre y tiene el registro actualizado.
- [x] `CHANGELOG.md`, `README.md` y `docs/*` están al día.
- [x] `npm run docs:check -- calendario-movil` pasa.
- [x] El PR de cierre tiene el CI verde (se verifica en el PR antes del merge).
