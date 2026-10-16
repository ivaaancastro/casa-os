# Spec — Layout premium para el editor de notas

## Objetivo
Reestructurar el layout de notas para que el editor tenga espacio de sobra,
la toolbar sea siempre accesible y no haya solapamientos.

## Layout propuesto
```
┌─────────────────────────────────────────────────────┐
│ Sidebar (240px) │  Editor (flex-1)                  │
│                 │  ┌─────────────────────────────┐  │
│  Carpetas       │  │ Toolbar (sticky top)        │  │
│  - Todas        │  ├─────────────────────────────┤  │
│  - Compra       │  │                             │  │
│  - General      │  │  Título                     │  │
│                 │  │                             │  │
│  Lista notas    │  │  Contenido (max-w 720px)    │  │
│  - Nota 1       │  │                             │  │
│  - Nota 2       │  │                             │  │
│                 │  └─────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

## Componentes a modificar
1. `NotesLayout.tsx`: eliminar 3 columnas; sidebar + editor.
2. `NotesSidebar.tsx`: integrar en el sidebar izquierdo.
3. `NotesList.tsx`: integrar en el sidebar izquierdo.
4. `NoteEditor.tsx`: toolbar sticky, contenido centrado.
5. `Toolbar.tsx`: sticky top-0, z-index alto.

## Comportamiento responsive
- **Desktop (>1024px)**: sidebar visible + editor.
- **Tablet (768-1024px)**: sidebar colapsable (toggle).
- **Móvil (<768px)**: sidebar oculto, editor full-width, botón para abrir sidebar.

## Criterios de aceptación
- [ ] Toolbar siempre visible al hacer scroll.
- [ ] Editor usa todo el ancho disponible.
- [ ] Sin solapamientos entre elementos.
- [ ] Sidebar con carpetas + lista de notas integradas.
- [ ] Responsive correcto.
- [ ] Lint/typecheck/test/build pasan.

---

## Iteración 2 — Correcciones de usabilidad

Tras la primera implementación el usuario reporta: bordes solapados, la paleta
de color no se despliega, espacio mal aprovechado y el título no se puede editar.

### Causas y correcciones

1. **Bordes solapados (esquina derecha)**
   - Causa: `NotesLayout` usaba `-m-4 lg:-m-8` y `h-[calc(100vh-9.5rem)]`,
     mayor que la sección contenedora (`h-[calc(100vh-13rem)]`), provocando
     desbordamiento sobre el borde de la sección.
   - Corrección: eliminar márgenes negativos y alturas fijas; la sección pasa a
     `flex` y el layout a `flex-1 min-h-0`. Un único borde por sección.

2. **Paleta de color no se despliega bien**
   - Causa: la toolbar vivía dentro del contenedor `overflow-y-auto` (que
     convierte `overflow-x` en `auto` y recorta) y el popup era `absolute left-0`
     (se cortaba a la derecha).
   - Corrección: la toolbar sale del contenedor con scroll (es un hijo fijo del
     flex column del editor) y las paletas pasan a paneles de ancho completo
     (`absolute inset-x-0 top-full`), sin recortes.

3. **Espacio mal aprovechado**
   - Causa: título de página gigante + "Notas" duplicado en el sidebar +
     "Carpetas" grande + padding interno excesivo.
   - Corrección: la página de notas es un workspace a altura completa
     (`100dvh` menos el padding del `main`); el único título es "Notas" en el
     sidebar; "Carpetas" pasa a etiqueta; sidebar a 256px y espaciados ajustados.

4. **No se puede editar el título + marco alrededor**
   - Causa (marco): la regla global `input:focus-visible { outline }` gana en
     especificidad al `outline-none` de Tailwind.
   - Causa (edición): cada autoguardado hacía `router.refresh()`, que al
     re-renderizar reasignaba el título y perdía el foco/cursor.
   - Corrección: clase `.no-focus-outline` (con `!important`) en el título;
     el editor recarga el contenido solo al cambiar de nota (`loadedNoteIdRef`);
     el autoguardado ya no refresca la página, actualiza el listado de forma
     optimista vía `onNoteUpdated`.

### Criterios de aceptación (iteración 2)
- [ ] Sin bordes duplicados ni solapamientos en ninguna esquina.
- [ ] Paletas de color y resaltado se despliegan completas y sin recortes.
- [ ] El workspace ocupa toda la altura/anchura disponible.
- [ ] El título se edita con normalidad y sin marco de foco.
- [ ] Lint/typecheck/test/build pasan.

---

## Iteración 3 — Editor tipo Apple Notas

**Norma del feat**: Apple Notas es la referencia de funcionalidad/flujo
(ver `referencia-apple-notas.md`). La estética sigue siendo la editorial Inditex.

### RF1 — Título completamente editable (estilo Apple Notas)
- El título deja de ser un `<input>` plano: pasa a ser la **primera línea del
  documento TipTap**, con estilo de párrafo *Título*.
- **Todos** los controles de la barra (fuente, tamaño, color, resaltado,
  alineación…) aplican también al título.
- El listado y la búsqueda usan el **texto plano de la primera línea** (campo
  `title` derivado en el guardado).
- Migración idempotente: al cargar una nota cuyo contenido no empieza por el
  título, se antepone la primera línea con el título actual.

### RF2 — Menos marcos, más pantalla
- Eliminar el `section` con borde exterior alrededor del workspace de notas.
- Notas a **sangre (full-bleed)**: ocupa todo el ancho y alto del área de
  contenido, sin el padding/`max-width` global.
- Un solo divisor entre menú de secciones, sidebar de notas y editor.
- Se refactoriza el layout global a `max-width` **por página** para no alterar
  dashboard/dispositivos.

### RF3 — Más funcionalidades dentro de la nota (pack Apple Notas)
- **Estilos de párrafo**: Título, Encabezado, Subencabezado, Cuerpo, Monoespaciado.
- **Listas**: viñetas, **guiones**, numerada y **checklist** (tareas con checkbox).
- **Tablas**.
- **Enlaces** (crear/editar/quitar).
- **Indentación** (sangrar / desangrar).
- Se mantienen: negrita, cursiva, subrayado, tachado, color, resaltado,
  alineación, cita, código, divisoria, deshacer/rehacer.
- **Atajos** tipo Apple: `⌘⇧7` viñetas, `⌘⇧8` guiones, `⌘⇧9` numerada, `⌘⇧L` checklist.

### Decisiones de diseño
- **Título integrado** en el editor (recomendado; es exactamente lo de Apple).
- Estilos de párrafo vía extensiones TipTap (`Heading` + estilos CSS por
  `data-style`/heading levels) y una **TaskList/TaskItem** para checklist.
- El campo `title` de la BD se conserva como espejo de texto plano para
  listado/búsqueda; el `content` pasa a incluir la primera línea (título).

### Criterios de aceptación (iteración 3)
- [x] Se puede cambiar fuente, tamaño, color, resaltado y alineación del título.
- [x] La primera línea actúa como título y se refleja en el listado.
- [x] Workspace sin marcos anidados, a sangre, con un único divisor por columna.
- [x] Checklist, listas con guiones, tablas, enlaces e indentación funcionan.
- [x] Atajos de lista operativos.
- [x] Datos existentes migrados sin duplicar el título.
- [x] Lint/typecheck/test/build y CI pasan.

