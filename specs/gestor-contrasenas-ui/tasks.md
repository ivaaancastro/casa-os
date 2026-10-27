# Tasks: UI Gestor de contraseñas (feat/gestor-contrasenas-ui)

## Implementación (todas completadas ✅)
- [x] 1. Añadir ítem "Contraseñas" al array `navItems` en `src/components/layout/sidebar.tsx` (solo texto, sin icono) — PR #33 mergeado
- [x] 2. Crear `src/app/contrasenas/page.tsx` con estructura idéntica a `/calendario` y `/devices` (header, section, grid) — implementado
- [x] 3. Implementar `src/components/passwords/PasswordList.tsx` — lista desktop (tabla simple, sin íconos columna) y móvil (cards apiladas, empty state sin iconos) — implementado
- [x] 4. Implementar `src/components/passwords/PasswordModal.tsx` — modal crear/editar (centrado desktop, full-screen móvil, campos solo texto, validación Zod, focus trap, ESC cierra) — implementado
- [x] 5. Implementar `src/components/passwords/PasswordActions.tsx` — botones Exportar/Importar (solo texto, file input, fetch API, FileReader) — implementado
- [x] 6. Crear `src/hooks/usePasswords.ts` — hook SWR (`/api/passwords`, revalidateOnFocus, mutate después de mutations, onError toast) — implementado
- [x] 7. Verificar mobile 390px: sin overflow, header/apilan, sidebar collapsed, lista cards apiladas (`npm run build` + devtools) — verificado
- [x] 8. Probar flow completo: login → sidebar "Contraseñas" → `/contrasenas` → ver lista vacía → crear → editar → borrar → exportar → importar — verificado manualmente
- [x] 8. `npm run lint` — 0 warnings/errors en todos los archivos nuevos — verificado
- [x] 10. `npm run typecheck` — 0 errors en TypeScript estricto — verificado
- [x] 11. `npm run test` — vitest passa (tests unitarios mocked del hook y componentes) — verificado (356 tests global)
- [x] 12. `npm run build` — build de producción exitoso — verificado
- [x] 13. `npm run docs:check -- gestor-contrasenas-ui` — pasa — verificado