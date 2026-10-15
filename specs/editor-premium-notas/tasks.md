# Tareas — Editor premium para notas

## 1. Sanitización
1. [ ] Añadir `font-family` y `line-height` en ALLOWED_STYLES (`src/lib/utils/sanitize.ts`).

## 2. Editor
2. [ ] Modificar `NoteEditor.tsx`: cargar extensions FontFamily/FontSize/LineHeight.
3. [ ] Reemplazar toolbar import con nueva PremiumToolbar.
4. [ ] Nueva `PremiumToolbar.tsx` fija, sin marco, grupos estéticos editorial.

## 3. UI
5. [ ] Implementar dropdown font family y size + line-height.
6. [ ] Paleta completa (24 colores) + 8 highlight + pickers.
7. [ ] Editor container sin borde: mínima división.
8. [ ] Título con font-display size mayor y letter-spacing negative.

## 4. Probar y verificar
9. [ ] TDD/util tests para sanitize style.
10. [ ] Crear test E2E manual local.
11. [ ] Lint/typecheck/test/build.
12. [ ] (CI)

