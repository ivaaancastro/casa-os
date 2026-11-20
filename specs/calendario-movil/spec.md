# Spec — Fase 4: Calendario móvil + panel de avisos

**Estado:** aprobada el 2026-11-20
**Feature:** `calendario-movil`
**Depende de:** Fase 1 (`specs/fundacion-movil/spec.md`, shell y tab bar), Fase 2
(`specs/cuentas-movil/spec.md`, panel/portal y E2E), Fase 3
(`specs/notas-movil/spec.md`, vistas por breakpoint, FAB y auditoría), y de las
features cerradas `calendario` y `recordatorios` (push real ya en producción)

## Objetivo

Que `/calendario` se use en móvil con una mano: ver días y eventos como **chips
táctiles**, crear un evento con un **FAB**, editar en una **hoja inferior** que
respete la tab bar, y consultar/activar los **avisos push** desde la misma
pantalla. Se reutiliza toda la funcionalidad ya cerrada (mes/semana, CRUD con
permisos, `?date=`, VAPID, suscripciones, cron, service worker); solo se
rediseña la presentación móvil y se verifica el flujo.

> **Aclaración de alcance:** el roadmap pide «Web Push real». Eso **ya está
> entregado y verificado** en [`specs/recordatorios/cierre.md`](../recordatorios/cierre.md)
> (PR #26/#27/#28, suscripción real, `/api/push/test`, `sent:1` y `skipped:1`,
> deployments y variables configuradas). Esta fase no lo rehace: adapta su
> panel a móvil y documenta la verificación existente. No se inventa evidencia
> de una prueba en dispositivo que no se puede ejecutar aquí.

## Situación actual (lo que cambia)

| Hoy en móvil | Fase 4 |
|---|---|
| `useIsMobile()` local con 767 px; incoherente con el 1023 px del resto | Un solo breakpoint `< 1024px` (`lg:`), patrón de Notas |
| Rejilla de 42 celdas; eventos como puntos de `text-[10px]` | Celdas ≥ 44 px con chips de evento; agenda del día con chips grandes |
| Semana = 7 días apilados con «+ Añadir» de 10 px | Tarjetas de día táctiles con chips y botón «+» ≥ 44 px |
| Sin FAB; «Nuevo evento» entre otros controles de la toolbar | FAB cuadrado sobre la tab bar y zona segura |
| `EventPanel` y `ReminderPanel`: panel lateral con `p-6`, sin safe-area | Hoja inferior a ancho completo, campos apilados y acciones pegajosas |
| Botones de nav/vista de 40 px y `text-xs` | Objetivos ≥ 44 px y `aria-label`/`aria-pressed` |
| Sin E2E de calendario | E2E con login real, fixtures deterministas y auditoría visual |

El escritorio (`lg:`) conserva el layout actual: rejilla de mes, semana en
columnas, panel lateral de evento y agenda del día. Nada de lo siguiente lo
rompe.

## Requisitos funcionales

1. **RF1 — Breakpoint único y una sola vista.** `CalendarApp` usa el
   `useIsMobile()` de Notas (`max-width: 1023px`) y monta solo una de
   `CalendarMobileView` / `CalendarDesktopView`. Se elimina el hook local de
   767 px. Sin dos árboles de calendario simultáneos ni ids duplicados.
2. **RF2 — Mes táctil.** La rejilla de mes mantiene 42 celdas, lunes primero y
   el mismo `monthGrid`, pero en móvil cada celda mide ≥ 44 px y muestra hasta
   **2 chips de evento con título truncado** más un contador «+N más». Los
   eventos dejan de ser puntos minúsculos. La navegación temporal («Mes
   anterior/siguiente», «Hoy») y el título del mes se conservan con botones
   ≥ 44 px.
3. **RF3 — Agenda del día al tocar.** Tocar una celda en móvil selecciona el día
   y muestra su agenda debajo con chips de ≥ 44 px (hora o «Todo el día» +
   título). Tocar un chip abre el detalle del evento. En escritorio el tap
   sigue abriendo el formulario de alta, como hoy. Se conserva el deep link
   `?date=YYYY-MM-DD` (también desde los avisos).
4. **RF4 — Semana táctil.** La vista Semana en móvil muestra 7 tarjetas de día
   con sus eventos en chips y un botón «+» de ≥ 44 px que abre el alta para ese
   día; «Semana anterior/siguiente» y «Hoy» siguen funcionando.
5. **RF5 — Creación rápida.** Un FAB cuadrado (+) dentro de Calendario, sobre
   la tab bar y `env(safe-area-inset-bottom)`, abre el panel de alta del día
   seleccionado (o hoy). Reutiliza `EventPanel` y `POST /api/events`; no hay
   nueva ruta ni endpoint. La lista añade `padding-bottom` para que la última
   tarjeta no quede tapada.
6. **RF6 — Formulario táctil.** `EventPanel` se adapta a móvil como hoja
   inferior mediante el `createPortal` a `document.body` ya existente: ancho
   completo, `padding-bottom` con zona segura, campos en una columna, botones
   de acción pegajosos de ≥ 44 px y `aria-label` en cerrar. Se mantienen el
   orden de campos, el selector de «Quién», las opciones de recordatorio y la
   validación Zod (todo el día vs. con hora). Escritorio sin cambios.
7. **RF7 — Permisos intactos.** Cualquier usuario autenticado puede leer y
   crear; editar/borrar sigue limitado al creador o ADMIN (`canEditEvent`). La
   UI móvil no introduce atajos que sorteen esta regla y muestra el mismo
   mensaje de error/`403` que el escritorio.
8. **RF8 — Panel Avisos móvil.** Un botón «Avisos» visible en la toolbar móvil
   abre `ReminderPanel` con la misma hoja inferior: activar/desactivar
   suscripción, enviar prueba y lista de próximos recordatorios como enlaces
   `?date=`, con botones ≥ 44 px y estados anunciados (`role="status"` /
   `role="alert"`). La lógica de VAPID, suscripción, iOS sin PWA y «solo en
   producción» queda intacta.
9. **RF9 — Accesibilidad y estética.** Foco visible de 2 px, sin
   desbordamiento horizontal a 390 px, `prefers-reduced-motion` respetado,
   paleta cerrada (`canvas`, `ink`, `ash`, `mist`, `pearl`), radios 0, sin
   sombras decorativas; rojo `alarm` solo en error/eliminación. Jost 21 px en
   cabeceras móviles, Bodoni solo en `md:`/escritorio.
10. **RF10 — Sin cambios de datos ni API.** No se añaden modelos, migraciones,
    endpoints, campos ni dependencias. Los esquemas Zod de eventos y push, el
    modelo `Event`, `calendar.ts`, `reminders.ts`, el service worker y el cron
    quedan intactos.

## Requisitos no funcionales

- **Rendimiento**: el rango de eventos se sigue cargando con un fetch por
  periodo con `AbortController`; los chips se derivan del mismo array en
  cliente, sin peticiones por tap.
- **Compatibilidad**: los eventos existentes (todo el día, con hora, con
  responsable y recordatorio) se muestran y editan igual que hoy; el
  escritorio no se reescribe.
- **UX**: una mano, sin sombras, tab bar siempre accesible y FAB por encima de
  la zona segura.
- **Evidencia**: capturas reales con `design-audit`; el push real se remite a
  la verificación ya documentada en `specs/recordatorios/cierre.md`. Lo que no
  se pueda comprobar aquí se registra como follow-up, nunca como comprobado.

## API / Endpoints

Ninguno nuevo. Se reutilizan:

- `GET /api/events?from&to` (rango con solapamiento, ampliado ±1 día).
- `POST /api/events`, `PATCH /api/events/[id]`, `DELETE /api/events/[id]`.
- `GET /api/push/config`, `POST/DELETE /api/push/subscriptions`,
  `POST /api/push/test`, `GET /api/reminders/upcoming`.

## Modelo de datos

Ninguno. Sin migraciones ni cambios en `prisma/schema.prisma`.

## UI / UX

### Mes (entrada en móvil)

```
Calendario                              ← Jost 21 px
[ Mes | Semana ]       [Hoy] [Avisos]     ← una fila, ≥44 px
<       Noviembre 2026       >            ← flechas ≥44 px
 L   M   X   J   V   S   D
 27  28  29  30  31   1   2
  3   4 ● 5 ● 6   7   8   9
      ●Reunión                           ← chips con título truncado
      +2 más
...
                           [  +  ]        ← FAB
──────────────────────────────────────
Jueves, 5 de noviembre                   ← agenda del día seleccionado
 ● 09:00 Reunión de familia              ← chip ≥44 px → detalle
 ● Todo el día · Pagar luz
```

### Evento / Avisos (hoja inferior)

```
┌───────────────────────────────┐
│  Nuevo evento            [×]  │  ← portal a body, ≥44 px
│  Título                       │
│  Quién          [Toda la casa]│
│  Fecha        [2026-11-05]    │
│  Inicio / Fin [09:00][10:00]  │  ← una columna en móvil
│  Recordatorio [30 min]        │
│  Descripción                  │
│  [ Crear evento ]  [Cancelar] │  ← pegajosas, ≥44 px
└───────────────────────────────┘  + safe-area-inset-bottom
```

## Criterios de aceptación

- [x] Entrar en `/calendario` a 390 px muestra la vista Mes con chips táctiles,
      no la rejilla de puntos actual (E2E + captura).
- [x] El breakpoint unificado es `< 1024px` y solo se monta una vista; en
      768–1023 px tocar un día selecciona la agenda (revisión de código + E2E).
- [x] Tocar un día abre su agenda con chips ≥ 44 px; tocar un chip abre el
      detalle; en escritorio el tap sigue abriendo el alta (E2E + captura).
- [x] La vista Semana en móvil muestra tarjetas de día con chips y botón «+»
      ≥ 44 px, y la navegación temporal funciona (E2E + captura).
- [x] El FAB crea un evento y abre la hoja inferior; el evento aparece en la
      rejilla/agenda tras guardar (E2E + captura).
- [x] La hoja de evento respeta la tab bar y la zona segura; los campos siguen
      validando todo el día vs. con hora (E2E + captura).
- [x] FAMILY puede crear pero no editar ajenos; ADMIN sí (revisión + E2E según
      rol disponible en fixtures).
- [x] El panel Avisos se abre desde la toolbar móvil y muestra sus estados con
      botones ≥ 44 px, sin tocar VAPID/cron; el envío real se remite a la
      evidencia de `specs/recordatorios/cierre.md` (E2E de estados + captura).
- [x] El deep link `/calendario?date=YYYY-MM-DD` selecciona el día a 390 px
      (E2E).
- [x] Sin desbordamiento horizontal a 390 px, sin errores en consola y con
      foco visible en los controles nuevos (Chrome MCP / auditoría).
- [x] No hay cambios en BD, migraciones, schemas, auth ni API (revisión de diff).
- [x] `npm run lint && npm run typecheck && npm run test && npm run build` pasan.
- [x] E2E y auditoría `design-audit` con capturas a 390×844 documentados.
- [x] CI del PR en verde, squash merge y cierre documental completado.

## Decisiones aprobadas (2026-11-20)

El usuario aprobó la spec con la **opción A en las seis decisiones**. Se recogen
aquí con su resultado para trazabilidad.

### 1. Vista Mes en móvil → **A: rejilla con chips + agenda del día** (aprobada)

- **A (aprobada)**: se conserva la rejilla de 42 celdas con celdas ≥ 44 px y
  hasta 2 chips de evento por día; tocar un día muestra su agenda con chips
  grandes. Cumple «eventos como chips, no rejilla pequeña» sin perder la
  orientación mensual ni reescribir `calendar.ts`.
- **B**: sustituir la rejilla por una lista vertical de días con sus eventos
  (tipo agenda continua). Más cercana a una app nativa, pero se pierde la vista
  de mes y es un cambio mucho mayor.

### 2. Creación de eventos → **A: FAB dentro de Calendario** (aprobada)

- **A (aprobada)**: botón flotante (+) sobre la tab bar, como en Notas. No
  toca la navegación global de Fase 1 y queda al alcance del pulgar.
- **B**: dejar solo el botón «Nuevo evento» en la toolbar. Menos cambio, pero
  sigue exigiendo buscarlo entre los controles.

### 3. Formulario y paneles → **A: hoja inferior reutilizando los paneles** (aprobada)

- **A (aprobada)**: adaptar `EventPanel` y `ReminderPanel` con el
  `createPortal` actual a una hoja inferior con safe-area. Conserva validación,
  portal y permisos; solo cambia el estilo móvil.
- **B**: crear rutas nuevas (`/calendario/nuevo`, `/calendario/avisos`) a pantalla
  completa. Más espacio, pero añade rutas, estado de vuelta y duplica lógica ya
  cerrada.

### 4. Panel Avisos → **A: botón «Avisos» en la toolbar** (aprobada)

- **A (aprobada)**: el panel se abre desde la propia toolbar del calendario,
  al lado de «Hoy». Coherente con el deep link `?date=` de los recordatorios.
- **B**: mover los avisos al Perfil (donde está el menú «Más»). Menos control en
  esta pantalla, pero rompe la relación entre recordatorio y calendario y
  afecta a una sección ya cerrada.

### 5. Breakpoint → **A: unificar todo a 1023 px (`lg:`)** (aprobada)

- **A (aprobada)**: usar el mismo `useIsMobile()` que Notas y el shell.
  Corrige la franja 768–1023 px donde el calendario se comportaba como
  escritorio mientras el resto de la app ya era móvil.
- **B**: mantener el hook de 767 px del calendario. Evita tocar el rango, pero
  deja la incoherencia y el tap incorrecto en tablet.

### 6. Web Push real → **A: no tocar infraestructura; verificar y documentar** (aprobada)

- **A (aprobada)**: reutilizar VAPID, suscripciones, cron y service worker
  tal cual; verificar los estados del panel con build de producción y remitir
  a la prueba real ya documentada en `specs/recordatorios/cierre.md`. La prueba
  en dispositivo queda como follow-up honesto.
- **B**: reauditar o rehacer el envío push (nuevas keys, cron o service worker).
  Duplica una feature cerrada y verificada en producción; se descarta salvo
  que aparezca un fallo concreto.

## Supuestos

- «Móvil» = viewport `< 1024px` (`lg:` de Tailwind), igual que en Fases 1-3. No
  se distingue entre tablet y teléfono.
- La autenticación y roles no cambian: ADMIN y FAMILY leen y crean eventos;
  editar/borrar sigue siendo solo creador o ADMIN.
- No hay dispositivo iOS/Android ni permisos de notificación reales en el
  entorno del agente; la verificación es en Chromium a 390×844 y el push real
  se documenta con la evidencia existente de producción.
- El service worker solo se registra en producción: en local se comprueban los
  estados del panel con `next build && next start`, no el envío de una
  notificación al sistema operativo.
- El contenido y la semántica de `calendar.ts`, `reminders.ts`, `EventPanel`,
  `ReminderPanel` y las rutas API se conservan; se cambia su presentación
  móvil y el punto de entrada del FAB.
