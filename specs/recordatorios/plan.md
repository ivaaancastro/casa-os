# Plan — Recordatorios

**Feature:** `recordatorios`
**Rama:** `feat/recordatorios`
**Hito:** 3 — Organización del hogar
**Depende de:** calendario (`feat/calendario`, cerrada), PWA (`feat/pwa-instalable`,
cerrada) y auth (`feat/usuarios-roles`, cerrada).

> **Estado de implementación (2026-10-26):** código, tests, build y UI local
> completados. Queda configurar Vercel/GitHub, desplegar y verificar un aviso
> real antes del cierre.

## Contexto

El calendario ya guarda `Event.reminderMinutes`, pero no envía ningún aviso: la
guía `docs/calendario.md` lo deja claro y el roadmap reserva esa parte para esta
feature. El objetivo es que un recordatorio configurado en un evento llegue al
navegador o al móvil, incluso con la app cerrada, y que el usuario pueda
gestionar sus dispositivos desde la propia app.

La app ya es una PWA instalable, tiene un service worker mínimo en `public/sw.js`
y guarda los eventos en PostgreSQL. No hay que rehacer el calendario: se reutiliza
su modelo, sus permisos y sus utilidades de fechas.

## Alcance de esta primera fase

Incluido:

- Web Push para navegadores compatibles y PWA instalada.
- Alta, baja y prueba de suscripciones por dispositivo.
- Avisos de eventos con recordatorio, con destinatario según «Quién».
- Programación de envíos cada 5 minutos mediante un cron externo a Vercel.
- Panel **Avisos** dentro del calendario con estado, prueba y próximos avisos.
- Enlace profundo desde la notificación al día del evento.

Fuera de alcance:

- Email, SMS, Telegram, WhatsApp u otros canales.
- Recordatorios de notas TODO o de otros módulos.
- Recurrencias de eventos, eventos de varios días y recordatorios múltiples por
  evento.
- Sincronización con Google Calendar/ICS.
- Historial de notificaciones leídas o centro de notificaciones persistente.
- Envío en tiempo real con WebSockets; el cron es best-effort cada 5 minutos.

## Enfoque técnico

### 1. Modelo de datos

Dos modelos nuevos, ambos con migración aditiva:

- `PushSubscription`: una suscripción de navegador/dispositivo por usuario.
  Guarda `endpoint` (único), claves `p256dh`/`auth`, `userAgent`, estado
  `active`, contador de fallos y últimas fechas de éxito/fallo. No guarda
  secretos de sesión ni datos del evento.
- `ReminderDelivery`: registro de deduplicación y diagnóstico. Clave única
  `[eventId, subscriptionId, scheduledFor]`, estado `SENT`/`FAILED`, intentos y
  error truncado.

En `User` se añade `pushSubscriptions`; en `Event`, `reminderDeliveries`. Las
relaciones usan `onDelete: Cascade` para no dejar filas huérfanas cuando se
borra un evento, un miembro o una suscripción.

### 2. Cálculo del momento del aviso

Se crea `src/lib/reminders.ts` con funciones puras y testeables:

- **Evento con hora:** `scheduledFor = start - reminderMinutes`.
- **Evento de todo el día:** se usa la zona horaria de la casa
  (`HOUSE_TIMEZONE`, por defecto `Europe/Madrid`) y una hora local fija de
  **09:00**. Ejemplos:
  - «A la hora» → 09:00 del día del evento.
  - «10 min antes» → 08:50 del día del evento.
  - «1 día antes» → 09:00 del día anterior.
- La hora local se convierte a UTC con `Intl.DateTimeFormat` y un helper
  `zonedDateTimeToUtc`; se testean cambios de hora (DST) y días de 23/25 horas.
- Ventana de envío: un aviso se envía si `scheduledFor` está entre `now - 15 min`
  y `now`. El cron corre cada 5 minutos; la ventana absorbe pequeños retrasos.
  Si el cron llega más tarde, el aviso se omite (no se envía una notificación
  muy tardía).
- Editar un evento recalcula su `scheduledFor`; borrarlo elimina sus entregas.
  Un recordatorio creado después de su hora no se envía hacia atrás.

### 3. Destinatarios

- Si el evento tiene `ownerId`, solo recibe el aviso ese miembro activo.
- Si `ownerId` es `null` («Toda la casa»), reciben el aviso todos los miembros
  activos que tengan al menos una suscripción activa.
- Un miembro inactivo no recibe avisos aunque conserve filas históricas. No se
  notifica al creador por el simple hecho de crear el evento.

Esta regla es coherente con el significado de «Quién» que ya usa el calendario:
es un responsable, no una invitación.

### 4. Envío Web Push

Se añade la dependencia `web-push` (y `@types/web-push` en desarrollo) porque
implementar VAPID y el cifrado del payload a mano sería frágil y más difícil de
auditar. Es una librería Node.js estándar, sin binarios nativos, compatible con
el runtime Node de Vercel.

- `src/lib/push.ts` configura VAPID y centraliza `sendNotification`.
- Variables:
  - `NEXT_PUBLIC_VAPID_PUBLIC_KEY` (pública, puede llegar al cliente).
  - `VAPID_PRIVATE_KEY` (solo servidor).
  - `VAPID_SUBJECT` (`mailto:` de contacto).
  - `CRON_SECRET` (secreto compartido con el scheduler).
  - `HOUSE_TIMEZONE` (por defecto `Europe/Madrid`).
- La clave privada nunca se registra en logs ni se devuelve por API.
- Si el proveedor responde `404`/`410`, la suscripción se marca inactiva. Otros
  errores incrementan el contador; tras 5 fallos consecutivos se desactiva.
- El envío de un aviso no bloquea al resto: se procesan las suscripciones de
  forma secuencial y se recogen los errores.

### 5. API

Todas las rutas de usuario usan `requireUser` y validación Zod. La ruta de cron
queda fuera del middleware de NextAuth y se protege con `CRON_SECRET` comparado
con `crypto.timingSafeEqual`.

- `GET /api/push/config` → clave pública y zona horaria; `null` si falta configurar.
- `GET /api/push/subscriptions` → suscripciones del usuario, sin claves.
- `POST /api/push/subscriptions` → alta/actualización idempotente por `endpoint`.
- `DELETE /api/push/subscriptions/[id]` → baja de una suscripción propia.
- `POST /api/push/test` → aviso de prueba a los dispositivos del usuario.
- `GET /api/reminders/upcoming?limit=5` → próximos avisos que le corresponden.
- `POST /api/reminders/dispatch` → procesa la ventana y envía; solo cron.

### 6. Programación (decisión recomendada)

Vercel Hobby solo permite cron **una vez al día**, así que no sirve para avisos
de 10 minutos o 1 hora. La opción recomendada es un workflow de **GitHub
Actions** cada 5 minutos que llame por HTTPS a `/api/reminders/dispatch` con el
secreto. No requiere cambiar de plan ni contratar otro servicio.

- `.github/workflows/recordatorios.yml` con `schedule: '*/5 * * * *'` y
  `workflow_dispatch` para pruebas manuales.
- El workflow usa un *repository variable* `CASA_OS_URL` y un *repository
  secret* `CRON_SECRET`; nunca escribe el secreto en logs.
- `concurrency` evita dos ejecuciones solapadas.
- Si el proyecto de Vercel es Pro, se puede sustituir por Vercel Cron con
  `vercel.json` cada 5 minutos; no se añadirá por defecto porque en Hobby el
  deploy falla.
- Limitación conocida: GitHub Actions puede retrasar ejecuciones y desactiva
  workflows programados tras 60 días sin actividad del repositorio. Se
  documentará y se podrá relanzar manualmente.

### 7. Service worker y notificaciones

Se amplía `public/sw.js`:

- `push`: muestra una notificación con título, cuerpo, icono y `data.url`.
- `notificationclick`: cierra la notificación, enfoca una pestaña existente y
  navega a `/calendario?date=YYYY-MM-DD`, o abre una nueva.
- La URL se valida contra el origen de la app; un payload externo no puede abrir
  otra web.
- No se cachean payloads, APIs ni HTML autenticado. Se sube `CACHE_VERSION` a
  `v2` para limpiar la caché anterior.
- Si el navegador rota una suscripción, la app la vuelve a sincronizar al abrir
  el panel de avisos.

### 8. Interfaz

- Botón **Avisos** en la barra del calendario, junto a **Nuevo evento**.
- Panel lateral con:
  - Estado de este dispositivo: activo, sin permiso, denegado, no compatible.
  - Botón **Activar avisos en este dispositivo**.
  - Botón **Enviar prueba**.
  - Botón **Desactivar en este dispositivo**.
  - Instrucciones para iOS: instalar la PWA y abrirla desde la pantalla de inicio.
  - Lista **Próximos avisos** (hasta 5) con fecha, hora y evento.
- La lista de próximos avisos es la parte «in-app»: no hay centro de
  notificaciones persistente ni campana con contador de no leídos en esta fase.
- Al abrir `/calendario?date=...`, el calendario se posiciona en ese día y abre
  su agenda. Así el clic en la notificación lleva al contexto correcto.
- Estados de carga, vacío, error y permiso denegado visibles y accesibles.

### 9. Seguridad y privacidad

- La clave privada VAPID y `CRON_SECRET` solo viven en variables de entorno del
  servidor.
- La API de suscripciones no devuelve `endpoint` completo en listados ni las
  claves; solo el `id`, `userAgent`, fechas y estado.
- El endpoint de cron no acepta sesión de usuario como sustituto del secreto.
- Los logs del cron solo contienen contadores, nunca títulos de eventos,
  endpoints ni claves.
- No se añaden datos personales al payload más allá del título del evento y el
  nombre del responsable.

## Cambios previstos

| Área | Archivo | Cambio |
|---|---|---|
| Datos | `prisma/schema.prisma` + migración `add_push_reminders` | `PushSubscription`, `ReminderDelivery` y relaciones |
| Lógica | `src/lib/reminders.ts` (nuevo) | Cálculo de `scheduledFor`, zona horaria, ventana y payload |
| Lógica | `src/lib/push.ts` (nuevo) | VAPID, envío y clasificación de errores |
| Validación | `src/lib/schemas/push.ts` (nuevo) | Zod para suscripciones y prueba |
| API | `src/app/api/push/*`, `src/app/api/reminders/*` | Config, suscripciones, prueba, próximos y dispatch |
| Middleware | `src/middleware.ts` | Excluir las rutas de push/reminders para devolver JSON y permitir el cron |
| PWA | `public/sw.js` | `push`, `notificationclick`, URL segura y versión de caché |
| UI | `src/components/calendar/ReminderPanel.tsx` (nuevo) | Panel de avisos y próximos recordatorios |
| UI | `src/components/calendar/CalendarApp.tsx` | Botón Avisos y enlace profundo `?date=` |
| Scheduler | `.github/workflows/recordatorios.yml` (nuevo) | Cron cada 5 minutos y ejecución manual |
| Config | `.env.example`, `package.json` | Variables VAPID/cron/zona y dependencia `web-push` |
| Tests | `tests/reminders.test.ts`, `tests/pwa-sw.test.ts`, `tests/api/push.schemas.test.ts` | Zona horaria, ventana, payload, SW y Zod |
| Docs | `README.md`, `docs/recordatorios.md`, `docs/calendario.md`, `docs/pwa.md`, `CHANGELOG.md`, `MEMORY.md`, `docs/roadmap.md` | Uso, configuración, límites y cierre |

## Decisiones de diseño

- **Un recordatorio por evento**, el que ya existe en el calendario. No se
  añaden múltiples avisos ni recurrencias.
- **Hora local de la casa para todo el día**: 09:00 en `HOUSE_TIMEZONE`. Evita
  avisos a medianoche UTC y no obliga a guardar una zona horaria por usuario.
- **Ventana de 15 minutos**: prioriza puntualidad sobre recuperar avisos muy
  antiguos. El cron cada 5 minutos deja margen suficiente para retrasos normales.
- **Deduplicación en base de datos**: la clave única por evento, suscripción y
  hora programada evita duplicados si el cron se ejecuta dos veces.
- **Suscripción por dispositivo**: un usuario puede tener móvil y portátil; el
  panel solo gestiona el dispositivo actual.
- **GitHub Actions como scheduler inicial**: no cambia el plan de Vercel y es
  suficiente para un hogar. Se documenta cómo migrar a Vercel Cron si hay Pro.
- **Sin centro de notificaciones**: la parte in-app es el panel de avisos y el
  enlace al día del evento. Un historial de leídas queda para otra fase.

## Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Vercel Hobby no permite cron cada 5 min | GitHub Actions externo; `vercel.json` solo si hay Pro |
| Retraso del cron de GitHub Actions | Ventana de 15 min, `workflow_dispatch` y monitorización de ejecuciones |
| Duplicados por reintentos o ejecuciones solapadas | Clave única `[eventId, subscriptionId, scheduledFor]` y `concurrency` en el workflow |
| Avisos de todo el día a una hora incómoda | 09:00 en `HOUSE_TIMEZONE`, no medianoche UTC |
| Suscripciones muertas acumuladas | Desactivar en `404`/`410`; 5 fallos consecutivos desactivan |
| iOS no recibe push fuera de la PWA instalada | Instrucciones explícitas en el panel y docs |
| Fuga de claves VAPID o del cron | Variables de entorno, sin logs, comparación timing-safe |
| Ruido en los logs con datos del evento | Solo contadores; nunca títulos, endpoints ni claves |
| El service worker cachea datos privados | Se mantiene la política actual: solo `/offline`; tests que lo verifican |

## Verificación prevista

- Tests unitarios de:
  - `scheduledFor` con hora y todo el día.
  - Conversión de zona horaria y DST.
  - Ventana de envío y deduplicación.
  - Destinatarios por `ownerId` y miembros activos.
  - Payload de notificación y URL segura.
  - Esquemas Zod de suscripción.
- Tests del service worker: listeners `push`/`notificationclick`, payload
  inválido, URL externa y ausencia de `cache.put`.
- `npm run lint && npm run typecheck && npm run test && npm run build`.
- Chrome MCP:
  - Panel Avisos en escritorio y 390 px.
  - Permiso concedido/denegado y estados de error.
  - Enlace `?date=` posiciona el calendario.
  - Consola limpia y sin overflow.
- Producción:
  - Variables VAPID y `CRON_SECRET` configuradas en Vercel.
  - Workflow de GitHub Actions con `CASA_OS_URL` y secreto.
  - Suscripción real en un navegador de escritorio y, si es posible, PWA iOS.
  - Aviso de prueba recibido.
  - Evento con recordatorio a 5–10 minutos recibido una sola vez.
  - Ejecución manual del workflow y comprobación de contadores.
  - Desactivar el dispositivo y verificar que no llega.

## Aprobación necesaria

Antes de crear `tasks.md` e implementar, el usuario debe aprobar:

1. El alcance de esta fase: Web Push + panel in-app, sin email.
2. La dependencia `web-push@3.6.7` y `@types/web-push@3.6.4`.
3. El scheduler con GitHub Actions cada 5 minutos (o indicar que tiene Vercel
   Pro y prefiere Vercel Cron).
4. La regla de destinatarios: responsable si existe; toda la casa si no.
5. La hora de 09:00 para eventos de todo el día en `Europe/Madrid`.
