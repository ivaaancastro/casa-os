# Spec — Fase 3: Notas móvil

**Estado:** aprobada el 2026-11-19
**Feature:** `notas-movil`
**Depende de:** Fase 1 (`specs/fundacion-movil/spec.md`, shell y tab bar) y Fase 2
(`specs/cuentas-movil/spec.md`, patrón de buscador fijo y E2E)

## Objetivo

Que `/notas` se use en móvil con una mano: **abrir y ver la lista**, crear una
nota de un toque, buscar y cambiar de carpeta sin menús, y editar con un toolbar
que quepa en pantalla y se pueda pulsar con el pulgar. Se reutiliza toda la
funcionalidad ya cerrada (editor TipTap, API, tipos, `completed`); solo se
rediseña la presentación móvil.

## Situación actual (lo que cambia)

| Hoy en móvil | Fase 3 |
|---|---|
| Entrar muestra el editor vacío («Selecciona una nota o crea una nueva») | Entrar muestra la **lista de notas** |
| Lista, carpetas y búsqueda están dentro del drawer «Abrir menú» | Lista, **chips de carpetas y buscador fijo** en la pantalla |
| «Nueva nota» es un botón de 32 px dentro del drawer | **FAB** de ≥ 48 px sobre la tab bar, a una mano |
| Toolbar con ~40 controles en varias filas | **Toolbar compacta de una fila + panel «Más formato»** |
| Casillas de tareas y «completar» de 32 px | Objetivos táctiles **≥ 44 px** |
| Un solo árbol adaptado con `lg:` | **Vista móvil y vista de escritorio separadas**, una sola montada por breakpoint |

El escritorio (`lg:`) conserva el layout actual: sidebar con carpetas + lista y
editor a la derecha. Nada de lo que se describe a continuación rompe esa vista.

## Requisitos funcionales

1. **RF1 — Lista por defecto.** Al entrar en `/notas` en móvil se muestra la
   lista de notas ordenada por `createdAt` descendente, con título (o «Sin
   título»), preview del contenido y fecha relativa. El editor vacío ya no es la
   pantalla de entrada.
2. **RF2 — Editor apilado y vuelta sin fricción.** Tocar una nota abre el editor
   con una cabecera «← Notas». «Volver» regresa a la lista conservando el filtro
   activo, el término de búsqueda y la posición de scroll; no recarga ni pide
   datos de nuevo. Se mantienen el estado «Guardando…/Guardado», la confirmación
   de borrado y el pie «Creada por…».
3. **RF3 — Creación rápida.** Un botón flotante cuadrado (+), sobre la tab bar y
   por encima de la zona segura inferior, crea un borrador y abre el editor con
   el foco en la línea de título. El flujo de creación es el actual (`POST
   /api/notes` + `PATCH`); no hay nuevo endpoint ni guardado distinto.
4. **RF4 — Búsqueda local fija.** Campo «Buscar notas» fijo bajo la cabecera,
   que filtra por título y contenido **sin peticiones al servidor por pulsación**
   (mismo patrón aprobado en Fase 2). Muestra «Sin resultados» cuando aplica.
5. **RF5 — Carpetas como chips.** Las carpetas `Todas`, `Compra`, `General` y
   `Pendientes` se muestran como chips horizontales con scroll lateral, activo en
   tinta, con el contador de notas por carpeta. Cambiar de carpeta limpia la
   selección y el borrador, como hoy.
6. **RF6 — Toolbar táctil.** En móvil el toolbar se reduce a una fila con
   negrita, lista, lista de tareas y color; un botón «Más formato» abre el toolbar
   completo actual en un panel en flujo (no flotante). En escritorio el toolbar
   completo sigue visible sin cambios. Todos los botones tienen `aria-label` y
   objetivo ≥ 44 px.
7. **RF7 — Checklist táctil.** Las casillas de `TaskList` de TipTap y el botón
   «Marcar como completada/pendiente» de notas `TODO`/`SHOPPING` tienen un
   objetivo de al menos 44 px en móvil; el estado completado se distingue
   claramente (tachado e inversión tinta/canvas). El guardado sigue siendo el
   actual (`PATCH /api/notes/[id]`), sin campos nuevos.
8. **RF8 — Accesibilidad y estética.** Foco visible, `role="status"`/`aria-live`
   para «Guardado» y errores, `aria-label` en buscador y acciones,
   `prefers-reduced-motion` respetado, sin desbordamiento horizontal a 390 px.
   Paleta cerrada (`canvas`, `ink`, `ash`, `mist`, `pearl`), radios 0, sin
   sombras; el rojo `alarm` sigue reservado a error/eliminación. Sin `#C41E3A`.
9. **RF9 — Sin cambios de datos ni API.** No se añaden modelos, migraciones,
   endpoints ni campos; los esquemas Zod de notas y la API quedan intactos.

## Requisitos no funcionales

- **Rendimiento**: el filtrado es local y puro; no hay fetch por pulsación ni al
  cambiar de carpeta. Un solo `NoteEditor` (TipTap) montado por breakpoint.
- **Compatibilidad**: las notas existentes, con contenido rico y tareas, se
  abren y editan igual que hoy; la vista de escritorio no se reescribe.
- **UX**: una mano, sin sombras, jerarquía Jost 21 px en cabeceras móviles;
  Bodoni solo en el wordmark/`md:`; una sola señal de color por pantalla.
- **Evidencia**: auditoría con capturas reales; lo que no se pueda verificar se
  documenta como follow-up, nunca como comprobado.

## API / Endpoints

Ninguno nuevo. Se reutilizan:

- `GET /api/notes` (carga inicial en el servidor de `/notas`).
- `POST /api/notes` y `PATCH /api/notes/[id]` (creación, guardado, `completed`).
- `DELETE /api/notes/[id]` (borrado con confirmación).

## Modelo de datos

Ninguno. Sin migraciones ni cambios en `prisma/schema.prisma`.

## UI / UX

### Lista (entrada en móvil)

```
Notas                              ← Jost 21 px; «12 notas» en ash 13 px
[  ⌕  Buscar notas               ]
[ Todas ][ Compra ][ General ][ Pendientes ]   ← scroll horizontal
────────────────────────────────
Compra del finde                   ← fila ≥ 64 px
Pan, leche y detergente
Hace 2 h
────────────────────────────────
Ideas para el verano
...
                              [ + ]   ← FAB sobre la tab bar
```

### Editor (al tocar una nota o el FAB)

```
← Notas        Guardado      [✓] [🗑]   ← cabecera; [
] completar solo en TODO/SHOPPING
[B] [≡] [☑] [A] [Más formato]        ← una fila, ≥ 44 px
Compra del finde                    ← primera línea = título
- [x] Pan
- [x] Leche
...
```

«Más formato» despliega el toolbar completo debajo, en flujo; al cerrar vuelve
a la fila compacta. La tab bar inferior sigue visible y no tapa el contenido.

## Criterios de aceptación

- [x] Entrar en `/notas` a 390 px muestra la lista, no el editor vacío (E2E + captura).
- [x] El buscador filtra por título y contenido sin peticiones de red por tecla
      (test puro + E2E).
- [x] Los chips de carpeta filtran por `SHOPPING`/`GENERAL`/`TODO` y muestran
      contadores (test puro + E2E + captura).
- [x] Tocar una nota abre el editor; «Volver» regresa con filtro, búsqueda y
      scroll conservados (E2E).
- [x] El FAB crea una nota y abre el editor con foco en el título; la nota
      aparece en la lista tras guardar (E2E + captura).
- [x] El toolbar móvil cabe en una fila, «Más formato» abre el completo y en
      escritorio el toolbar no cambia (capturas + revisión de clases).
- [x] Las casillas de tareas y «completar» miden ≥ 44 px; marcar una tarea
      persiste con el guardado actual (E2E + captura).
- [x] Sin desbordamiento horizontal a 390 px, sin errores en consola y con
      foco visible en los controles nuevos (Chrome MCP / auditoría).
- [x] No hay cambios en BD, migraciones, schemas, auth ni API (revisión de diff).
- [x] `npm run lint && npm run typecheck && npm run test && npm run build` pasan.
- [x] E2E y auditoría `design-audit` con capturas a 390×844 documentados.
- [x] CI del PR en verde, squash merge y cierre documental completado.

## Decisiones aprobadas (2026-11-19)

El usuario aprobó la spec con la **opción A en las seis decisiones**. Se recogen
aquí con su resultado para trazabilidad.

### 1. Entrada a Notas → **A: lista por defecto y editor apilado** (aprobada)

- **A (aprobada)**: `/notas` abre la lista; tocar una nota abre el editor y
  «Volver» regresa. Es como Notas de Apple y evita el editor vacío actual.
- **B**: mantener el editor como pantalla de entrada y dejar la lista en un
  drawer. Menos cambio, pero sigue exigiendo abrir un menú para empezar.

### 2. Creación rápida → **A: FAB en la lista** (aprobada)

- **A (aprobada)**: botón flotante (+) dentro de Notas, sobre la tab bar.
  No toca la navegación global de Fase 1 y queda al alcance del pulgar.
- **B**: botón «+» en la tab bar (quinta pestaña de acción). Más visible desde
  cualquier sección, pero rompe las cuatro pestañas aprobadas en Fase 1.

### 3. Toolbar del editor → **A: fila compacta + panel «Más formato»** (aprobada)

- **A (aprobada)**: una fila con lo esencial y un panel en flujo con el resto.
  Mantiene todos los formatos sin comer la pantalla.
- **B**: barra de formato fija justo sobre el teclado. Más parecida a un editor
  nativo, pero consumes vertical y es más frágil con el teclado del móvil.

### 4. Carpetas → **A: chips horizontales** (aprobada)

- **A (aprobada)**: chips con scroll bajo el buscador, con contadores.
  Cambiar de carpeta es un toque y no tapa la lista.
- **B**: mantener el drawer lateral de Fase 1. Menos cambio, pero contradicts
  el objetivo de «una mano».

### 5. Acceso «Más» fuera de Perfil (follow-up de Fases 1 y 2) → **A: dejarlo solo en Perfil** (aprobada)

- **A (aprobada)**: no tocar la navegación de Fase 1; Dashboard,
  Dispositivos y Familia siguen en el drawer «Más» de Perfil. Se cierra el
  follow-up con esta decisión explícita y se documenta en el cierre.
- **B**: añadir un botón «Más» discreto en la cabecera de cada pestaña (incluida
  Notas) que abre el mismo drawer. Más visible, pero añade un control en todas
  las pantallas y afecta a otras features ya cerradas.

### 6. Checklist → **A: casillas táctiles + «completar» existente** (aprobada)

- **A (aprobada)**: agrandar las casillas de `TaskList` a ≥ 44 px y mantener
  el botón «Marcar como completada» de la nota. Sin modelo nuevo.
- **B**: añadir un contador de progreso («2 de 5 tareas») calculado del HTML.
  Más información, pero frágil (hay que parsear HTML y sincronizarlo con
  guardados) y no aporta una acción nueva.

## Supuestos

- «Móvil» = viewport `< 1024px` (`lg:` de Tailwind); escritorio conserva el
  layout actual. No se distingue entre tablet y teléfono.
- La autenticación (NextAuth) y los roles no cambian: las notas siguen siendo
  visibles para ADMIN y FAMILY, con las mismas reglas de edición.
- No hay dispositivo iOS/Android en el entorno del agente; la verificación se
  hace en Chromium a 390×844 y el resto queda como follow-up documentado.
- El contenido rico existente (tablas, colores, listas anidadas) no se pierde:
  el editor y el saneado HTML siguen siendo los mismos.
