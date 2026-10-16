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

