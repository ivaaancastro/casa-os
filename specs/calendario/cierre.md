# Cierre — Calendario familiar

**Estado:** cerrada
**Fecha:** 2026-10-22
**Feature:** `calendario`

## Resumen

Se entrega el calendario compartido de la casa con vistas de mes y semana, alta,
detalle, edición y borrado de eventos. Los eventos pueden ser de todo el día o
tener hora, admiten un responsable opcional y guardan un recordatorio que se
muestra en el detalle. Los avisos reales quedan para `feat/recordatorios`.

## Alcance entregado

- Vista de mes (42 celdas, lunes primero) y vista de semana (lunes a domingo).
- Navegación anterior/siguiente/hoy y título del periodo visible.
- CRUD de eventos con título, descripción, fecha/hora, todo el día, quién y
  recordatorio.
- Agenda móvil al tocar un día y acceso de alta por día en la vista semanal.
- Permisos: cualquier miembro activo crea; solo el creador o un ADMIN edita o
  borra. La API devuelve `403` si se intenta saltar la UI.
- Fechas con hora en UTC y eventos de todo el día anclados a su clave
  `YYYY-MM-DD` para no desplazarse de zona horaria.
- Migración aditiva `add_calendar_events` (tabla `Event` y relaciones con
  `User`).
- Fuera de alcance: recurrencias, eventos de varios días, invitaciones,
  notificaciones, sincronización externa e historial.

## Cambios principales

| Área | Archivos | Qué cambió |
|---|---|---|
| Datos | `prisma/schema.prisma`, `prisma/migrations/20261022172743_add_calendar_events/` | Modelo `Event`, índice por `start` y relaciones `owner`/`createdBy` |
| Lógica | `src/lib/utils/calendar.ts`, `src/lib/events.ts`, `src/lib/utils/event.ts` | Rejilla, solapes, formatos, normalización de fechas y permisos |
| Validación | `src/lib/schemas/event.ts` | Zod para alta/edición y rango de listado |
| API | `src/app/api/events/route.ts`, `src/app/api/events/[id]/route.ts` | Listado, alta, edición y borrado autenticados |
| UI | `src/app/calendario/page.tsx`, `src/components/calendar/*` | Página, vistas mes/semana, toolbar y panel de evento |
| Navegación | `src/components/Sidebar.tsx`, `src/app/page.tsx` | Enlace a Calendario y módulo disponible en el dashboard |
| Diseño | `src/app/globals.css`, `src/components/calendar/EventPanel.tsx` | Feedback al pulsar, animaciones de panel y portal a `document.body` |
| Tests | `tests/calendar.test.ts`, `tests/api/event.schemas.test.ts`, `tests/middleware.test.ts` | Fechas, solapes, permisos, esquema y exclusión de API |
| Docs | `README.md`, `docs/calendario.md`, `CHANGELOG.md`, `MEMORY.md`, `docs/roadmap.md`, `AGENTS.md` | Uso, límites, estado y regla FAMILY |

## Verificación

### Código y tests

| Comando | Resultado |
|---|---|
| `npm run lint` | OK, sin avisos |
| `npm run typecheck` | OK |
| `npm run test` | 291 tests en 17 archivos, todos OK |
| `npm run build` | OK; `/calendario` dinámica y `/api/events` registradas |
| CI del PR | [PR #24](https://github.com/ivaaancastro/casa-os/pull/24), checks `quality`, `test`, `build` y Vercel en verde |
| CI de `main` | [run `39828836139`](https://github.com/ivaaancastro/casa-os/actions/runs/39828836139), en verde tras el squash merge |

### UI / Chrome

- **Navegador y viewport**: Chrome con Chrome MCP; escritorio 1440 × 1000 y
  móvil emulado 390 × 844 (DPR 2, touch).
- **Flujos comprobados en local**:
  - Vista de mes, navegación anterior/siguiente/hoy y cambio a semana.
  - Alta de evento con hora y de todo el día.
  - Edición, conversión a todo el día y borrado en dos pasos.
  - Detalle de evento, apertura/cierre con Escape y clic en el fondo.
  - Agenda móvil al tocar un día; alta desde una celda y desde «+ Añadir».
  - FAMILY: puede crear y borrar su evento; un evento de ADMIN se muestra en
    solo lectura. `PATCH`/`DELETE` directos sobre el evento ajeno → `403`.
  - Sin sesión: `GET`/`POST`/`PATCH`/`DELETE` de eventos → `401` JSON.
  - Validaciones de API: título vacío, responsable inexistente, fin anterior al
    inicio y rango incompleto → `400`; id inexistente → `404`.
- **Consola**: limpia; solo el aviso informativo de React DevTools en local. Se
  eliminó el warning de metadatos Apple añadiendo `mobile-web-app-capable`.
- **Responsive / overflow**: a 390 px no hay scroll horizontal; el panel cubre
  el viewport completo tras el portal y las acciones son accesibles con scroll
  interno. A 1440 px la rejilla y el panel se muestran sin solapes.
- **Evidencia visual**: capturas locales de mes, semana, agenda móvil, panel de
  alta y detalle; captura de producción del detalle con recordatorio. No se
  adjuntan datos privados.

### Producción

| Campo | Valor |
|---|---|
| URL | <https://casa-os-mauve.vercel.app> |
| Deployment | Vercel commit status success, deployment `CYckvdS6Bf8bMXKz1HkRH223bdEn` |
| Commit | `94a4d40` (squash merge de PR #24) |
| Health | `GET /api/health` → `200`, `{"status":"ok","db":"ok"}` |
| Rutas | `/auth/login` → `200`; `/manifest.webmanifest` → `200`; `/calendario` sin sesión → `307` al login; `/api/events` sin sesión → `401` JSON |
| Smoke autenticado | ADMIN en `/calendario`: alta de evento de todo el día el 28/10/2026, edición de título y recordatorio a «10 min antes», detalle correcto y borrado en dos pasos. `GET /api/events` final con 0 eventos; sin residuos. |
| Consola | Sin mensajes en producción tras el smoke. |

## Documentación actualizada

- [x] `MEMORY.md`: estado Hecho, registro, foco, notas técnicas y lecciones.
- [x] `CHANGELOG.md`: entrega y verificación en producción.
- [x] `README.md`: característica terminada y enlace a la guía.
- [x] `docs/*`: `docs/calendario.md`, `docs/roadmap.md` y `docs/architecture.md`.
- [x] `spec.md` y `plan.md`: estado y decisiones finales.
- [x] `tasks.md`: todas las tareas en `[x]` o movidas a follow-ups.
- [x] `AGENTS.md`: FAMILY crea eventos y edita los suyos.
- [ ] `npm run docs:check -- calendario` pasa.

## Tareas

### Completadas

- Modelo `Event`, relaciones y migración aditiva.
- Utilidades de calendario, esquema Zod y permisos.
- API de listado, alta, edición y borrado.
- Página `/calendario`, vistas de mes/semana, panel y agenda móvil.
- Tests de calendario, esquema y middleware.
- Verificación local de código, UI y permisos.
- PR #24 mergeado y CI de `main` en verde.
- Verificación en producción con smoke autenticado y limpieza del evento.
- Documentación de uso y estado.

### Pendientes / follow-ups

- Recurrencias y eventos de varios días — fuera de alcance — backlog.
- Notificaciones de recordatorio — `feat/recordatorios`.
- Invitaciones/asistentes y sincronización externa — backlog.

## Decisiones y lecciones

- El calendario es compartido: FAMILY puede crear, pero solo editar/borrar lo
  suyo; ADMIN puede todo. Se aplica en UI y API.
- «Quién» es un responsable opcional, no una invitación.
- El recordatorio se guarda y se muestra, pero no se envía; la UI lo dice.
- Los eventos de todo el día se guardan con clave UTC `YYYY-MM-DD` para evitar
  saltos de día entre zonas horarias.
- Un ancestro con `transform` rompe `position: fixed`; el panel se renderiza con
  un portal a `document.body`. Sin el portal, a 390 px quedaba desplazado y el
  botón del menú se superponía.
- La API de eventos se excluye del middleware para devolver `401` JSON; cada
  handler sigue aplicando `requireUser`.

## Riesgos residuales

- Sin notificaciones reales: el recordatorio es informativo hasta
  `feat/recordatorios`.
- Sin recurrencias ni eventos de varios días: un plan repetido requiere crear
  varios eventos.
- La vista no se guarda en la URL: al recargar vuelve al mes actual.
- Los eventos de todo el día usan una sola fecha; los rangos de varios días
  quedan fuera de alcance.

## Checklist de cierre

- [x] El PR de la feature está mergeado y la rama borrada.
- [x] El CI de `main` está verde tras el merge de la feature.
- [x] Producción está desplegada y verificada; el smoke autenticado está
      documentado.
- [x] `tasks.md` no tiene casillas pendientes.
- [ ] `cierre.md` no tiene casillas pendientes.
- [x] `MEMORY.md` enlaza este cierre y tiene el registro actualizado.
- [x] `CHANGELOG.md`, `README.md` y `docs/*` están al día.
- [ ] `npm run docs:check -- calendario` pasa.
- [ ] El PR de cierre tiene el CI verde.
