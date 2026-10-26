# Recordatorios y avisos push

Los eventos del calendario pueden enviar un aviso al navegador o al móvil,
incluso con la app cerrada, mediante **Web Push**. El panel **Avisos** del
calendario permite activar los avisos en cada dispositivo, enviar una prueba y
consultar los próximos recordatorios que te corresponden.

Esta fase cubre Web Push y el panel in-app. No hay email, SMS, Telegram ni
historial de notificaciones leídas.

> **Estado:** desplegado y verificado en producción el 2026-10-26. El workflow
> de GitHub Actions está activo cada 5 minutos y la entrega real se comprobó con
> una suscripción FCM, un aviso de prueba y un recordatorio de evento
> deduplicado.

## Cómo se activa

1. Entra en **Calendario** con tu cuenta.
2. Pulsa **Avisos**.
3. Pulsa **Activar avisos en este dispositivo** y acepta el permiso del
   navegador.
4. Usa **Enviar prueba** para comprobar que el aviso llega.
5. Para dejar de recibirlos en ese dispositivo, pulsa **Desactivar en este
   dispositivo**.

Cada miembro puede tener varios dispositivos activos (móvil, portátil, etc.).
El panel solo gestiona el dispositivo desde el que se abre.

### iOS y iPadOS

Safari no entrega push a una pestaña normal. En iPhone o iPad hay que instalar
la PWA:

1. Abrir la app en **Safari**.
2. **Compartir → Añadir a pantalla de inicio**.
3. Abrir casa·os desde el icono de la pantalla de inicio.
4. Entrar en **Calendario → Avisos** y activar los avisos.

Se requiere iOS/iPadOS 16.4 o superior.

## Cuándo se envía

| Tipo de evento | Momento del aviso |
|---|---|
| Con hora | `inicio - recordatorio` |
| Todo el día, `0` | 09:00 del día del evento |
| Todo el día, `10` | 08:50 del día del evento |
| Todo el día, `60` | 08:00 del día del evento |
| Todo el día, `1440` | 09:00 del día anterior |

La hora de los eventos de todo el día se calcula en `HOUSE_TIMEZONE`
(`Europe/Madrid` por defecto) y respeta el cambio de horario. Para «1 día antes»
se resta un día de calendario, no 24 horas absolutas.

Un evento sin recordatorio (`null`) no genera avisos. Si se edita la fecha, la
hora o el recordatorio, se usa el cálculo nuevo. Si se borra el evento, sus
entregas se borran en cascada.

### Ventana y deduplicación

El scheduler llama al dispatch cada 5 minutos. Solo se procesan los avisos cuya
hora programada está entre **15 minutos antes de ahora y ahora**. Un aviso que
quedó fuera de esa ventana no se envía retroactivamente.

La tabla `ReminderDelivery` guarda una fila por
`[eventId, subscriptionId, scheduledFor]`. Esa clave única evita duplicados si
el cron se ejecuta dos veces o se reintenta. Un fallo de una suscripción no
bloquea el envío al resto.

### Destinatarios

- **Evento con responsable**: solo recibe el aviso ese miembro, siempre que esté
  activo y tenga suscripciones activas.
- **Evento de «Toda la casa»**: reciben todos los miembros activos con
  suscripciones activas.
- El creador no recibe el aviso por defecto si el evento tiene otro responsable.

## Notificación y enlace profundo

La notificación muestra `Recordatorio · <título>`, la fecha/hora en la zona de
la casa y, si aplica, el responsable. Al pulsarla se enfoca una pestaña abierta
de casa·os o se abre una nueva en:

```
/calendario?date=YYYY-MM-DD
```

El calendario se posiciona en ese día y abre su agenda. El service worker solo
acepta URLs del mismo origen; un payload externo se sustituye por
`/calendario`.

## Configuración

### Variables de entorno

En local se configuran en `.env`; en Vercel, en **Settings → Environment
Variables**. No se commitean secretos.

| Variable | Entorno | Uso |
|---|---|---|
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Cliente y servidor | Clave pública VAPID |
| `VAPID_PRIVATE_KEY` | Solo servidor | Clave privada VAPID |
| `VAPID_SUBJECT` | Solo servidor | Contacto `mailto:` o URL `https://` |
| `CRON_SECRET` | Solo servidor | Secreto compartido con GitHub Actions |
| `HOUSE_TIMEZONE` | Servidor | Zona de la casa; por defecto `Europe/Madrid` |

Genera el par VAPID una sola vez y guárdalo en tu gestor de contraseñas:

```bash
npx web-push generate-vapid-keys
```

Si faltan las claves VAPID, el panel muestra «Los avisos no están configurados
en el servidor» y el dispatch responde `503`. No se envía nada.

### Scheduler con GitHub Actions

Vercel Hobby solo permite cron una vez al día, así que el scheduler vive en
GitHub Actions:

- Workflow: `.github/workflows/recordatorios.yml`.
- Frecuencia: cada 5 minutos (`*/5 * * * *`) y ejecución manual
  (`workflow_dispatch`).
- `concurrency` evita ejecuciones solapadas.

Configura en GitHub (**Settings → Secrets and variables → Actions**):

| Tipo | Nombre | Valor |
|---|---|---|
| Variable | `CASA_OS_URL` | URL pública, por ejemplo `https://casa-os-mauve.vercel.app` |
| Secreto | `CRON_SECRET` | El mismo valor que en Vercel |

El workflow llama a `POST /api/reminders/dispatch` con
`Authorization: Bearer <CRON_SECRET>`. No escribe el secreto en los logs.

El `schedule` solo se activa en la rama por defecto del repositorio. Antes de
mergear, o para probarlo sin esperar, usa **Actions → Recordatorios → Run
workflow**.

> GitHub Actions puede retrasar ejecuciones y desactiva los workflows
> programados tras 60 días sin actividad del repositorio. Si eso ocurre, relanza
> el workflow manualmente. Si algún día se pasa a Vercel Pro, se puede sustituir
> por Vercel Cron cada 5 minutos.

### Base de datos

La migración `20261026104419_add_push_reminders` es aditiva: crea
`PushSubscription` y `ReminderDelivery`, sus índices y relaciones en cascada. Se
aplica con:

```bash
npm run db:migrate:deploy
```

## API

Todas las rutas de usuario exigen sesión y devuelven `401` JSON sin ella. La de
dispatch usa el secreto del cron.

### `GET /api/push/config`

Devuelve la clave pública VAPID y la zona de la casa. `publicKey` es `null` si
faltan claves en el servidor. No devuelve la clave privada.

```json
{
  "publicKey": "B...",
  "houseTimezone": "Europe/Madrid"
}
```

### `GET /api/push/subscriptions`

Lista las suscripciones del usuario actual sin exponer `endpoint` ni claves:

```json
{
  "subscriptions": [
    {
      "id": "sub_1",
      "userAgent": "Mozilla/5.0…",
      "active": true,
      "createdAt": "2026-10-26T10:00:00.000Z",
      "lastSuccessAt": null,
      "lastFailureAt": null
    }
  ]
}
```

### `POST /api/push/subscriptions`

Alta o actualización idempotente por `endpoint`. El cuerpo es el resultado de
`PushSubscription.toJSON()` del navegador. Devuelve `201` con `id` y `active`.
Valida que el endpoint sea HTTPS y que las claves estén presentes.

### `DELETE /api/push/subscriptions/[id]`

Baja de una suscripción propia. Devuelve `204`; `404` si no existe o es de otro
usuario.

### `POST /api/push/test`

Envía una notificación de prueba solo a las suscripciones activas del usuario
actual. Devuelve `400` si no hay ninguna y `503` si falta configuración. No se
guarda como entrega de un evento.

### `GET /api/reminders/upcoming?limit=5`

Devuelve hasta 10 avisos futuros (5 por defecto) que corresponden al usuario:
eventos de los que es responsable y eventos de «Toda la casa». Cada elemento
incluye título, inicio, hora programada, responsable y URL de calendario.

### `POST /api/reminders/dispatch`

Ruta del cron. Exige `Authorization: Bearer <CRON_SECRET>` con comparación
timing-safe. Si falta el secreto en el servidor devuelve `503`; si el valor no
coincide, `401`. Respuesta:

```json
{
  "ok": true,
  "checkedEvents": 3,
  "eligibleDeliveries": 4,
  "sent": 3,
  "failed": 1,
  "skipped": 0,
  "deactivated": 0,
  "durationMs": 184
}
```

Los logs del dispatch solo incluyen contadores y nombres/códigos de error, nunca
títulos, endpoints ni claves.

## Gestión de suscripciones muertas

- Si el proveedor responde `404` o `410`, la suscripción se marca inactiva.
- Otros errores incrementan `failureCount` y actualizan `lastFailureAt`.
- Tras 5 fallos consecutivos, la suscripción se desactiva.
- Un envío correcto resetea el contador y actualiza `lastSuccessAt`.
- Al volver a activar los avisos en ese dispositivo, la suscripción se reactiva
  al sincronizarse.

## Seguridad y privacidad

- Las rutas de push y reminders se excluyen del middleware de redirección para
  devolver `401` JSON; cada handler aplica `requireUser`, salvo el dispatch, que
  exige el secreto del cron.
- La clave privada VAPID y `CRON_SECRET` solo existen en el servidor.
- El payload solo contiene título del evento, fecha/hora, responsable y URL. No
  se guardan títulos en logs ni en `ReminderDelivery`.
- El service worker no cachea APIs, HTML autenticado ni payloads. Solo
  precachea `/offline`.

## Límites actuales

- Un recordatorio por evento, sin recurrencias ni varios avisos.
- Sin email, SMS, Telegram ni notificaciones nativas fuera de la PWA.
- Sin centro de notificaciones persistente ni contador de no leídas.
- El cron es best-effort: puede haber pequeños retrasos.
- Recordatorios de notas TODO y otros módulos quedan para otra fase.

## Verificación

```bash
npm run lint && npm run typecheck && npm run test && npm run build
```

Tests relevantes:

- `tests/reminders.test.ts`: cálculo, zona horaria, DST, ventana, destinatarios
  y payload.
- `tests/push.test.ts`: VAPID, errores y clasificación.
- `tests/push-service.test.ts`: entrega, deduplicación y fallos.
- `tests/pwa-sw.test.ts`: `push`, `notificationclick`, URL segura y política de
  caché.
- `tests/api/push.schemas.test.ts`: validación Zod.
- `tests/middleware.test.ts`: exclusión de las rutas de push/reminders.

La verificación real de push debe hacerse en un build de producción o en la app
desplegada: en desarrollo el service worker no se registra.

### Verificación en producción (2026-10-26)

- Deployment `dpl_GLUPgBsHBLV6k7MXAP11mikGiVKr` (*Ready · Current*), health
  `200`; workflow `Recordatorios` activo cada 5 minutos.
- VAPID, `CRON_SECRET`, `HOUSE_TIMEZONE=Europe/Madrid` y la variable/secreto de
  GitHub configurados (valores solo en Vercel/GitHub y en el gestor de
  contraseñas).
- Suscripción FCM real en Chrome: `POST /api/push/test` →
  `{"ok":true,"sent":1,"failed":0,"deactivated":0}` y recepción en el service
  worker.
- Evento temporal con recordatorio: primera ejecución `sent:1`; segunda
  ejecución `skipped:1`. El mismo aviso no se duplicó.
- Suscripciones y eventos de prueba eliminados; `GET /api/push/subscriptions`
  quedó vacío y `upcoming` solo conserva el aviso real **Visitantes Casa**.

Si el navegador no muestra el aviso, comprueba que el permiso de notificaciones
sigue concedido para la app. Si el usuario lo revoca, Chrome puede desregistrar
la suscripción; el servidor la desactiva en el siguiente envío (`404`/`410`) y
el panel permite volver a activarla.
