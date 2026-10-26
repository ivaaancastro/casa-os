# Cierre — Recordatorios

**Estado:** cerrada
**Fecha:** 2026-10-26
**Feature:** `recordatorios`
**Rama de cierre:** `docs/cierre-recordatorios`

## Resumen

Se entrega Web Push para los recordatorios del calendario: activación por
dispositivo, aviso de prueba, panel **Avisos** con próximos recordatorios y
enlace profundo al día del evento. El envío lo comprueba un workflow de GitHub
Actions cada 5 minutos y se deduplica en PostgreSQL.

El código se mergeó en `main` con el PR #26 (commit `76f0683`) y la
documentación de seguimiento con el PR #27 (commit `bfb7477`). La configuración
de producción quedó completa (VAPID, `CRON_SECRET`, `HOUSE_TIMEZONE`, variable y
secreto de GitHub) y el redeploy final es
`dpl_GLUPgBsHBLV6k7MXAP11mikGiVKr` (*Ready · Current*, health `200`).

La verificación real se completó con un navegador Chrome y una suscripción FCM
real: llegó el aviso de prueba, un evento con recordatorio recibió **un solo**
push y una segunda ejecución del dispatch lo **omitió por deduplicación**. Los
datos y suscripciones de prueba se eliminaron al terminar. La feature queda
cerrada.

## Alcance entregado

- Web Push en navegador y PWA instalada; sin email ni otros canales.
- Suscripciones por dispositivo con alta, sincronización, baja y prueba.
- Avisos de eventos con hora (`inicio - recordatorio`) y de todo el día (09:00
  de `HOUSE_TIMEZONE`).
- Destinatarios: responsable si existe; toda la casa si `ownerId = null`.
- Deduplicación por `[eventId, subscriptionId, scheduledFor]`, ventana de 15
  minutos y desactivación de suscripciones muertas.
- Panel **Avisos** en el calendario y enlace `/calendario?date=YYYY-MM-DD`.
- Scheduler de GitHub Actions cada 5 minutos con `CRON_SECRET`.
- Fuera de alcance: email/SMS/Telegram, recordatorios de notas, recurrencias,
  múltiples avisos por evento y centro de notificaciones leídas.

## Cambios principales

| Área | Archivos | Qué cambió |
|---|---|---|
| Datos | `prisma/schema.prisma`, `prisma/migrations/20261026104419_add_push_reminders/` | `PushSubscription`, `ReminderDelivery`, índices y relaciones en cascada |
| Lógica | `src/lib/reminders.ts`, `src/lib/push.ts`, `src/lib/push-service.ts` | Cálculo de avisos, VAPID, envío, fallos y deduplicación |
| Validación | `src/lib/schemas/push.ts` | Zod para suscripciones e `limit` |
| API | `src/app/api/push/*`, `src/app/api/reminders/*` | Config, suscripciones, prueba, próximos y dispatch |
| Middleware | `src/middleware.ts` | Exclusión de push/reminders para devolver `401` JSON |
| PWA | `public/sw.js` | `push`, `notificationclick`, URL same-origin y `CACHE_VERSION = v2` |
| UI | `src/components/calendar/ReminderPanel.tsx`, `CalendarApp.tsx`, `EventPanel.tsx` | Panel, botón Avisos, enlace profundo y copy del recordatorio |
| Scheduler | `.github/workflows/recordatorios.yml` | Cron cada 5 minutos, manual y `concurrency` |
| Tests | `tests/reminders.test.ts`, `tests/push.test.ts`, `tests/push-service.test.ts`, `tests/pwa-sw.test.ts`, `tests/api/push.schemas.test.ts`, `tests/middleware.test.ts`, `tests/push-client.test.ts` | Cálculo, VAPID, entregas, SW, Zod y middleware |
| Docs | `README.md`, `docs/recordatorios.md`, `docs/calendario.md`, `docs/pwa.md`, `docs/despliegue-vercel.md`, `docs/architecture.md`, `CHANGELOG.md`, `MEMORY.md`, `docs/roadmap.md` | Uso, configuración, scheduler, límites y estado |

## Verificación

### Código y tests

| Comando | Resultado |
|---|---|
| `npm run lint` | OK, sin avisos |
| `npm run typecheck` | OK |
| `npm run test` | 334 tests en 22 archivos, todos OK |
| `npm run build` | OK; rutas `/api/push/*` y `/api/reminders/*` registradas |
| CI del PR de feature | [PR #26](https://github.com/ivaaancastro/casa-os/pull/26): `quality`, `test`, `build` y Vercel en verde |
| CI de `main` tras la feature | [run `40313415200`](https://github.com/ivaaancastro/casa-os/actions/runs/40313415200), en verde |
| CI de `main` tras la documentación | [run `40314064725`](https://github.com/ivaaancastro/casa-os/actions/runs/40314064725), en verde |

### UI / Chrome

- **Navegador y viewport local**: Chrome con Chrome MCP; escritorio y móvil
  emulado 390 × 844 (DPR 3, touch).
- **Flujos comprobados en local** (build de producción):
  - Panel **Avisos** sin configuración: muestra el aviso de servidor sin VAPID.
  - Con VAPID de prueba: aparece **Activar avisos en este dispositivo**.
  - Suscripción simulada en el navegador y real en la API: estado activo,
    contador `1 dispositivo con avisos`, **Enviar prueba** y **Desactivar**.
  - Desactivar elimina la suscripción del servidor y vuelve al estado inicial.
  - Próximos avisos con un evento temporal y enlace
    `/calendario?date=2026-10-27`.
  - Enlace profundo `/calendario?date=2026-11-10`: abre noviembre y la agenda del
    día 10.
  - Sin overflow horizontal; `bodyOverflow: hidden` con el panel abierto.
  - Consola sin warnings ni errores.
- **Producción**: `/calendario` → **Avisos** cargó la configuración VAPID, la
  zona horaria de la casa y el aviso real **Visitantes Casa**
  (`vie, 30 oct, 10:30 · Toda la casa`). La suscripción real y la entrega se
  verificaron por API y por el push recibido en el service worker.
- **Permiso**: la prueba real se hizo con permiso de notificaciones concedido en
  un perfil temporal de Chrome; la suscripción FCM se registró en producción y
  se eliminó al terminar.

### API local

- `GET /api/push/config` → `200`.
- `GET /api/push/subscriptions` → `200`.
- `POST /api/push/subscriptions` → `201`; `DELETE` → `204`; listado vacío al
  terminar.
- `GET /api/reminders/upcoming` → `200`.
- `POST /api/push/test` → `503` sin VAPID.
- `POST /api/reminders/dispatch` → `503` sin `CRON_SECRET`, `401` con secreto
  incorrecto y `200` con el secreto correcto.
- Evento temporal eliminado al terminar; `upcoming` quedó vacío.

### Producción

| Campo | Valor |
|---|---|
| URL | <https://casa-os-mauve.vercel.app> |
| Deployment final | `dpl_GLUPgBsHBLV6k7MXAP11mikGiVKr`, estado **Ready** y alias actual |
| Commit de la feature | `76f0683` (squash merge de PR #26) |
| Commit de documentación | `bfb7477` (squash merge de PR #27) |
| Health | `GET /api/health` → `200`, `{"status":"ok","db":"ok"}` |
| Service worker | `GET /sw.js` → `200` con `CACHE_VERSION = v2` |
| Dispatch sin secreto | `POST /api/reminders/dispatch` → `401` `{"error":"No autorizado"}` |
| Workflow | `Recordatorios` activo, cron `*/5 * * * *` y `workflow_dispatch` |

**Variables configuradas** (solo nombres; los valores están en Vercel/GitHub y
en el gestor de contraseñas):

- Vercel Production: `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`,
  `VAPID_SUBJECT`, `CRON_SECRET`, `HOUSE_TIMEZONE=Europe/Madrid`.
- GitHub Actions: variable `CASA_OS_URL` y secreto `CRON_SECRET` con el mismo
  valor que Vercel.
- `VAPID_SUBJECT` apunta a la URL pública de producción.

**Ejecuciones reales del scheduler**:

| Run | Resultado |
|---|---|
| [`40319367333`](https://github.com/ivaaancastro/casa-os/actions/runs/40319367333) | Primera ejecución manual tras configurar el secreto; workflow en verde |
| [`40325619329`](https://github.com/ivaaancastro/casa-os/actions/runs/40325619329) | Dispatch manual con el evento de prueba; workflow en verde |
| [`40325963795`](https://github.com/ivaaancastro/casa-os/actions/runs/40325963795) | `checkedEvents:1`, `eligibleDeliveries:2`, `sent:1`, `failed:1`, `skipped:0`, `deactivated:1`; el push del evento llegó al service worker |
| [`40325997147`](https://github.com/ivaaancastro/casa-os/actions/runs/40325997147) | `checkedEvents:1`, `eligibleDeliveries:1`, `sent:0`, `failed:0`, `skipped:1`, `deactivated:0`; deduplicación confirmada |

En `40325963795` había una suscripción de prueba antigua ya inválida: FCM la
rechazó, el servidor la desactivó y el envío continuó para la suscripción
válida. Es el comportamiento esperado de aislamiento de fallos.

**Aviso de prueba**:

- `POST /api/push/test` → `200`
  `{"ok":true,"sent":1,"failed":0,"deactivated":0}`.
- El service worker recibió el payload
  `{"title":"Prueba de aviso","body":"Los avisos de casa·os están activos.","url":"/calendario","tag":"test-…","eventId":"test"}`.

**Aviso real de un evento**:

- Evento temporal `cmvp9bkw5000f5lwh4ode7chf`, «Prueba recordatorio 12:52:53»,
  con `reminderMinutes: 0` y responsable `Admin Casa`.
- Payload recibido por el service worker:
  `{"title":"Recordatorio · Prueba recordatorio 12:52:53","body":"Lunes, 26 de octubre a las 13:51 · Para Admin Casa","url":"/calendario?date=2026-10-26","tag":"event-cmvp9bkw5000f5lwh4ode7chf","eventId":"cmvp9bkw5000f5lwh4ode7chf"}`.
- Primera ejecución: `sent:1`; segunda ejecución: `skipped:1`. El mismo aviso no
  se duplicó.

### Limpieza

- Suscripciones de prueba eliminadas:
  `cmvp93hg20001yq22cvmlvci6`, `cmvp96wze00035lwhy9lhp3vx` y
  `cmvp9b1p500095lwhoeb1e3vk`.
- `GET /api/push/subscriptions` devuelve `{"subscriptions":[]}`.
- Eventos temporales eliminados; `GET /api/reminders/upcoming` solo conserva el
  aviso real **Visitantes Casa** (`scheduledFor` `2026-10-30T09:30:00.000Z`).
- Perfil temporal de Chrome, scripts y servidores locales de prueba eliminados.
- `.env.local` temporal de Vercel CLI eliminado; `main` limpio.
- **Cuenta temporal `admin-temporal`** (`agente.pruebas@casa.local`, id
  `cmvhxv2lm0000ppw180p7fax9`): existe con rol `ADMIN` y ya estaba **inactiva**.
  `/familia` la muestra como `INACTIVO` con la acción `Activar`; no fue necesario
  desactivarla. Verificado el 2026-10-26 con sesión ADMIN.

## Documentación actualizada

- [x] `MEMORY.md`: estado, roadmap, registro de features, foco, notas técnicas y
      lecciones.
- [x] `CHANGELOG.md`: entrega, despliegue y verificación real.
- [x] `README.md`: característica, configuración y enlaces.
- [x] `docs/recordatorios.md`, `docs/calendario.md`, `docs/pwa.md`,
      `docs/despliegue-vercel.md`, `docs/architecture.md` y `docs/roadmap.md`.
- [x] `spec.md` y `plan.md`: estado de implementación y verificación.
- [x] `tasks.md`: todas las tareas en `[x]`.
- [x] `AGENTS.md`: no aplica; no cambian reglas del arnés.
- [x] `npm run docs:check -- recordatorios`: pasa tras completar este cierre.

## Tareas

### Completadas

- Dependencia `web-push`, modelos y migración aditiva.
- Cálculo de avisos, DST, ventana, destinatarios y payload.
- VAPID, envío, errores y deduplicación.
- API de configuración, suscripciones, prueba, próximos y dispatch.
- Middleware, service worker, panel Avisos y enlace profundo.
- Scheduler de GitHub Actions.
- Tests, lint, typecheck, build y verificación de UI/API local.
- Documentación de uso y configuración.
- PR #26 mergeado, CI de `main` verde y deployment de producción con health
  `200`.
- VAPID, `CRON_SECRET`, `HOUSE_TIMEZONE`, `CASA_OS_URL` y el secreto de GitHub
  configurados.
- Redeploy final `dpl_GLUPgBsHBLV6k7MXAP11mikGiVKr` con health `200`.
- Suscripción FCM real, aviso de prueba y recordatorio de evento recibidos en el
  service worker.
- Deduplicación confirmada con dos ejecuciones del workflow.
- Suscripciones y eventos de prueba eliminados.
- Cuenta temporal `admin-temporal` revisada: existe y ya estaba inactiva en
  producción; no se modificó.

### Pendientes / follow-ups

- Email/SMS/Telegram, notas TODO, centro de notificaciones, recurrencias y
  Vercel Cron quedan en el backlog.
- El workflow de GitHub Actions se desactiva tras 60 días sin actividad; hay que
  relanzarlo manualmente o con un commit.

## Decisiones y lecciones

- Web Push en vez de email para no añadir proveedores ni coste.
- GitHub Actions en vez de Vercel Cron porque Hobby no permite cron sub-diario.
- 09:00 en `HOUSE_TIMEZONE` para todo el día; resta de días de calendario para
  respetar DST.
- Deduplicación en base de datos, no en memoria: el runtime serverless no
  comparte estado entre invocaciones.
- El service worker solo se registra en producción; la prueba real de push no se
  puede completar en `npm run dev`.
- iOS requiere PWA instalada; el panel debe explicarlo antes de pedir permiso.
- Un fallo de entrega (por ejemplo, una suscripción antigua) no debe bloquear a
  los demás destinatarios: el dispatch continúa y desactiva la suscripción
  muerta.
- La prueba real exige que el permiso de notificaciones siga concedido. En las
  pruebas con Chrome/CDP el permiso temporal se revierte al cerrar la sesión; la
  verificación fiable se hizo manteniendo la sesión abierta y, al terminar, se
  eliminó el perfil de prueba. Si el usuario revoca el permiso, Chrome puede
  desregistrar la suscripción y el servidor la desactiva en el siguiente envío.
- El `workflow_dispatch` permite verificar el dispatch sin esperar al cron; el
  secreto solo existe en Vercel/GitHub y no se imprime en logs.

## Riesgos residuales

- GitHub Actions puede retrasar el envío; la ventana de 15 minutos absorbe
  retrasos normales, pero no recupera avisos muy antiguos.
- GitHub desactiva workflows programados tras 60 días sin actividad; hay que
  relanzarlo manualmente.
- Si el envío tiene éxito pero falla la actualización de `ReminderDelivery`, un
  reintento podría duplicar el push. Es un caso poco probable y acotado.
- La entrega depende de FCM/APNs y del permiso del navegador; no hay garantía
  exacta al minuto.
- La tabla de entregas crecerá con el tiempo; no hay purga automática todavía.

## Checklist de cierre

- [x] El PR de la feature está mergeado y la rama borrada.
- [x] El CI de `main` está verde tras el merge de la feature.
- [x] Producción está desplegada y verificada; el smoke autenticado está
      documentado.
- [x] `tasks.md` no tiene casillas pendientes.
- [x] `cierre.md` no tiene casillas pendientes.
- [x] `MEMORY.md` enlaza este cierre y tiene el registro actualizado.
- [x] `CHANGELOG.md`, `README.md` y `docs/*` están al día.
- [x] `npm run docs:check -- recordatorios` pasa.
- [ ] El PR de cierre tiene el CI verde.
