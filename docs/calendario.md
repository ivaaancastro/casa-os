# Calendario familiar

El calendario compartido de casa-os permite ver y organizar los planes de la
casa en una vista de **mes** o de **semana**. Cualquier miembro activo puede
crear eventos; editar y borrar queda limitado a quien los creó o a un ADMIN.

## Qué incluye

- Vista de mes con la semana empezando en lunes y una rejilla fija de 42 celdas.
- Vista de semana de lunes a domingo.
- Navegación anterior/siguiente y botón **Hoy**.
- Eventos con hora o de **todo el día**.
- Título, descripción, responsable («Quién») y recordatorio.
- Alta, detalle, edición y borrado en dos pasos.
- Agenda del día en móvil: al tocar una celda se muestran sus eventos debajo.
- En escritorio, clic en un día vacío abre el alta para esa fecha.
- Panel **Avisos** para activar Web Push en el dispositivo, enviar una prueba,
  desactivarlo y ver los próximos recordatorios.
- Enlace profundo `/calendario?date=YYYY-MM-DD`, que posiciona el calendario en
  ese día y abre su agenda.

## Permisos

| Acción | ADMIN | FAMILY |
|---|---|---|
| Ver el calendario | Sí | Sí |
| Crear eventos | Sí | Sí |
| Editar/borrar sus propios eventos | Sí | Sí |
| Editar/borrar eventos de otra persona | Sí | No |

La UI oculta las acciones que no corresponden y la API devuelve `403` si se
intenta igualmente. Un evento ajeno se puede consultar en modo lectura.

## Uso

1. Entra en **Calendario** desde el sidebar o desde el dashboard.
2. Cambia entre **Mes** y **Semana** con el selector.
3. Pulsa **Nuevo evento** para crear uno.
4. Marca **Todo el día** si no tiene hora; si no, indica inicio y fin.
5. Elige **Quién** (o «Toda la casa») y un **Recordatorio**.
6. Abre un evento para ver su detalle. Si eres su creador o ADMIN, podrás
   editarlo o eliminarlo.

En móvil, tocar un día abre su agenda debajo de la rejilla. En la vista de
semana cada día tiene su propio acceso **+ Añadir**.

El botón **Avisos** abre el panel de Web Push. Desde ahí se activa el aviso en
el dispositivo actual, se envía una prueba y se consultan los próximos
recordatorios. La configuración completa está en
[`docs/recordatorios.md`](recordatorios.md).

## Fechas y zonas horarias

- **Con hora**: se guarda como instante UTC y se muestra en la zona horaria del
  navegador.
- **Todo el día**: se guarda como fecha `YYYY-MM-DD` a medianoche UTC y se pinta
  por esa clave, sin desplazarse de día.
- Un evento con hora que cruza medianoche aparece en los dos días afectados.
- La rejilla y la navegación se calculan en el cliente con la fecha local.

## Recordatorios

El recordatorio se guarda en el evento y se envía por Web Push si el usuario
tiene los avisos activados en algún dispositivo. Los eventos con hora avisan
`inicio - recordatorio`; los de todo el día, a las 09:00 de `HOUSE_TIMEZONE`
(por defecto `Europe/Madrid`).

Valores admitidos: `null` (sin recordatorio), `0` (a la hora), `10`, `30`, `60`
minutos y `1440` (un día antes).

El envío lo comprueba un cron cada 5 minutos dentro de una ventana de 15
minutos. Si el aviso llega tarde y queda fuera de la ventana, no se envía
retroactivamente. Cada dispositivo recibe como máximo un aviso por evento y hora
programada.

El funcionamiento, la configuración VAPID, el scheduler de GitHub Actions y los
límites están en [`docs/recordatorios.md`](recordatorios.md).

## API

Todas las rutas exigen sesión. Sin sesión devuelven `401` JSON.

### `GET /api/events?from=ISO&to=ISO`

`from` y `to` son opcionales, pero si se envían deben venir los dos y
`to > from`. Devuelve los eventos que solapan el rango, ordenados por inicio.

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

Cualquier usuario autenticado puede crear. El autor se toma de la sesión; el
cliente no puede enviarlo.

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

Para un evento de todo el día:

```json
{
  "title": "Cumpleaños de Ana",
  "allDay": true,
  "start": "2026-10-25",
  "end": null,
  "reminderMinutes": 1440
}
```

Devuelve `201` con el evento creado. Errores: `400` (validación o responsable
inexistente/inactivo) y `401` (sin sesión).

### `PATCH /api/events/[id]`

Mismo contrato completo que `POST`. Solo el creador o un ADMIN. Devuelve `200`
con el evento actualizado; `400`, `401`, `403` o `404` según el caso.

### `DELETE /api/events/[id]`

Solo el creador o un ADMIN. Devuelve `204`; `401`, `403` o `404` según el caso.

## Datos

Modelo `Event` (`prisma/schema.prisma`):

- `title`, `description?`, `start`, `end?`, `allDay`, `reminderMinutes?`
- `ownerId?` → miembro responsable (opcional; `null` = toda la casa)
- `createdById` → autor del evento
- `createdAt`, `updatedAt` e índice por `start`

La migración `add_calendar_events` es aditiva: solo crea `Event` y sus relaciones
con `User`; no modifica tablas existentes. La feature de recordatorios añade
después `PushSubscription` y `ReminderDelivery` (ver
[`docs/recordatorios.md`](recordatorios.md)).

## Límites actuales

- Sin recurrencias ni eventos de varios días.
- Sin invitaciones, asistentes, aceptación/rechazo ni comentarios.
- Sin sincronización con Google Calendar/ICS ni arrastrar para mover.
- Sin historial de cambios ni papelera.
- Un solo recordatorio por evento; sin recurrencias ni varios avisos.
- Los avisos dependen de que el dispositivo tenga Web Push activado y de que el
  cron pueda ejecutarse.

## Verificación

```bash
npm run lint && npm run typecheck && npm run test && npm run build
```

Tests relevantes: `tests/calendar.test.ts` y
`tests/api/event.schemas.test.ts`.
