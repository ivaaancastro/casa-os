# Spec — Calendario familiar

**Feature:** `calendario`
**Estado:** cerrada — implementada, desplegada y verificada en producción
**Fecha:** 2026-10-22
**Hito:** 3 — Organización del hogar

## Objetivo

Disponer de un calendario compartido de la casa con vista de **mes** y
**semana**, donde cualquier miembro activo puede crear eventos y cada evento
muestra título, fecha, hora, responsable, si es de todo el día y su
recordatorio. Los avisos reales se implementarán en `feat/recordatorios`.

Decisiones aprobadas por el usuario:

- **Toda la familia** puede crear eventos; solo el creador o un ADMIN puede
  editarlos o borrarlos.
- El recordatorio se **guarda y se muestra**, pero no se envía todavía.

## Requisitos funcionales

### RF-1 — Vista de mes

- `/calendario` abre en el mes actual.
- Rejilla de 7 columnas con la semana empezando en **lunes** y 42 celdas
  (6 semanas), incluyendo días de los meses vecinos atenuados.
- Cada celda muestra el número de día y sus eventos ordenados: primero los de
  todo el día, después por hora de inicio.
- En escritorio se ven hasta 3 títulos por día y «+N más» si no caben.
- En móvil se muestran puntos por evento; al tocar un día se abre debajo una
  agenda con sus eventos y un acceso para añadir.
- Al tocar un día vacío se abre el panel de **nuevo evento** con esa fecha.
- Al tocar un evento se abre su detalle/edición.

### RF-2 — Vista de semana

- Alternancia **Mes / Semana** en la barra de herramientas.
- Semana de lunes a domingo, con la fecha y los eventos de cada día.
- En escritorio, 7 columnas; en móvil, una lista vertical por días.
- La navegación anterior/siguiente avanza un mes o una semana según la vista.
- **Hoy** vuelve al mes/semana actual. El título muestra el rango visible.

### RF-3 — Crear eventos

Cualquier usuario autenticado puede crear un evento con:

- **Título** obligatorio, 1–120 caracteres.
- **Descripción** opcional, hasta 1000 caracteres.
- **Todo el día** (sí/no).
- **Fecha** (y hora de inicio/fin si no es todo el día).
- **Quién**: «Toda la casa» o un miembro activo (opcional).
- **Recordatorio**: sin recordatorio, a la hora, 10 min, 30 min, 1 h o 1 día
  antes.

Validaciones:

- Un evento con hora debe tener `end > start`; el fin es obligatorio.
- Un evento de todo el día no lleva hora de fin.
- La fecha de todo el día debe ser una fecha real (`YYYY-MM-DD`).
- El responsable, si se indica, debe existir y estar activo.
- El autor se guarda automáticamente y se muestra en el detalle.

### RF-4 — Editar y borrar

- Solo el **creador** o un **ADMIN** puede editar o borrar un evento.
- El resto de miembros puede consultar el detalle en modo lectura.
- La edición reutiliza el mismo formulario y validaciones que el alta.
- El borrado pide confirmación en dos pasos y no se puede deshacer.
- La UI oculta los controles de edición/borrado a quien no tiene permiso; la
  API devuelve `403` si se intenta igualmente.

### RF-5 — Fechas y zonas horarias

- Los eventos con hora se guardan como instantes UTC y se muestran en la zona
  horaria del navegador.
- Los eventos de todo el día se guardan como fecha UTC (`YYYY-MM-DD` a
  medianoche) y se muestran siempre en ese día, sin desplazarse por zona
  horaria.
- Un evento con hora que cruza medianoche aparece en los dos días afectados.
- La rejilla y la navegación se calculan en el cliente, usando la fecha local.

### RF-6 — Recordatorio visible

- El detalle muestra «Sin recordatorio» o «10 min antes», «1 h antes», etc.
- El calendario **no** envía avisos en esta feature; la UI lo indica en la guía
  (`docs/calendario.md`) y no promete notificaciones.

### RF-7 — Navegación e integración

- El sidebar incluye **Calendario** entre Notas y Familia.
- El dashboard muestra Calendario como **Disponible** y enlaza a `/calendario`.
- La página exige sesión; sin sesión redirige a `/auth/login`.
- Los miembros inactivos no aparecen en el selector de «Quién», pero sus
  eventos históricos se siguen mostrando con su nombre.

## Requisitos no funcionales

- **Seguridad**: todas las rutas de API exigen sesión; validación Zod en alta y
  edición; el autor no se acepta desde el cliente; `ownerId` se valida contra
  usuarios activos.
- **Permisos**: lectura y alta para ADMIN y FAMILY; edición/borrado solo para el
  creador o ADMIN. Se actualiza `AGENTS.md` para reflejar que FAMILY también
  escribe en el calendario.
- **Rendimiento**: el listado se limita al rango visible (mes o semana) y usa el
  índice de `start`. La rejilla es de 42 celdas fijas.
- **UX**: mobile-first, teclado y lectores de pantalla; panel con `role="dialog"`,
  cierre con Escape y foco inicial; estados de carga, vacío y error visibles.
- **Compatibilidad**: sin dependencias nuevas; `Intl.DateTimeFormat('es-ES')`.
- **Datos**: migración aditiva, sin tocar tablas existentes.

## API / Endpoints

### `GET /api/events?from=ISO&to=ISO`

- **Auth**: sesión válida.
- **Query**: `from` y `to` opcionales; si se envían, ambos y `to > from`.
- **Response**: `200` con `{ events: EventWithPeople[] }`, ordenados por
  `start` ascendente.
- **Rango**: devuelve eventos que solapan el intervalo, incluidos los que
  empiezan antes y terminan dentro.
- **Error**: `400` con parámetros inválidos; `401` sin sesión.

```json
{
  "events": [
    {
      "id": "evt_1",
      "title": "Cena familiar",
      "description": null,
      "start": "2026-10-24T18:00:00.000Z",
      "end": "2026-10-24T20:00:00.000Z",
      "allDay": false,
      "reminderMinutes": 60,
      "owner": { "id": "usr_1", "name": "Iván" },
      "createdBy": { "id": "usr_1", "name": "Iván" },
      "createdAt": "2026-10-22T10:00:00.000Z",
      "updatedAt": "2026-10-22T10:00:00.000Z"
    }
  ]
}
```

### `POST /api/events`

- **Auth**: sesión válida (ADMIN o FAMILY).
- **Body**:

```json
{
  "title": "Cena familiar",
  "description": null,
  "allDay": false,
  "start": "2026-10-24T20:00:00.000Z",
  "end": "2026-10-24T22:00:00.000Z",
  "ownerId": "usr_1",
  "reminderMinutes": 60
}
```

- **Todo el día**:

```json
{
  "title": "Cumpleaños de Ana",
  "allDay": true,
  "start": "2026-10-25",
  "end": null,
  "reminderMinutes": 1440
}
```

- **Response**: `201` con el evento creado y sus relaciones.
- **Errores**: `400` validación u owner inválido; `401` sin sesión.

### `PATCH /api/events/[id]`

- **Auth**: creador o ADMIN.
- **Body**: mismo contrato completo que `POST` (no es un parche parcial; el
  formulario envía todos los campos).
- **Response**: `200` con el evento actualizado.
- **Errores**: `400` validación, `401` sin sesión, `403` sin permiso, `404` no
  encontrado.

### `DELETE /api/events/[id]`

- **Auth**: creador o ADMIN.
- **Response**: `204` sin cuerpo.
- **Errores**: `401`, `403`, `404`.

## Modelo de datos

```prisma
model Event {
  id              String   @id @default(cuid())
  title           String
  description     String?
  start           DateTime
  end             DateTime?
  allDay          Boolean  @default(false)
  reminderMinutes Int?
  ownerId         String?
  owner           User?    @relation("EventOwner", fields: [ownerId], references: [id], onDelete: SetNull)
  createdById     String
  createdBy       User     @relation("EventCreator", fields: [createdById], references: [id], onDelete: Cascade)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([start])
}
```

En `User` se añaden:

```prisma
eventsOwned   Event[] @relation("EventOwner")
eventsCreated Event[] @relation("EventCreator")
```

Reglas:

- `allDay = true` → `start` a medianoche UTC de la fecha y `end = null`.
- `allDay = false` → `start` y `end` son instantes UTC con `end > start`.
- `reminderMinutes` ∈ `{null, 0, 10, 30, 60, 1440}`.
- `ownerId` nulo significa «Toda la casa».
- No hay tabla de asistentes ni de recordatorios enviados.

Migración: `add_calendar_events` (solo crea `Event` y relaciones; no modifica
columnas existentes).

## UI / UX

### Estructura

```
Casa · Calendario
Calendario
[<] [Hoy] [>]  Octubre 2026        [Mes] [Semana]  [+ Nuevo evento]

[rejilla de mes o semana]

[agenda del día seleccionado en móvil]
```

- Cabecera editorial como el resto de secciones.
- Barra de herramientas con navegación, título del periodo, selector de vista y
  botón primario.
- Estados: carga discreta, vacío («No hay eventos este mes»), error con
  `role="alert"`.
- Panel de evento:
  - Cabecera con título y acciones (Editar / Eliminar / Cerrar).
  - Detalle: fecha, hora o «Todo el día», quién, recordatorio, descripción y
    «Creado por».
  - Formulario: campos etiquetados, checkbox de todo el día, selects de quién y
    recordatorio, botones Guardar/Cancelar.
  - El borrado muestra «¿Eliminar este evento?» con Sí/No.
  - Sin permiso: solo lectura, sin botones de edición ni borrado.

### Responsive

- 390 px: mes con celdas compactas y puntos; agenda debajo; semana en lista.
- 768 px: rejilla de mes con títulos truncados; semana en columnas.
- Sin scroll horizontal en ninguno de los dos ejes.

### Accesibilidad

- Botones con `aria-label` para anterior/siguiente y cierre.
- Panel con `role="dialog"`, `aria-modal="true"` y foco en el primer campo.
- Cierre con `Escape` y clic en el fondo.
- Los días y eventos son botones, no `div` clicables.
- Colores de estado con texto además de color.

## Criterios de aceptación

- [x] `/calendario` exige sesión y aparece en sidebar y dashboard.
- [x] La vista de mes muestra 42 celdas, empieza en lunes y navega por meses.
- [x] La vista de semana muestra de lunes a domingo y navega por semanas.
- [x] Se crea un evento con hora, otro de todo el día y otro con recordatorio.
- [x] Se edita un evento y se borra con confirmación.
- [x] Un evento de todo el día no se desplaza de día en otra zona horaria.
- [x] Un evento con hora que cruza medianoche aparece en ambos días.
- [x] FAMILY puede crear; no puede editar/borrar eventos ajenos; ADMIN sí.
- [x] La API devuelve `401` sin sesión y `403` sin permiso.
- [x] El responsable solo admite miembros activos.
- [x] La UI funciona a 390 px sin overflow y con consola limpia.
- [x] `npm run lint && npm run typecheck && npm run test && npm run build` pasa.
- [x] `npm run db:migrate` genera `add_calendar_events` y el build la aplica.
- [x] `docs/calendario.md`, README, CHANGELOG, MEMORY y roadmap actualizados.
- [x] Producción verificada con health, rutas y smoke autenticado.

## Fuera de alcance

- Recurrencias, eventos de varios días y edición arrastrando.
- Notificaciones push/email/navegador: `feat/recordatorios`.
- Invitaciones, asistentes y sincronización con calendarios externos.
- Historial de cambios, papelera y exportación ICS.
