# Cierre — Recordatorios

**Estado:** borrador
**Fecha:** 2026-10-26
**Feature:** `recordatorios`

## Resumen

Se entrega Web Push para los recordatorios del calendario: activación por
dispositivo, aviso de prueba, panel **Avisos** con próximos recordatorios y
enlace profundo al día del evento. El envío lo comprueba un workflow de GitHub
Actions cada 5 minutos y se deduplica en PostgreSQL.

La implementación, los tests y la UI local están completados. El código está
mergeado en `main` (PR #26, commit `76f0683`) y desplegado en producción
(deployment `AbHRRwJror3iHMpVKbvMnfqWCYE3`, health `200`). La feature **no está
cerrada**: falta configurar VAPID/`CRON_SECRET`/GitHub Actions y verificar un
aviso real con sesión de producción.

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
| CI del PR | [PR #26](https://github.com/ivaaancastro/casa-os/pull/26): `quality`, `test`, `build` y Vercel en verde |
| CI de `main` | [run `40313415200`](https://github.com/ivaaancastro/casa-os/actions/runs/40313415200), en verde tras el squash merge |

### UI / Chrome

- **Navegador y viewport**: Chrome con Chrome MCP; escritorio y móvil emulado
  390 × 844 (DPR 3, touch).
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
- **Evidencia visual**: capturas locales del panel a 390 px con estado sin
  configurar y con próximos avisos; no se adjuntan datos privados.
- **No verificado en local**: entrega real a FCM/APNs y recepción con la app
  cerrada. Requiere un navegador con permiso real y un build desplegado.

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
| Deployment | Vercel `AbHRRwJror3iHMpVKbvMnfqWCYE3`, estado success |
| Commit | `76f0683` (squash merge de PR #26) |
| Health | `GET /api/health` → `200`, `{"status":"ok","db":"ok"}` |
| Rutas | `GET /api/push/config`, `/api/push/subscriptions` y `/api/reminders/upcoming` sin sesión → `401` JSON; `POST /api/reminders/dispatch` → `503` («El cron no está configurado»); `/sw.js` → `200` con la versión nueva; manifest → `200` |
| Smoke autenticado | Pendiente: no hay sesión de producción disponible para el agente |
| Aviso real | Pendiente: configurar VAPID/`CRON_SECRET`, suscripción, prueba, evento y recepción única |

## Documentación actualizada

- [x] `MEMORY.md`: estado, roadmap, decisiones, notas técnicas y foco.
- [x] `CHANGELOG.md`: entrada de la entrega y corrección del panel.
- [x] `README.md`: característica, configuración y enlaces.
- [x] `docs/recordatorios.md`, `docs/calendario.md`, `docs/pwa.md`,
      `docs/despliegue-vercel.md` y `docs/architecture.md`.
- [x] `spec.md` y `plan.md`: estado de implementación.
- [x] `tasks.md`: tareas locales en `[x]`; pendientes de producción marcadas.
- [x] `AGENTS.md`: no aplica; no cambian reglas del arnés.
- [ ] `npm run docs:check -- recordatorios`: pendiente hasta completar
      producción y marcar el cierre como cerrada. Hoy falla por las tareas 19 y
      20 y por las casillas de producción, no por documentación ausente.

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

### Pendientes / follow-ups

- Configurar VAPID, `CRON_SECRET` y `HOUSE_TIMEZONE` en Vercel; `CASA_OS_URL` y
  `CRON_SECRET` en GitHub. Hoy el dispatch de producción responde `503` porque
  falta el secreto.
- Suscripción real, aviso de prueba, evento con recordatorio recibido una sola
  vez y desactivación.
- Desactivar `admin-temporal` si sigue activa en producción.
- Completar este cierre, `npm run docs:check -- recordatorios` y PR
  `docs/cierre-recordatorios`.
- Email/SMS/Telegram, notas TODO, centro de notificaciones, recurrencias y
  Vercel Cron quedan en el backlog.

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

## Riesgos residuales

- GitHub Actions puede retrasar el envío; la ventana de 15 minutos absorbe
  retrasos normales, pero no recupera avisos muy antiguos.
- GitHub desactiva workflows programados tras 60 días sin actividad; hay que
  relanzarlo manualmente.
- Si el envío tiene éxito pero falla la actualización de `ReminderDelivery`, un
  reintento podría duplicar el push. Es un caso poco probable y acotado.
- La configuración de producción y el smoke real siguen sin verificar; no se
  puede declarar la feature terminada.
- La tabla de entregas crecerá con el tiempo; no hay purga automática todavía.

## Checklist de cierre

- [x] El PR de la feature está mergeado y la rama borrada.
- [x] El CI de `main` está verde tras el merge de la feature.
- [ ] Producción está desplegada y verificada; el smoke autenticado está
      documentado.
- [ ] `tasks.md` no tiene casillas pendientes.
- [ ] `cierre.md` no tiene casillas pendientes.
- [ ] `MEMORY.md` enlaza este cierre y tiene el registro actualizado.
- [ ] `CHANGELOG.md`, `README.md` y `docs/*` están al día.
- [ ] `npm run docs:check -- recordatorios` pasa.
- [ ] El PR de cierre tiene el CI verde.
