# Plan — Fase 4: Calendario móvil + panel de avisos

## Contexto

El usuario quiere que `/calendario` se use con una mano en el móvil, como una
app de calendario nativa: ver los días y sus eventos con chips táctiles, crear
un evento de un toque, y consultar/activar los avisos push desde la misma
pantalla. Es el tercer pilar del roadmap móvil-first, después de la fundación
(Fase 1), Cuentas (Fase 2) y Notas (Fase 3).

**Punto de partida importante:** el *Web Push real* que pide el roadmap ya está
implementado, desplegado y verificado en producción en la feature
`recordatorios` (cerrada el 2026-10-26, PR #26/#27/#28;
[`specs/recordatorios/cierre.md`](../recordatorios/cierre.md)). Existen VAPID,
suscripciones persistentes, deduplicación en BD, deep links `?date=`,
`ReminderDelivery`, el service worker con `push`/`notificationclick` y un cron
de GitHub Actions cada 5 minutos. **Esta fase no rehace nada de eso**: adapta la
interfaz a móvil y verifica el flujo; documenta la infraestructura como ya
cerrada.

Hoy `/calendario` en móvil tiene estas fricciones:

- `CalendarApp` usa un `useIsMobile()` local con **`max-width: 767px`**, mientras
  el resto del proyecto (tab bar, Notas) usa **`1023px`** (`lg:`). Entre 768 y
  1023 px, `WeekView` ya cambia a columnas pero la lógica de tap sigue siendo
  de escritorio: tocar un día abre el formulario en vez de la agenda.
- La rejilla de mes son 42 celdas de `min-h-[74px]`; los eventos se reducen a
  puntos de `text-[10px]` (`md:hidden`) y no se pueden tocar con el pulgar. No
  hay FAB.
- La semana en móvil es una lista de 7 días apilados, con botones `+ Añadir` de
  `py-1 text-[10px]`.
- El toolbar mezcla navegación temporal, selector Mes/Semana y acciones en
  `flex-wrap`, con botones de 40 px y `text-xs`.
- `EventPanel` y `ReminderPanel` son `max-w-lg w-full` con `p-6`, sin
  `env(safe-area-inset-bottom)` y con botones pequeños. El panel de evento usa
  `createPortal` a `document.body` porque un ancestro con `transform` rompía
  `position: fixed` (lección de [`specs/calendario/cierre.md`](../calendario/cierre.md)):
  esa solución se conserva.
- No existe ningún E2E de calendario ni de avisos; el único contacto es el test
  de «sin overflow» de `navigation.spec.ts`.

La base funcional ya está cerrada y en producción: mes/semana, agenda del día,
CRUD con permisos por creador, recordatorio almacenado, panel Avisos y envío
push real. **Solo cambia la presentación y la interacción en móvil.**

## Enfoque técnico

### 1. Un solo breakpoint y una sola vista montada

`CalendarApp` sigue siendo el dueño del estado (`anchor`, `view`, `events`,
`panel`, `selectedDayKey`, `refreshKey`). Se sustituye su `useIsMobile()` local
de 767 px por el patrón ya aprobado en Notas
(`src/components/notes/useIsMobile.ts`: `matchMedia('(max-width: 1023px)')`,
valor inicial `false`, `useLayoutEffect` en cliente para evitar el flash,
cleanup del listener). Se extrae el marcado actual a `CalendarDesktopView` y se
crea `CalendarMobileView`; `CalendarApp` elige cuál montar, de modo que no haya
dos instancias compitiendo por el mismo estado ni pantallas duplicadas.

### 2. Mes y semana táctiles, con agenda del día

En móvil `/calendario` entra en la vista Mes:

```
Calendario                         ← Jost 21 px + «mes» en ash
[ Mes | Semana ]      [Hoy] [Avisos]  ← una fila, ≥44 px
<  Noviembre 2026  >                  ← flechas ≥44 px
L M X J V S D
[ 27 28 29 30 31  1  2 ]             ← celdas ≥44 px
[  3  4 ● 5 ● 6  7  8  9 ]            ← hasta 2 chips + «+N más»
...
                          [  +  ]     ← FAB sobre la tab bar
────────────────────────────────
Jueves, 5 de noviembre               ← agenda del día seleccionado
  ● 09:00 Reunión de familia         ← chip ≥44 px, abre detalle
  ● Todo el día: Pagar luz
```

- Los eventos dentro de la rejilla dejan de ser puntos: se muestran como
  **chips con el título truncado** (hasta 2 por celda y «+N más»). Tocar un día
  selecciona la fecha y muestra su **agenda con chips grandes**; tocar un chip
  abre el detalle. Este es el patrón que pide el roadmap («eventos como chips
  táctiles, no rejilla pequeña»).
- La vista Semana mantiene su lista vertical de 7 días, pero cada día pasa a ser
  una tarjeta táctil con chips de evento y un botón «+» de ≥44 px.
- Se conservan la navegación temporal (`Mes anterior/siguiente`, `Hoy`), el
  deep link `?date=YYYY-MM-DD` y el orden lunes primero de `calendar.ts`. No se
  añade librería de fechas: sigue siendo `Date` + `Intl`.

### 3. Formulario de evento táctil con FAB

- Un **FAB cuadrado (+)** sobre la tab bar y por encima de `safe-area` abre el
  panel de alta, reutilizando `EventPanel` sin nuevo endpoint ni ruta.
- `EventPanel` se adapta a móvil como **hoja inferior** (mismo `createPortal` a
  `body`): ancho completo, `padding-bottom` con `env(safe-area-inset-bottom)`,
  campos apilados en una columna y acciones pegajosas de ≥44 px. En escritorio
  conserva su panel lateral actual.
- Se mantienen el orden de campos (Título, Quién, Fecha, Inicio/Fin,
  Recordatorio, Descripción), la validación Zod y las reglas de rol: FAMILY crea
  y solo el creador o ADMIN edita/borra.

### 4. Panel Avisos móvil (push ya cerrado)

- `ReminderPanel` se adapta con la misma hoja inferior: botón «Avisos» visible
  en la toolbar móvil, botones «Activar avisos en este dispositivo», «Enviar
  prueba», «Desactivar» y «Cerrar» con ≥44 px, y la lista de próximos
  recordatorios como enlaces `?date=`.
- **No se tocan** VAPID, `PushSubscription`, `ReminderDelivery`, el cron, el
  service worker ni los estados iOS/producción. Se conservan los mensajes de
  «los avisos se activan en la versión publicada» y el bloqueo iOS sin PWA.
- Los estados del panel (sin permiso, sin VAPID, activo, prueba enviada) se
  verifican en local con `next build && next start` para que el service worker
  se registre; el envío real en dispositivo queda como follow-up, remitiendo a
  la evidencia ya documentada en `specs/recordatorios/cierre.md`.

### 5. Objetivos táctiles y pulido

- Reglas en `src/app/globals.css` (no styled-jsx: el DOM de los paneles se crea
  por portal): `.date-nav` y botones de vista/nav/evento a ≥44 px en móvil,
  botones de «+N más» y chips de agenda con altura cómoda.
- Se revisa a 390 px: sin desbordamiento horizontal, foco visible de 2 px,
  `role="status"`/`aria-live` para carga/guardado, `prefers-reduced-motion`
  respetado, paleta cerrada y rojo `alarm` solo en error/eliminación.
- La tab bar sigue visible; FAB y panel dejan hueco para ella y para la zona
  segura inferior.

### 6. Verificación

- Unitarias: se reutilizan `tests/calendar.test.ts` y `tests/reminders.test.ts`
  sin cambiar su semántica; solo se añaden tests si se extrae alguna función
  pura nueva (p. ej. `eventsForDayChip()` para limitar a 2 chips + contador).
- E2E nuevo `tests/e2e/calendario-movil.spec.ts` con login real (Pixel 7 /
  Chromium, `workers: 1`, `globalSetup` compartido, fixtures deterministas con
  id `e2e-*`): entrada a Mes en 390 px, navegación y cambio de vista,
  selección de día → agenda, alta de evento con el FAB, edición/borrado según
  rol, deep link `?date=`, apertura del panel Avisos y medición de objetivos
  ≥44 px + sin overflow. Limpieza de los eventos creados al final.
- Auditoría visual con la skill `design-audit` a 390×844 sobre el flujo
  completo (mes → día → agenda → formulario → avisos), con capturas guardadas.
- Sin cambios en `prisma/schema.prisma`, migraciones, esquemas Zod, API ni
  auth. Sin añadir dependencias.

## Decisiones aprobadas

Ver `spec.md` → *Decisiones aprobadas (2026-11-20)*. El usuario aprobó la opción
A en las seis: rejilla de mes con chips y agenda del día, FAB para crear, hoja
inferior para los paneles, Avisos en la toolbar, unificar el breakpoint a
1023 px y no tocar la infraestructura push ya cerrada.

## Dependencias

- [x] Fase 1 cerrada: shell, tab bar de 4 pestañas y cabeceras móviles.
- [x] Fase 2 cerrada: patrón de panel/portal y E2E con login real + 2FA.
- [x] Fase 3 cerrada: patrón de vistas por breakpoint, FAB y auditoría visual.
- [x] Calendario (`specs/calendario`) y Web Push (`specs/recordatorios`)
  cerrados, implementados y en producción.
- [x] `@playwright/test` y la skill `design-audit` disponibles.
- [ ] Aprobación de `specs/calendario-movil/spec.md` por el usuario.

## Riesgos

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| Partir `CalendarApp` en dos vistas rompa el estado compartido | Media | Alto | `CalendarApp` sigue siendo dueño único del estado y pasa `sharedProps`; un solo árbol montado, como en Notas |
| El portal de los paneles quede mal posicionado bajo la tab bar | Media | Medio | Conservar `createPortal` a `body`, añadir `safe-area-inset-bottom` y verificar con Chrome a 390 px |
| Tocar el breakpoint cambie el comportamiento en tablet (768–1023 px) | Alta | Medio | Unificar a 1023 px de forma explícita y cubrir el rango en E2E/auditoría; es la corrección buscada |
| Los chips de la rejilla de mes desborden 390 px | Media | Medio | Título truncado, máximo 2 chips + contador, `min-w-0` en la celda; revisar con capturas |
| Probar el push en local dé un estado engañoso | Alta | Medio | Registro del SW solo en producción: verificar estados con build de producción y remitir la prueba real de envío a la evidencia ya documentada |
| Cambiar el formulario rompa la validación de todo el día | Baja | Alto | Reutilizar `EventPanel` y `eventInputSchema` sin tocarlos; E2E de alta con y sin hora |
| El cron de GitHub Actions esté desactivado por inactividad | Media | Bajo | Follow-up ya documentado en `specs/recordatorios/cierre.md`; no es regression de esta fase |

## Fuera de alcance

- Cambios en `prisma/schema.prisma`, migraciones, esquemas Zod, API, auth ni
  navegación global.
- Rehacer VAPID, suscripciones, deduplicación, service worker, cron, cálculo de
  recordatorios ni deep links: todo eso está cerrado en `specs/recordatorios`.
- Recurrencias, invitaciones, importación ICS, zona horaria por usuario ni
  centro de notificaciones (siguen en el backlog).
- Reescribir `calendar.ts`, `reminders.ts` ni la lógica de permisos por creador.
- Verificación en dispositivo real iOS/Android: se deja como follow-up
  documentado, igual que en Fases 1-3.

## Verificación final

- `npm run lint && npm run typecheck && npm run test && npm run build`.
- `npm run test:e2e` con login real contra la BD local sembrada.
- Chrome MCP a 390×844 + informe con la skill `design-audit`.
- CI del PR en verde, squash merge y cierre documental (Paso 8 de `AGENTS.md`).
