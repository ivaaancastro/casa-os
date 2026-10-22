# Plan — Calendario familiar

**Feature:** `calendario`
**Rama:** `feat/calendario`
**Hito:** 3 — Organización del hogar
**Depende de:** auth, layout y miembros de `feat/usuarios` (cerrada); no depende
de dispositivos ni de notas.

## Contexto

La casa ya tiene inventario, notas y familia, pero no hay una vista compartida
de lo que pasa esta semana: citas, colegio, visitas, tareas con fecha. El
roadmap pide un calendario familiar con vista de mes y semana, CRUD de eventos
(título, fecha, hora, quién, todo el día y recordatorio) y tests.

Esta feature entrega el calendario y guarda la preferencia de recordatorio. Los
avisos reales (push/email/navegador) pertenecen a `feat/recordatorios`; aquí no
se programa ningún envío.

## Enfoque técnico

1. **Modelo `Event` en PostgreSQL** con `start`, `end?`, `allDay`,
   `reminderMinutes?`, `ownerId?` (quién) y `createdById` (autor). Índice por
   `start`. Sin recurrencias, invitaciones ni historial.
2. **Fechas sin ambigüedad**:
   - Evento con hora: `start` y `end` son instantes ISO en UTC; la UI los
     muestra en la zona horaria del navegador.
   - Evento de todo el día: `start` es la fecha elegida a medianoche UTC y
     `end` es `null`; la UI lo pinta por su clave de fecha (`YYYY-MM-DD`), sin
     desplazarlo de día.
3. **API autenticada**:
   - `GET /api/events?from&to` devuelve los eventos que solapan el rango.
   - `POST /api/events` crea (cualquier miembro activo).
   - `PATCH /api/events/[id]` y `DELETE` solo para el creador o un ADMIN.
   - Zod valida título, descripción, fechas, `allDay`, recordatorio y `ownerId`;
     el propietario debe existir y estar activo.
4. **Una página cliente** (`/calendario`) que calcula el mes/semana en la zona
   horaria local, pide el rango a la API y navega sin recargar. El servidor solo
   resuelve la sesión y los miembros activos.
5. **Utilidades puras y testeables** en `src/lib/utils/calendar.ts`:
   semana que empieza en lunes, rejilla de 42 días, claves de fecha, solape de
   eventos con el día y formatos `es-ES`. Sin dependencias nuevas.
6. **UI editorial y mobile-first**:
   - Mes: rejilla de 7 columnas; en móvil los eventos se resumen con puntos y
     una agenda del día seleccionado; en escritorio se ven los títulos.
   - Semana: 7 columnas en escritorio y lista por días en móvil.
   - Panel de evento para crear/editar/ver, con borrado en dos pasos y aviso de
     permisos.
7. **Migración aditiva** `add_calendar_events`; se aplica con
   `prisma migrate deploy` en el build de Vercel. No toca datos existentes.

## Cambios previstos

| Área | Archivo | Cambio |
|---|---|---|
| Datos | `prisma/schema.prisma` + migración | Modelo `Event` y relaciones con `User` |
| Lógica | `src/lib/utils/calendar.ts` (nuevo) | Fechas, rejilla, solapes y formatos |
| Lógica | `src/lib/events.ts` (nuevo) | Selección pública y permisos de edición |
| Validación | `src/lib/schemas/event.ts` (nuevo) | Esquema Zod de creación/edición |
| API | `src/app/api/events/route.ts`, `[id]/route.ts` | Listado, alta, edición y borrado |
| UI | `src/app/calendario/page.tsx` (nuevo) | Página, sesión y miembros |
| UI | `src/components/calendar/CalendarApp.tsx` y subcomponentes | Mes, semana, toolbar y panel |
| Navegación | `src/components/Sidebar.tsx`, `src/app/page.tsx` | Enlace y estado «Disponible» |
| Tests | `tests/calendar.test.ts`, `tests/api/event.schemas.test.ts` | Fechas, solapes, permisos y esquema |
| Docs | `README.md`, `docs/calendario.md`, `CHANGELOG.md`, `MEMORY.md`, `docs/roadmap.md`, `AGENTS.md` | Uso, límites y regla de FAMILY en calendario |

## Decisiones de diseño

- **Calendario compartido**: todos los miembros activos leen y crean eventos.
  Editar o borrar queda limitado al creador o a un ADMIN, como en notas. Esto
  amplía la regla de FAMILY (antes solo notas) y se refleja en `AGENTS.md`.
- **«Quién» es un responsable opcional**, no una invitación: se elige entre los
  miembros activos o «Toda la casa». No hay aceptación/rechazo ni asistentes.
- **Recordatorio almacenado, no enviado**: `null`, a la hora, 10 min, 30 min,
  1 h o 1 día. La UI lo muestra; el envío llega en `feat/recordatorios`.
- **Todo el día = un solo día**. Los eventos de varios días y las recurrencias
  quedan fuera de alcance para no complicar el modelo ni la rejilla.
- **Sin dependencias de fechas**: `Intl` y aritmética de `Date` bastan para mes,
  semana y formatos; se testean los casos de cambio de mes, año bisiesto y
  domingo/lunes.
- **La vista no se guarda en URL**: al recargar vuelve al mes actual. Es un
  calendario personal; no hay enlaces profundos a un mes concreto en v1.

## Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Desfase de un día en eventos «todo el día» por zona horaria | Fecha UTC + clave `YYYY-MM-DD` para todo el día; tests de claves |
| Evento con hora mal guardado por `datetime-local` | El cliente convierte a ISO con `toISOString()`; Zod exige instante válido |
| Edición de eventos ajenos | Regla creador/ADMIN en API y UI, con test de permisos |
| Rejilla distinta según el mes | 42 celdas fijas, inicio en lunes y tests de febrero/año bisiesto |
| Migración en producción | Migración aditiva, `migrate deploy` en `vercel-build` y verificación de health |
| Solapes de eventos con hora que cruzan medianoche | Utilidad de solape por día, no solo por fecha de inicio |

## Fuera de alcance

- Recurrencias, eventos de varios días y zonas horarias por evento.
- Invitaciones, asistentes, aceptación/rechazo y comentarios.
- Notificaciones push/email/navegador (`feat/recordatorios`).
- Sincronización con Google Calendar/ICS, arrastrar para mover y exportación.
- Historial de cambios o papelera.

## Verificación prevista

- Tests unitarios de rejilla, claves, solapes, formatos, permisos y Zod.
- `npm run lint && npm run typecheck && npm run test && npm run build`.
- Chrome MCP: crear/editar/borrar, todo el día y con hora, navegación de mes y
  semana, permisos FAMILY, móvil 390 px y consola limpia.
- Producción: migración aplicada, health, rutas y smoke autenticado con un
  evento temporal eliminado al terminar.
