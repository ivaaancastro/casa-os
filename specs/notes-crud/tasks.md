# Tasks: CRUD de Notas y Lista de la Compra

## Fase 1 — Schemas y validación

- [x] **1.1** Crear schema Zod para crear nota (`title`, `content`, `type`) — `src/lib/schemas/note.ts`
- [x] **1.2** Crear schema Zod para editar nota (campos opcionales) — `src/lib/schemas/note.ts`
- [x] **1.3** Crear schema Zod para filtros de listado (`type`, `completed`) — `src/lib/schemas/note.ts`
- [x] **1.4** Tests de los schemas Zod — `tests/schemas/note.test.ts` (17 tests)

## Fase 2 — API Routes

- [x] **2.1** Crear `GET /api/notes` — listar con filtros — `src/app/api/notes/route.ts`
- [x] **2.2** Crear `POST /api/notes` — crear nota — `src/app/api/notes/route.ts`
- [x] **2.3** Crear `PATCH /api/notes/[id]` — editar nota — `src/app/api/notes/[id]/route.ts`
- [x] **2.4** Crear `DELETE /api/notes/[id]` — eliminar nota — `src/app/api/notes/[id]/route.ts`
- [x] **2.5** Tests de API routes (logica y autorizacion) — `tests/api/notes.test.ts` (10 tests)

## Fase 3 — Componentes UI

- [x] **3.1** Crear componente `Modal` reutilizable — `src/components/ui/Modal.tsx`
- [x] **3.2** Crear componente `NoteForm` (crear/editar) — `src/components/notes/NoteForm.tsx`
- [x] **3.3** Crear componente `NoteCard` (nota individual con acciones) — `src/components/notes/NoteCard.tsx`
- [x] **3.4** Crear componente `NoteList` (lista con optimistic updates) — `src/components/notes/NoteList.tsx`
- [x] **3.5** Crear componente `NoteFilters` (filtros por tipo/estado) — `src/components/notes/NoteFilters.tsx`
- [x] **3.6** Modificar pagina `/notas` para integrar todos los componentes — `src/app/notas/page.tsx`

## Fase 4 — Lista de la compra (caso especial)

- [ ] **4.1** Crear componente `ShoppingItem` con checkbox — `src/components/notes/ShoppingItem.tsx`
- [ ] **4.2** Implementar logica de "Limpiar completados" — `src/components/notes/NoteList.tsx`
- [ ] **4.3** Tests del flujo de lista de la compra — `tests/notes-shopping.test.ts`

## Fase 5 — Tests y verificación

- [ ] **5.1** Test integracion: crear nota, editar, toggle, eliminar — `tests/notes-flow.test.ts`
- [ ] **5.2** Tests de autorizacion (autor vs no autor) — `tests/api/notes-auth.test.ts`
- [ ] **5.3** Doble check: `npm run lint && npm run typecheck && npm run test && npm run build`
- [ ] **5.4** Commit atomico con conventional commits
- [ ] **5.5** Push de la rama `feat/notes-crud` y creacion de PR
- [ ] **5.6** Verificar CI en verde
