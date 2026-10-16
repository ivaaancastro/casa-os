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

---

## Iteración 3 — Editor tipo Apple Notas

### 9. Documentación / norma
21. [x] `specs/editor-layout-premium/referencia-apple-notas.md`: fijar Apple Notas como norma del feat.
22. [x] `spec.md`: sección Iteración 3 (RF1/RF2/RF3).

### 10. Título integrado (RF1)
23. [x] `lib/utils/note-html.ts` + tests: `extractFirstBlockText`, `removeFirstBlock`, `withTitleLine`, `escapeHtml`.
24. [x] `NoteEditor.tsx`: el título pasa a ser la primera línea del documento (h1); sin `<input>`.
25. [x] Guardado: `title` derivado del primer bloque; `content` incluye la primera línea.
26. [x] Migración idempotente al cargar notas antiguas.
27. [x] `NoteItem.tsx`: el preview excluye el título solo si el primer bloque coincide con él.

### 11. Menos marcos / a sangre (RF2)
28. [x] `app/layout.tsx`: `main` sin padding ni `max-width`.
29. [x] `app/page.tsx` y `app/devices/page.tsx`: `max-width`/padding por página.
30. [x] `app/notas/page.tsx`: workspace a sangre (`100dvh`), sin `section` con borde.
31. [x] `NoteEditor.tsx`: barra única (formato + estado + acciones) con un solo divisor.

### 12. Más funcionalidades (RF3)
32. [x] Añadir estilos de párrafo (Título/Encabezado/Subencabezado/Cuerpo/Monoespaciado).
33. [x] Checklist (TaskList/TaskItem) y lista con guiones (`data-list-style`).
34. [x] Tablas (`@tiptap/extension-table`) y enlaces.
35. [x] Indentación (`data-indent`, atajos `⌘]` / `⌘[`).
36. [x] `Toolbar.tsx`: `shouldRerenderOnTransaction` para reflejar el cursor (estilo activo, negrita…).
37. [x] `lib/utils/sanitize.ts`: allow-list para checklist, tablas, enlaces e indentación.

### 13. Validación y esquema
38. [x] `lib/schemas/note.ts`: límites ampliados (título 200, contenido 100000, vacío permitido).
39. [x] `tests/api/notes.schemas.test.ts` y `tests/sanitize.test.ts` actualizados.

### 14. Verificación
40. [x] Lint/typecheck/test (78)/build.
41. [x] Verificación en Chrome MCP: título formateable (30px + negrita) y round-trip,
    checklist, tabla, lista con guiones y enlace conservados tras recargar; barra
    refleja el cursor; layout a sangre (aside 544 == editor 544; sin `section`).
