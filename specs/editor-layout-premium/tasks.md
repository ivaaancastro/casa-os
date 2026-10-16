# Tareas — Layout premium para el editor de notas

## 1. Reestructurar layout
1. [x] `NotesLayout.tsx`: cambiar de 3 columnas a sidebar + editor.
2. [x] `NotesSidebar.tsx`: integrar en sidebar izquierdo.
3. [x] `NotesList.tsx`: integrar en sidebar izquierdo.

## 2. Editor
4. [x] `NoteEditor.tsx`: toolbar sticky, contenido centrado max-w-720px.
5. [x] `Toolbar.tsx`: sticky top-0 z-40, sin bordes redondeados.

## 3. Responsive
6. [x] Sidebar colapsable en tablet/móvil.
7. [x] Botón hamburguesa para abrir sidebar en móvil.

## 4. Verificación
8. [x] Lint/typecheck/test/build.
9. [x] Verificación visual con Chrome MCP.

---

## Iteración 2 — Correcciones de usabilidad

## 5. Bordes y layout
10. [x] `NotesLayout.tsx`: quitar `-m-*` y alturas fijas; `flex-1 min-h-0`.
11. [x] `notas/page.tsx`: workspace a altura completa, sin título gigante.
12. [x] `NotesSidebar.tsx`: "Carpetas" como etiqueta compacta.
13. [x] `NotesList.tsx`: quitar filtros móviles duplicados (ya está el sidebar).

## 6. Toolbar y paletas
14. [x] `NoteEditor.tsx`: toolbar fuera del contenedor con scroll (siempre visible).
15. [x] `Toolbar.tsx`: paletas de ancho completo (`inset-x-0 top-full`), sin recortes.

## 7. Título
16. [x] `globals.css`: clase `.no-focus-outline` con `!important`.
17. [x] `NoteEditor.tsx`: recargar solo al cambiar de nota; sin `router.refresh()` en autosave.
18. [x] `NoteEditor.tsx`: título responsivo sin marco de foco.

## 8. Verificación
19. [x] Lint/typecheck/test/build.
20. [x] Verificación visual con Chrome MCP (consola limpia).
