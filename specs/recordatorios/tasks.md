# Tasks — Recordatorios

> Estado: implementación y producción verificadas; cierre documental en curso.
> Spec aprobado el 2026-10-26. Producción verificada el 2026-10-26.
> Rama de cierre: `docs/cierre-recordatorios`.

## Base y datos

- [x] **1. Dependencia Web Push** — Añadir `web-push` y `@types/web-push` a
  `package.json`; documentar las variables VAPID/cron/zona en `.env.example`.
  No añadir `vercel.json`.
- [x] **2. Modelo y migración** — Añadir `PushSubscription` y
  `ReminderDelivery` en `prisma/schema.prisma` con relaciones, índices y
  `onDelete: Cascade`; crear la migración `add_push_reminders` y generar el
  cliente.
- [x] **3. Utilidades de programación** — Crear `src/lib/reminders.ts`:
  - `scheduledFor` para eventos con hora.
  - 09:00 local para todo el día con `HOUSE_TIMEZONE`.
  - Conversión de zona horaria/DST sin dependencias nuevas.
  - Ventana de 15 minutos, payload y URL segura.
- [x] **4. Tests de programación** — Crear `tests/reminders.test.ts` con casos
  de hora, todo el día, DST, ventana, destinatarios y payload.

## Servidor y API

- [x] **5. Librería de envío** — Crear `src/lib/push.ts`: configuración VAPID,
  `sendNotification`, clasificación de errores `404`/`410`, contador de fallos y
  desactivación tras 5 fallos.
- [x] **6. Validación Zod** — Crear `src/lib/schemas/push.ts` para
  suscripciones, `limit` y prueba; tests en
  `tests/api/push.schemas.test.ts`.
- [x] **7. API de configuración y suscripciones** — Implementar:
  - `GET /api/push/config`
  - `GET /api/push/subscriptions`
  - `POST /api/push/subscriptions`
  - `DELETE /api/push/subscriptions/[id]`
  - `POST /api/push/test`
- [x] **8. API de próximos avisos** — Implementar
  `GET /api/reminders/upcoming` con destinatarios por `ownerId`/toda la casa,
  límite 1–10 y solo avisos futuros.
- [x] **9. Dispatch del cron** — Implementar `POST /api/reminders/dispatch` con
  `CRON_SECRET` timing-safe, idempotencia, ventana, envío secuencial,
  desactivación de suscripciones muertas y respuesta de contadores.
- [x] **10. Middleware** — Excluir `/api/push` y `/api/reminders` del
  middleware de redirección para devolver `401` JSON; el dispatch mantiene su
  propio secreto.

## PWA e interfaz

- [x] **11. Service worker** — Añadir `push`, `notificationclick`, validación
  de URL same-origin y subida de `CACHE_VERSION` a `v2`; actualizar
  `tests/pwa-sw.test.ts`.
- [x] **12. Panel Avisos** — Crear `src/components/calendar/ReminderPanel.tsx`
  con estados de compatibilidad/permiso/configuración, activar, desactivar,
  prueba, próximos avisos, instrucciones iOS y accesibilidad.
- [x] **13. Integración en calendario** — Añadir el botón **Avisos** en
  `CalendarApp` y el enlace profundo `/calendario?date=YYYY-MM-DD`.
- [x] **14. Scheduler** — Crear `.github/workflows/recordatorios.yml` con cron
  cada 5 minutos, `workflow_dispatch`, `concurrency`, `CASA_OS_URL` y
  `CRON_SECRET`.

## Verificación y cierre

- [x] **15. Calidad** — `npm run lint && npm run typecheck && npm run test &&
  npm run build`: OK (334 tests, build con las rutas de push/reminders).
- [x] **16. UI con Chrome MCP** — Panel Avisos en escritorio y 390 px, estados
  sin configurar, activo (suscripción simulada), desactivar, próximos avisos,
  enlace `?date=`, consola limpia y sin overflow. La prueba de push real queda
  para producción.
- [x] **17. Documentación** — `docs/recordatorios.md`, `README.md`,
  `docs/calendario.md`, `docs/pwa.md`, `docs/despliegue-vercel.md`,
  `docs/architecture.md`, `CHANGELOG.md`, `MEMORY.md`, `docs/roadmap.md` y
  borrador de `specs/recordatorios/cierre.md`.
- [x] **18. PR y CI** — Commits atómicos, push de la rama, PR #26 con el spec,
  CI verde, squash merge `76f0683`, rama borrada y CI de `main` verde (run
  `40313415200`).
- [x] **19. Producción y smoke real** — Configurar VAPID, `CRON_SECRET` y
  `HOUSE_TIMEZONE` en Vercel; `CASA_OS_URL`/`CRON_SECRET` en GitHub; verificar
  health, suscripción real, aviso de prueba y evento con recordatorio recibido
  una sola vez. Baja del dispositivo verificada en local; suscripciones de
  producción eliminadas por API. Deployment de verificación
  `dpl_GLUPgBsHBLV6k7MXAP11mikGiVKr`, health `200`; runs `40325963795`
  (`sent:1`) y `40325997147` (`skipped:1`); evento y suscripciones de prueba
  eliminados. `cierre.md` completado y PR `docs/cierre-recordatorios` abierto.
- [x] **20. Cuenta temporal** — `admin-temporal`
  (`agente.pruebas@casa.local`, id `cmvhxv2lm0000ppw180p7fax9`, rol `ADMIN`) ya
  estaba **inactiva** en producción. `/familia` la muestra como `INACTIVO` con
  la acción `Activar`; no se modificó.

## Pendientes / follow-ups

- Email/SMS/Telegram y notificaciones nativas fuera de la PWA.
- Recordatorios de notas TODO y otros módulos.
- Centro de notificaciones persistente con leídas/no leídas.
- Múltiples recordatorios por evento y recurrencias.
- Migrar a Vercel Cron si se dispone de plan Pro.
