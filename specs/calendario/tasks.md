# Tasks — Calendario familiar

> Estado: implementación completada; pendiente de PR y cierre en producción.
> Spec aprobado el 2026-10-22.

## Datos y lógica

- [x] **1. Modelo y migración** — Añadir `Event` y las relaciones
  `eventsOwned`/`eventsCreated` en `User`; crear la migración
  `add_calendar_events` y generar el cliente.
- [x] **2. Utilidades de calendario** — Crear `src/lib/utils/calendar.ts`:
  claves de fecha, inicio de semana, rejilla de 42 días, rango de mes/semana,
  solape por día, orden y formatos `es-ES`.
- [x] **3. Lógica de eventos y permisos** — Crear `src/lib/events.ts` con el
  `include` de personas, `canEditEvent` y la respuesta de errores común.
- [x] **4. Esquema Zod** — Crear `src/lib/schemas/event.ts`: título,
  descripción, todo el día, fechas, recordatorio y `ownerId`; validación
  cruzada de fin y formatos.
- [x] **5. Tests de lógica** — Crear `tests/calendar.test.ts` y
  `tests/api/event.schemas.test.ts` para rejilla, solapes, formatos, permisos y
  validaciones.

## API

- [x] **6. Listado de eventos** — Implementar `GET /api/events` con rango
  opcional, solape, sesión obligatoria y orden por inicio.
- [x] **7. Alta de eventos** — Implementar `POST /api/events`: autor de sesión,
  owner activo y fecha normalizada.
- [x] **8. Edición y borrado** — Implementar `PATCH` y `DELETE
  /api/events/[id]` con regla creador/ADMIN y códigos `401/403/404`.

## Interfaz

- [x] **9. Página y navegación** — Crear `/calendario` con sesión y miembros;
  añadir el enlace en sidebar y el estado Disponible en el dashboard.
- [x] **10. Vistas mes y semana** — Crear `CalendarApp`, `MonthView` y
  `WeekView` con navegación anterior/siguiente/hoy y agenda móvil.
- [x] **11. Panel de evento** — Crear `EventPanel`: detalle, alta, edición,
  borrado en dos pasos, permisos y validación en cliente.
- [x] **12. Diseño Apple y accesibilidad** — Feedback al pulsar, jerarquía
  tipográfica, panel con entrada/salida coherente, foco, Escape, estados de
  carga/vacío/error y respeto a `prefers-reduced-motion`.

## Cierre de la feature

- [x] **13. Calidad** — `npm run lint && npm run typecheck && npm run test &&
  npm run build`.
- [x] **14. Documentación** — `README.md`, `docs/calendario.md`, `CHANGELOG.md`,
  `MEMORY.md`, `docs/roadmap.md` y `AGENTS.md`; borrador de
  `specs/calendario/cierre.md`.
- [ ] **15. UI y PR** — Verificación Chrome MCP (escritorio y 390 px), commits,
  PR, CI verde, squash merge y borrado de rama.
- [ ] **16. Cierre en producción** — Migración aplicada, health, rutas y smoke
  autenticado; completar `cierre.md` y PR `docs/cierre-calendario`.

## Pendientes / follow-ups

- Recurrencias y eventos de varios días: backlog.
- Notificaciones de recordatorio: `feat/recordatorios`.
- Invitaciones/asistentes y sincronización externa: backlog.
