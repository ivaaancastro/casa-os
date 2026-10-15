# Tasks: Editor de Texto Enriquecido para Notas

## Fase 1 — Dependencias y configuracion

- [x] **1.1** Instalar dependencias de TipTap: `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-color`, `@tiptap/extension-text-style`, `@tiptap/extension-text-align`, `@tiptap/extension-highlight`, `@tiptap/extension-placeholder`, `@tiptap/extension-underline` — `package.json`
- [x] **1.2** Instalar DOMPurify: `dompurify` + `@types/dompurify` — `package.json`
- [x] **1.3** Crear utilidad de sanitizacion — `src/lib/utils/sanitize.ts`
- [x] **1.4** Tests de sanitizacion (XSS, tags permitidos, estilos seguros) — `tests/sanitize.test.ts` (26 tests)

## Fase 2 — Editor TipTap

- [x] **2.1** Crear componente `RichTextEditor` con TipTap — `src/components/notes/RichTextEditor.tsx`
- [x] **2.2** Integrar StarterKit (headings, bold, italic, lists, etc.) — `src/components/notes/RichTextEditor.tsx`
- [x] **2.3** Anadir extensiones: Color, TextAlign, Highlight, Placeholder, Underline — `src/components/notes/RichTextEditor.tsx`
- [x] **2.4** Implementar auto-guardado con debounce (500ms) — `src/components/notes/RichTextEditor.tsx`
- [x] **2.5** Indicador de estado: "Guardando..." / "Guardado" — `src/components/notes/RichTextEditor.tsx`

## Fase 3 — Toolbar

- [x] **3.1** Crear componente `Toolbar` con botones de formato — `src/components/notes/Toolbar.tsx`
- [x] **3.2** Botones de headings (H1, H2, H3, P) — `src/components/notes/Toolbar.tsx`
- [x] **3.3** Botones de estilo (B, I, U, S) — `src/components/notes/Toolbar.tsx`
- [x] **3.4** Botones de listas (bullets, numerada, checkbox) — `src/components/notes/Toolbar.tsx`
- [x] **3.5** Selector de color de texto y resaltado — `src/components/notes/Toolbar.tsx`
- [x] **3.6** Botones de alineacion y deshacer/rehacer — `src/components/notes/Toolbar.tsx`
- [x] **3.7** Integrar toolbar con el editor — `src/components/notes/NoteEditor.tsx`

## Fase 4 — Integracion y Preview

- [x] **4.1** Modificar `NoteEditor` para usar editor TipTap integrado — `src/components/notes/NoteEditor.tsx`
- [x] **4.2** Modificar `NoteItem` para mostrar preview HTML sanitizado — `src/components/notes/NoteItem.tsx`
- [x] **4.3** Tests de sanitizacion HTML — `tests/sanitize.test.ts` (26 tests)

## Fase 5 — Verificacion

- [x] **5.1** Doble check: `npm run lint && npm run typecheck && npm run test && npm run build`
- [ ] **5.2** Commit atomico con conventional commits
- [ ] **5.3** Push de la rama y creacion de PR
- [ ] **5.4** Verificar CI en verde
