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

