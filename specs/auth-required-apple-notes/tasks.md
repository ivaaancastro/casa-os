# Tasks: Auth Obligatoria + Notas estilo Apple Notes

## Fase 1 — Auth Obligatoria

- [x] **1.1** Modificar `src/middleware.ts` para proteger TODAS las rutas excepto `/auth/login`
- [x] **1.2** Verificar que `/`, `/devices`, `/notas` redirigen a login si no autenticado
- [x] **1.3** Tests del middleware actualizado — `tests/middleware.test.ts` (8 tests)

## Fase 2 — Layout 3 Columnas

- [x] **2.1** Crear componente `NotesLayout` con grid de 3 columnas — `src/components/notes/NotesLayout.tsx`
- [x] **2.2** Crear componente `NotesSidebar` con carpetas y contadores — `src/components/notes/NotesSidebar.tsx`
- [x] **2.3** Crear componente `NotesList` con buscador y lista de notas — `src/components/notes/NotesList.tsx`
- [x] **2.4** Crear componente `NoteItem` (preview de nota en lista) — `src/components/notes/NoteItem.tsx`
- [x] **2.5** Crear componente `NoteEditor` con auto-guardado — `src/components/notes/NoteEditor.tsx`

## Fase 3 — Funcionalidad Apple Notes

- [x] **3.1** Implementar creacion de nota con boton "+" — `src/components/notes/NotesList.tsx`
- [x] **3.2** Implementar auto-guardado con debounce (500ms) — `src/components/notes/NoteEditor.tsx`
- [x] **3.3** Implementar eliminacion de nota desde editor — `src/components/notes/NoteEditor.tsx`
- [x] **3.4** Implementar busqueda en tiempo real — `src/components/notes/NotesList.tsx`
- [x] **3.5** Implementar filtro por carpeta (tipo) — `src/components/notes/NotesSidebar.tsx`
- [x] **3.6** Implementar toggle completado desde editor — `src/components/notes/NoteEditor.tsx`

## Fase 4 — Responsive (Movil)

- [x] **4.1** En movil: mostrar 1 columna con navegacion entre vistas — `src/components/notes/NotesLayout.tsx`
- [x] **4.2** Boton "volver" en el editor para regresar a la lista — `src/components/notes/NoteEditor.tsx`

## Fase 5 — Integracion y Tests

- [x] **5.1** Modificar pagina `/notas` para usar `NotesLayout` — `src/app/notas/page.tsx`
- [x] **5.2** Tests del flujo completo (filtrado, busqueda, ordenacion) — `tests/notes-apple.test.ts` (9 tests)
- [x] **5.3** Tests del middleware actualizado — `tests/middleware.test.ts` (8 tests)

## Fase 6 — Verificacion

- [x] **6.1** Doble check: `npm run lint && npm run typecheck && npm run test && npm run build`
- [x] **6.2** Commit atomico con conventional commits
- [x] **6.3** Push de la rama y creacion de PR
- [x] **6.4** Verificar CI en verde
