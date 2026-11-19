# Plan — Fase 3: Notas móvil

## Contexto

El usuario quiere que `/notas` se use con una mano en el móvil, como Notas de
Apple: abrir la app y **ver la lista**, tocar una nota para editarla, crear una
nota **de un toque**, buscar y filtrar sin abrir menús, y marcar tareas con el
pulgar. Es el tercer pilar del roadmap móvil-first, después de la fundación
(Fase 1) y Cuentas (Fase 2).

Hoy `/notas` es un layout de escritorio adaptado:

- `NotesLayout` decide entre sidebar y editor con `lg:`; en móvil la **lista,
  las carpetas y el buscador viven dentro de un drawer** que hay que abrir con
  el botón «Abrir menú» (esquina superior izquierda).
- Al entrar en `/notas` en móvil se ve directamente el **editor vacío** con el
  mensaje «Selecciona una nota o crea una nueva», no el listado.
- `Toolbar` muestra **~40 controles en una sola fila con `flex-wrap`**: en 390 px
  ocupa varias filas y empuja el contenido; selectores de fuente/tamaño/color
  son difíciles de usar con el pulgar.
- Las casillas de `TaskList` (TipTap) y el botón «completar nota» son de 32 px.

La base funcional ya está cerrada y en producción: crear/editar/borrar notas,
tipos `SHOPPING`/`GENERAL`/`TODO`, `completed`, búsqueda local por título y
contenido, editor TipTap con listas, tablas y formato. **Esta fase no rehace el
editor ni toca datos**: cambia la forma de navegar y de usar lo que ya existe
en móvil.

## Enfoque técnico

### 1. Un solo árbol de render por breakpoint

`NotesLayout` sigue siendo el dueño del estado (`notesState`, `selectedNoteId`,
`activeFolder`, `searchQuery`, `draftNote`). Se extrae el marcado actual a un
`NotesDesktopView` y se crea `NotesMobileView`; un hook pequeño
`useIsMobile()` (`matchMedia('(max-width: 1023px)')`, con valor inicial
`false` en servidor y actualización en `mount`) elige cuál renderizar.

**Por qué no usar solo CSS `hidden lg:flex` / `flex lg:hidden`:** montaría dos
instancias de `NoteEditor` (TipTap) a la vez, con ids duplicados (`note-search`,
`paragraph-style`, …), efectos de foco compitiendo y guards de guardado
duplicados. Renderizar un solo árbol evita ese riesgo. Se documenta el
comportamiento previo a la hidratación como riesgo menor (ver *Riesgos*).

### 2. Lista primero, editor apilado

En móvil `/notas` entra en la **lista**:

```
Notas                        ← Jost 21 px + «N notas» en ash 13 px
[Buscar notas]               ← sticky, local, sin peticiones por tecla
[Todas][Compra][General][Pendientes]  ← chips horizontal, activo en ink
────────────────────────────
Compra del finde             ← fila ≥ 64 px, título + preview + fecha
  Pan, leche, detergente
  Hace 2 h
...
                         [  +  ]      ← FAB cuadrado sobre la tab bar
```

- Tocar una nota cambia a la **vista editor** (`← Notas` arriba). «Volver»
  regresa a la lista con el filtro y el scroll conservados; no recarga.
- El FAB crea un borrador (`draft-…`) y abre el editor directamente, reutilizando
  el flujo de creación actual de `NoteEditor` (POST + PATCH) sin nuevo endpoint.
- El editor móvil mantiene la barra de estado (Guardando/Guardado), «completar»
  para `TODO`/`SHOPPING` y la confirmación de borrado.

### 3. Toolbar compacta + panel de formato

- `Toolbar` acepta una prop `compact?: boolean`. En compacto muestra una sola
  fila con las acciones que se usan con el pulgar: **negrita, lista, lista de
  tareas, color** y «Más formato»; el botón «Más formato» despliega el toolbar
  completo actual en un panel bajo la barra.
- En escritorio `compact` es `false` y el toolbar no cambia.
- Objetivos táctiles ≥ 44 px y `aria-label` en todos los botones. Las reglas
  específicas de TipTap van en `globals.css` (lección de MEMORY: styled-jsx no
  alcanza el DOM de ProseMirror).

### 4. Carpetas y búsqueda local

- Las carpetas pasan de drawer a **chips horizontales** con scroll lateral y
  el mismo `FolderFilter` (`ALL`/`SHOPPING`/`GENERAL`/`TODO`). Se conservan los
  contadores por carpeta y el orden por `createdAt` descendente.
- La búsqueda se extrae del filtro inline de `NotesLayout` a una función pura
  `filterNotes(notes, { folder, query })` en `src/lib/utils/`, testeable con
  Vitest, y sigue siendo **100 % local** (título + contenido, sin peticiones).
- Se reutiliza el patrón de `specs/cuentas-movil`: buscador fijo, mensaje
  «Sin resultados» y filtros compactos.

### 5. Checklist táctil

- Las casillas de `TaskList` se agrandan a ≥ 44 px en móvil mediante CSS en
  `globals.css`, con el estado tachado bien visible; se conserva el usuario
  TipTap `TaskItem.configure({ nested: true })`.
- El botón «Marcar como completada» de `TODO`/`SHOPPING` pasa a 44 px y sigue
  usando `PATCH /api/notes/[id]`.
- No se añade un modelo de checklist nuevo ni persistencia adicional.

### 6. Verificación

- Unitarias: `filterNotes` (por carpeta, por texto, combinado, vacío) y el
  mapeo tipo → carpeta. Sin tocar los schemas de notas.
- E2E nuevo `tests/e2e/notas-movil.spec.ts` (Pixel 7/Chromium, login real,
  `workers: 1` y `globalSetup` compartidos): entrar ve la lista; buscar y
  filtrar por carpeta; tocar una nota abre el editor y «Volver» regresa;
  crear con el FAB; marcar una tarea.
- Auditoría visual con la skill `design-audit` a 390×844 sobre el flujo
  completo (lista → búsqueda → editor → creación), con capturas guardadas.
- Sin cambios en BD, migraciones, auth ni API.

## Decisiones aprobadas

Ver `spec.md` → *Decisiones aprobadas (2026-11-19)*. El usuario aprobó la
opción A en las seis: lista por defecto, FAB en la lista, toolbar compacta con
panel «Más formato», chips de carpetas, checklist táctil y «Más» solo en Perfil.

## Dependencias

- [x] Fase 1 cerrada: shell, tab bar de 4 pestañas y cabeceras móviles.
- [x] Fase 2 cerrada: patrón de buscador fijo y E2E con login real.
- [x] Notas, editor TipTap, API y schemas ya implementados y en producción.
- [x] `@playwright/test` y la skill `design-audit` disponibles.
- [ ] Aprobación de `specs/notas-movil/spec.md` por el usuario.

## Riesgos

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| Flash de la vista escritorio antes de la hidratación en móvil | Media | Bajo | Valor inicial `false`, corrección en `mount`; verificar en E2E que la lista aparece y no hay error de hidratación |
| Dos editores TipTap montados | Alta si se usa solo CSS | Alto | Renderizar un solo árbol con `useIsMobile()`; test manual en Chrome |
| El panel «Más formato» tape el contenido al abrir el teclado | Media | Medio | Panel en flujo (no flotante), mismo patrón que el aviso de instalación; revisar con Chrome a 390 px |
| La tab bar tape el FAB o el final de la lista | Media | Medio | FAB con `bottom` por encima de la tab bar + `env(safe-area-inset-bottom)`; `padding-bottom` en la lista |
| Cambiar el toolbar rompa el escritorio | Baja | Medio | `compact` por defecto `false`; E2E/auditoría de escritorio no cambia; verificar `toolbar` completo sigue visible en `lg:` |
| La Function pura de filtrado diverga del filtro actual | Baja | Bajo | Extraer el código existente sin cambiar su semántica; tests que cubren ambos casos |
| «Más» siga siendo poco visible fuera de Perfil | Media | Bajo | Decisión explícita del usuario; si se aprueba añadirlo, copy y drawer reutilizados |

## Fuera de alcance

- Cambios en `prisma/schema.prisma`, migraciones, API, auth ni navegación global
  (salvo la decisión «Más» si el usuario la aprueba).
- Reescribir el editor TipTap, quitar formatos existentes ni añadir campos.
- Sincronización entre dispositivos, historial de versiones, papelera ni
  exportación (están en el backlog).
- Tema oscuro, animaciones coreografiadas ni swipe actions.
- Verificación en dispositivo real iOS/Android: se deja como follow-up
  documentado, igual que en Fases 1 y 2.

## Verificación final

- `npm run lint && npm run typecheck && npm run test && npm run build`.
- `npm run test:e2e` con login real contra la BD local sembrada.
- Chrome MCP a 390×844 + informe con la skill `design-audit`.
- CI del PR en verde, squash merge y cierre documental (Paso 8 de `AGENTS.md`).
