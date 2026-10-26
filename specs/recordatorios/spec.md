# Spec — Recordatorios

**Feature:** `recordatorios`
**Estado:** aprobado — implementado, pendiente de verificación en producción
**Fecha:** 2026-10-26
**Hito:** 3 — Organización del hogar

## Objetivo

Convertir el recordatorio que ya se guarda en cada evento del calendario en un
aviso real en el navegador o en el móvil, incluso con la app cerrada. El usuario
podrá activar los avisos en cada dispositivo, probarlos y consultar desde el
calendario los próximos recordatorios que le corresponden.

Esta fase cubre **Web Push + panel in-app**. El email y otros canales quedan
fuera.

## Decisiones propuestas para aprobar

1. **Canal**: Web Push del navegador/PWA. Sin email.
2. **Dependencia**: `web-push@3.6.7` y `@types/web-push@3.6.4`.
3. **Scheduler**: GitHub Actions cada 5 minutos (gratis, sin cambiar el plan de
   Vercel). Si el proyecto es Vercel Pro, se puede usar Vercel Cron.
4. **Destinatarios**: si el evento tiene «Quién», solo esa persona; si es «Toda
   la casa», todos los miembros activos con avisos activos.
5. **Todo el día**: el aviso se envía a las **09:00** de `HOUSE_TIMEZONE`
   (`Europe/Madrid` por defecto), no a medianoche UTC.
6. **In-app**: panel **Avisos** en el calendario, con estado del dispositivo,
   prueba y lista de próximos avisos. Sin centro de notificaciones leídas.

## Requisitos funcionales

### RF-1 — Activar avisos en un dispositivo

- Cualquier miembro autenticado puede activar los avisos en el navegador actual.
- El panel **Avisos** del calendario muestra el estado:
  - **No compatible**: el navegador no tiene `PushManager`/`Notification`.
  - **Sin permiso**: se puede pedir permiso.
  - **Denegado**: se explica cómo desbloquearlo en el navegador.
  - **Activo**: hay una suscripción de este dispositivo registrada.
  - **Sin configurar**: faltan las claves VAPID en el servidor.
- Al activar:
  1. Se pide permiso de notificaciones.
  2. Se obtiene una suscripción `PushSubscription` del service worker.
  3. Se envía al servidor y se asocia al usuario de la sesión.
- Un usuario puede tener varias suscripciones (móvil, portátil, etc.).
- **Desactivar en este dispositivo** cancela la suscripción del navegador y
  elimina su registro en el servidor.
- Si el navegador ya tenía una suscripción, al abrir el panel se sincroniza con
  el servidor para que no se pierda tras un cambio de claves o un redespliegue.
- En iOS/iPadOS se muestra la instrucción de instalar la PWA y abrirla desde la
  pantalla de inicio; Safari no entrega push a una pestaña normal.

### RF-2 — Enviar aviso de prueba

- El panel incluye **Enviar prueba** cuando el dispositivo está activo.
- La prueba se envía solo a las suscripciones del usuario actual.
- Si no hay ninguna suscripción, la API devuelve `400` y el panel lo explica.
- La notificación de prueba no se guarda como entrega de un evento.

### RF-3 — Programar recordatorios de eventos con hora

- Para un evento con `reminderMinutes = r`, el aviso se programa en
  `start - r minutos`.
- Valores admitidos: `0`, `10`, `30`, `60`, `1440` (los mismos del calendario).
- Un evento sin recordatorio (`null`) no genera avisos.
- Un evento cuyo aviso quedó fuera de la ventana de 15 minutos no se envía
  retroactivamente.
- Si se edita la fecha, la hora o el recordatorio, se usa el nuevo cálculo.
- Si se borra el evento, se borran sus entregas y no se vuelve a enviar.

### RF-4 — Programar recordatorios de eventos de todo el día

- La fecha del evento es la clave `YYYY-MM-DD` de `event.start`.
- El aviso se calcula tomando las **09:00** de `HOUSE_TIMEZONE` en esa fecha y
  restando `reminderMinutes`.
- Ejemplos con `Europe/Madrid`:
  - `0` → 09:00 del día del evento.
  - `10` → 08:50 del día del evento.
  - `60` → 08:00 del día del evento.
  - `1440` → 09:00 del día anterior.
- La conversión debe respetar el horario de verano/invierno.
- Si `HOUSE_TIMEZONE` no es válida, el dispatch falla con un error de
  configuración y no envía nada.

### RF-5 — Destinatarios

- **Evento con responsable (`ownerId`)**: solo recibe ese miembro, siempre que
  esté activo y tenga suscripciones activas.
- **Evento de toda la casa (`ownerId = null`)**: reciben todos los miembros
  activos con suscripciones activas.
- Un miembro inactivo no recibe avisos aunque conserve suscripciones históricas.
- El creador no recibe el aviso por defecto si el evento tiene otro responsable.
- Cada suscripción recibe como máximo **un aviso por evento y hora programada**.

### RF-6 — Dispatch fiable e idempotente

- Un scheduler llama cada 5 minutos a `POST /api/reminders/dispatch`.
- La ruta exige `Authorization: Bearer <CRON_SECRET>`; sin secreto o con uno
  incorrecto devuelve `401`.
- Se procesan los avisos con `scheduledFor` en la ventana
  `[now - 15 min, now]`.
- La clave única `[eventId, subscriptionId, scheduledFor]` evita duplicados si
  el cron se ejecuta dos veces o se reintenta.
- Un fallo de una suscripción no impide enviar al resto.
- Respuesta sin datos sensibles:

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

- Si falta `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`
  o `CRON_SECRET`, el endpoint devuelve `503` y no envía nada.
  `GET /api/health` no cambia.
- Los logs solo incluyen contadores y códigos de error, nunca títulos,
  endpoints ni claves.

### RF-7 — Gestión de suscripciones muertas

- Si el proveedor de push responde `404` o `410`, la suscripción se marca
  `active = false` y no se vuelve a usar.
- Otros errores incrementan `failureCount` y actualizan `lastFailureAt`.
- Tras 5 fallos consecutivos, la suscripción se desactiva.
- Un envío correcto resetea `failureCount` y actualiza `lastSuccessAt`.
- El usuario puede volver a activar los avisos en ese dispositivo; la
  suscripción se reactiva al sincronizarla de nuevo.

### RF-8 — Contenido y clic de la notificación

- Título: `Recordatorio · <título del evento>`.
- Cuerpo:
  - Evento con hora: `<día> a las <hora>` y, si hay responsable,
    `Para <nombre>`.
  - Evento de todo el día: `Todo el día · <fecha>`.
- La hora se muestra en `HOUSE_TIMEZONE` para que coincida con el calendario
  familiar.
- La notificación incluye un `tag` estable por evento para que el sistema no
  acumule duplicados del mismo aviso.
- Al pulsar:
  - Se cierra la notificación.
  - Se enfoca una pestaña existente de casa·os o se abre una nueva.
  - Se navega a `/calendario?date=YYYY-MM-DD`.
  - El calendario se posiciona en ese día y muestra su agenda.
- La URL solo puede ser del mismo origen; un payload con una URL externa se
  ignora y se usa `/calendario`.

### RF-9 — Panel in-app y próximos avisos

- El calendario muestra un botón **Avisos** junto a **Nuevo evento**.
- El panel incluye:
  - Estado del dispositivo y acciones de activar/desactivar/probar.
  - Explicación breve de quién recibe los avisos.
  - Lista **Próximos avisos** con hasta 5 recordatorios que corresponden al
    usuario actual.
- Cada elemento muestra el evento, la fecha/hora programada y el destinatario.
- Si no hay recordatorios, muestra un estado vacío claro.
- La lista se actualiza al abrir el panel y después de una acción.
- No hay contador de no leídos, historial ni marcar como leído en esta fase.

### RF-10 — Enlace profundo al calendario

- `/calendario?date=YYYY-MM-DD` abre el calendario en ese día.
- Si la fecha no es válida, se ignora y se abre el día actual.
- La URL no cambia el mes ni la vista de forma destructiva; solo posiciona.
- En móvil, el día queda seleccionado y su agenda visible.
- En escritorio, el día queda seleccionado y su agenda visible.

## Requisitos no funcionales

- **Seguridad**:
  - Todas las rutas de usuario exigen sesión.
  - El cron exige `CRON_SECRET` con comparación timing-safe.
  - Validación Zod de todas las entradas.
  - Las claves VAPID privadas y el secreto del cron no se exponen al cliente,
    a logs, a la documentación ni a los tests.
  - Las rutas de push/reminders se excluyen del middleware de redirección para
    devolver `401` JSON; las de usuario siguen protegidas con `requireUser`.
- **Privacidad**:
  - El payload solo contiene título del evento, día/hora, responsable y URL.
  - No se guardan títulos en logs ni en la tabla de entregas.
- **Rendimiento**:
  - El dispatch consulta un rango pequeño (eventos de las últimas 48 h y las
    próximas 48 h) y usa índices por `start` y por `scheduledFor`.
  - El envío es secuencial para no saturar al proveedor.
  - El panel carga como máximo 5 próximos avisos.
- **Compatibilidad**:
  - Chrome/Edge/Firefox en escritorio y Android.
  - Safari/iOS 16.4+ con la PWA instalada en la pantalla de inicio.
  - Si el navegador no soporta push, la app sigue funcionando y muestra el
    estado «no compatible».
- **PWA**:
  - El service worker sigue sin cachear APIs, HTML autenticado ni payloads.
  - Se sube `CACHE_VERSION` para limpiar la caché anterior.
- **Accesibilidad**:
  - Panel con `role="dialog"`, `aria-modal`, foco inicial, Escape y cierre por
    fondo.
  - Botones con texto y `aria-label` cuando haga falta.
  - Estados de permiso y error con `role="status"`/`role="alert"`.
  - Diseño usable a 390 px sin scroll horizontal.

## API

Todas las respuestas de error usan `{ "error": "mensaje" }`. Las rutas de usuario
devuelven `401` sin sesión; la de cron devuelve `401` sin secreto válido.

### `GET /api/push/config`

- **Auth**: sesión válida.
- **Response 200**:

```json
{
  "publicKey": "B...",
  "houseTimezone": "Europe/Madrid"
}
```

- Si faltan claves en el servidor, `publicKey` es `null` y el panel muestra
  «avisos no configurados». No se devuelve la clave privada.
- `Cache-Control: no-store`.

### `GET /api/push/subscriptions`

- **Auth**: sesión válida.
- **Response 200**:

```json
{
  "subscriptions": [
    {
      "id": "sub_1",
      "userAgent": "Mozilla/5.0...",
      "active": true,
      "createdAt": "2026-10-26T10:00:00.000Z",
      "lastSuccessAt": "2026-10-26T10:05:00.000Z"
    }
  ]
}
```

- No devuelve `endpoint` ni las claves `p256dh`/`auth`.

### `POST /api/push/subscriptions`

- **Auth**: sesión válida.
- **Body**: el resultado de `PushSubscription.toJSON()`:

```json
{
  "endpoint": "https://fcm.googleapis.com/...",
  "expirationTime": null,
  "keys": {
    "p256dh": "B...",
    "auth": "A..."
  }
}
```

- Valida `endpoint` (URL HTTPS, máx. 1024 caracteres) y claves (máx. 255 y 64).
- Hace upsert por `endpoint`; si ya existía, actualiza claves, lo reasigna al
  usuario actual, lo reactiva y resetea fallos.
- **Response 201** con `{ "id": "sub_1", "active": true }`.
- **Errores**: `400` datos inválidos, `401` sin sesión.

### `DELETE /api/push/subscriptions/[id]`

- **Auth**: sesión válida; solo el propietario.
- **Response 204**.
- **Errores**: `401`, `404` si no existe o no es del usuario.

### `POST /api/push/test`

- **Auth**: sesión válida.
- **Response 200**:

```json
{
  "ok": true,
  "sent": 1,
  "failed": 0,
  "deactivated": 0
}
```

- **Errores**: `400` si no hay suscripciones activas; `503` si faltan claves
  VAPID.

### `GET /api/reminders/upcoming?limit=5`

- **Auth**: sesión válida.
- **Query**: `limit` opcional, entero 1–10; por defecto 5.
- **Response 200**:

```json
{
  "reminders": [
    {
      "eventId": "evt_1",
      "title": "Cena familiar",
      "allDay": false,
      "start": "2026-10-26T19:00:00.000Z",
      "scheduledFor": "2026-10-26T18:00:00.000Z",
      "owner": { "id": "usr_1", "name": "Iván" },
      "url": "/calendario?date=2026-10-26"
    }
  ]
}
```

- Incluye eventos con `reminderMinutes != null` que:
  - ya han pasado su `scheduledFor`? **No**: solo futuros.
  - tienen `ownerId = usuario actual` o `ownerId = null`.
  - están en un rango razonable (próximos 30 días).
- No incluye datos de otros miembros.

### `POST /api/reminders/dispatch`

- **Auth**: `Authorization: Bearer <CRON_SECRET>`; no usa sesión.
- **Runtime**: Node.js, dinámico, `Cache-Control: no-store`.
- **Response 200**: contadores (ver RF-6).
- **Errores**: `401` secreto inválido; `503` configuración incompleta; `500`
  error inesperado.
- **Idempotencia**: la clave única de `ReminderDelivery` evita repetir envíos.

## Modelo de datos

```prisma
model User {
  // ...
  pushSubscriptions PushSubscription[]
}

model Event {
  // ...
  reminderDeliveries ReminderDelivery[]
}

model PushSubscription {
  id             String   @id @default(cuid())
  userId         String
  user           User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  endpoint       String   @unique @db.VarChar(1024)
  p256dh         String   @db.VarChar(255)
  auth           String   @db.VarChar(64)
  userAgent      String?  @db.VarChar(512)
  active         Boolean  @default(true)
  failureCount   Int      @default(0)
  lastSuccessAt  DateTime?
  lastFailureAt  DateTime?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  deliveries     ReminderDelivery[]

  @@index([userId, active])
}

model ReminderDelivery {
  id             String   @id @default(cuid())
  eventId        String
  event          Event    @relation(fields: [eventId], references: [id], onDelete: Cascade)
  subscriptionId String
  subscription   PushSubscription @relation(fields: [subscriptionId], references: [id], onDelete: Cascade)
  scheduledFor   DateTime
  status         String   // SENT | FAILED
  attempts       Int      @default(1)
  error          String?  @db.VarChar(500)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  @@unique([eventId, subscriptionId, scheduledFor])
  @@index([scheduledFor])
  @@index([createdAt])
}
```

Reglas:

- `scheduledFor` se guarda en UTC.
- `status` solo admite `SENT` o `FAILED` (se valida en la lógica).
- `attempts` cuenta los intentos de esa clave; un fallo temporal puede
  reintentarse mientras esté dentro de la ventana y no supere 3 intentos.
- No se guarda el título ni el payload en la entrega.
- Migración `add_push_reminders`, aditiva: crea dos tablas y relaciones; no
  modifica columnas existentes.

## Scheduler y despliegue

### Opción recomendada: GitHub Actions

`.github/workflows/recordatorios.yml`:

- `schedule: '*/5 * * * *'` y `workflow_dispatch`.
- `concurrency` con grupo `recordatorios` y `cancel-in-progress: false`.
- Variable de repositorio `CASA_OS_URL` con la URL de producción.
- Secreto de repositorio `CRON_SECRET`.
- `curl --fail-with-body` contra `${CASA_OS_URL}/api/reminders/dispatch` con
  `Authorization: Bearer ${CRON_SECRET}`.
- Sin `set -x`; no se imprime el secreto.

Limitaciones documentadas:

- GitHub puede retrasar la ejecución unos minutos.
- Los workflows programados se desactivan tras 60 días sin actividad del repo;
  se relanzan manualmente o con un commit.
- No sustituye a un sistema de garantía estricta; es best-effort para un hogar.

### Alternativa: Vercel Cron (solo Pro)

Si el proyecto es Vercel Pro, se puede añadir `vercel.json`:

```json
{
  "crons": [
    { "path": "/api/reminders/dispatch", "schedule": "*/5 * * * *" }
  ]
}
```

Vercel Hobby rechaza expresiones sub-diarias; por eso **no** se incluye por
defecto.

### Variables de entorno

```bash
# Web Push (VAPID)
NEXT_PUBLIC_VAPID_PUBLIC_KEY="..."
VAPID_PRIVATE_KEY="..."
VAPID_SUBJECT="mailto:..."

# Scheduler
CRON_SECRET="..."

# Zona horaria de la casa para eventos de todo el día
HOUSE_TIMEZONE="Europe/Madrid"
```

- Las claves se generan con `npx web-push generate-vapid-keys` y se guardan en
  el gestor de contraseñas y en Vercel.
- `.env.example` solo lleva placeholders.
- No se documentan valores reales.

## UI / UX

### Botón y panel

```
[<] [Hoy] [>]  Octubre 2026     [Mes] [Semana]  [Avisos]  [+ Nuevo evento]
```

- **Avisos** es un botón secundario.
- El panel se abre lateralmente, como el panel de evento.
- Cabecera: `Casa · Calendario` / `Avisos`.
- Secciones:
  1. **Este dispositivo**: estado y botón principal.
  2. **Próximos avisos**: lista o estado vacío.
  3. **Cómo funciona**: responsable vs. toda la casa, 09:00 para todo el día.
- En iOS no instalado, un aviso informativo con los pasos de instalación.
- En permiso denegado, instrucciones para el navegador y sin botón de reintento
  infinito.

### Estados

| Estado | Mensaje principal | Acción |
|---|---|---|
| No compatible | «Este navegador no admite avisos.» | Ninguna |
| Sin configurar | «Los avisos no están configurados en el servidor.» | Ninguna |
| Sin permiso | «Activa los avisos para recibir recordatorios.» | Activar |
| Denegado | «El navegador bloqueó los avisos.» | Ver instrucciones |
| Activo | «Avisos activos en este dispositivo.» | Probar / Desactivar |
| Error | «No se pudieron cargar los avisos.» | Reintentar |

### Responsive y accesibilidad

- 390 px: el panel ocupa el ancho completo; la barra envuelve sin scroll
  horizontal.
- El botón **Avisos** y el cierre tienen `aria-label`.
- El panel usa `role="dialog"`, `aria-modal="true"`, foco inicial y Escape.
- La lista de próximos avisos es una lista semántica (`ul`/`li`).
- Los estados usan texto además de color.
- Respeta `prefers-reduced-motion`.

## Criterios de aceptación

- [ ] El panel **Avisos** aparece en el calendario y explica el estado del
      dispositivo.
- [ ] Un usuario puede activar avisos, recibir una prueba y desactivarlos.
- [ ] Un usuario puede tener varias suscripciones y solo gestiona la actual.
- [ ] Un evento con hora y recordatorio envía un aviso en la ventana prevista.
- [ ] Un evento de todo el día envía a las 09:00 de `HOUSE_TIMEZONE`.
- [ ] El cambio de hora (DST) no desplaza el aviso una hora.
- [ ] Si el evento tiene responsable, solo recibe ese miembro.
- [ ] Si es «Toda la casa», reciben todos los miembros activos suscritos.
- [ ] Un miembro inactivo no recibe avisos.
- [ ] El cron es idempotente: dos ejecuciones no duplican el aviso.
- [ ] Una suscripción con `410` se desactiva y no vuelve a usarse.
- [ ] El clic en la notificación abre `/calendario?date=...` en el día correcto.
- [ ] Una URL externa en el payload no se abre.
- [ ] El service worker no cachea APIs, HTML autenticado ni payloads.
- [ ] La API devuelve `401` sin sesión y `401` sin `CRON_SECRET`.
- [ ] El panel funciona a 390 px, sin overflow y con consola limpia.
- [ ] `npm run lint && npm run typecheck && npm run test && npm run build` pasa.
- [ ] La migración `add_push_reminders` se aplica en producción.
- [ ] El workflow de GitHub Actions ejecuta el dispatch cada 5 minutos y se
      puede lanzar a mano.
- [ ] La documentación (`README`, `docs/recordatorios.md`, `docs/calendario.md`,
      `docs/pwa.md`, `CHANGELOG`, `MEMORY`, roadmap) refleja la realidad.
- [ ] Producción verificada con un aviso real recibido una sola vez.

## Fuera de alcance

- Email, SMS, Telegram, WhatsApp y notificaciones nativas móviles fuera de la
  PWA.
- Recordatorios de notas TODO, dispositivos o gastos.
- Múltiples recordatorios por evento, recurrencias y eventos de varios días.
- Centro de notificaciones persistente, historial de leídas y badge de no
  leídos.
- Programación por usuario en otra zona horaria distinta de la casa.
- Sincronización con calendarios externos.
- Garantía de entrega exacta al minuto; el sistema es best-effort con ventana
  de 15 minutos.

## Aprobación

Para continuar con `tasks.md` e implementación, el usuario debe confirmar:

- [x] Alcance Web Push + panel in-app, sin email.
- [x] Dependencia `web-push` + `@types/web-push`.
- [x] Scheduler GitHub Actions cada 5 minutos (o indicar Vercel Pro).
- [x] Destinatarios según «Quién» / «Toda la casa».
- [x] 09:00 en `Europe/Madrid` para eventos de todo el día.
- [x] Panel **Avisos** en el calendario como ubicación de la configuración.

Aprobado por el usuario el 2026-10-26. Se mantiene la cuenta temporal
`admin-temporal` en la lista de limpieza: el usuario pidió desactivarla si sigue
activa en producción.
