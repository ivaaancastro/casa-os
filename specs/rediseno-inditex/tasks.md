# Tareas — Rediseño visual inspirado en Inditex

## 1. Preparación
1. [ ] Añadir Google Fonts (Bodoni Moda para display + Jost para UI) en `src/app/layout.tsx` (next/font/google) con preload.
2. [ ] Añadir variables CSS de tokens en `src/app/globals.css`: colores, radii, timings.
3. [ ] Extender `tailwind.config.ts`: color canvas/ink/ash/mist/pearl/destructive, font families display/ui, letter spacing, transition durations.
4. [ ] Crear `components/ui/Button.tsx` y `components/ui/Input.tsx` que consuman los tokens.
5. [ ] Actualizar `components/ui/*` existentes (si los hay) para usar los tokens y sin sombras/radios por defecto.

## 2. Layout base
6. [ ] `src/app/layout.tsx`: wrapper con margins laterales y topbar (wordmark `casa-os` en Bodoni) + navegación.
7. [ ] Sidebar protegido: sidebar vertical mínimo + animación única de entrada.
8. [ ] Mobile drawer: mantener comportamiento; ajustar estilo minimal.

## 3. Páginas principales
9. [ ] `src/app/page.tsx` (Dashboard): grid editorial de 12 columnas, módulos con títulos grandes, sin tarjetas genéricas.
10. [ ] `src/app/auth/login/page.tsx`: layout calmado, centrado vertical, formulario limpio.
11. [ ] `src/app/notas/page.tsx` + `NotesLayout`: refactor a grid editorial con sidebar de carpetas y editor.
12. [ ] `src/app/devices/page.tsx`: grid editorial, lista de dispositivos minimalista.

## 4. Notes – listado y editor Apple-style→Inditex
13. [ ] `NoteItem`: square cards, borde fino 1px, sin shadow, hover de borde.
14. [ ] `NotesSidebar`: líneas finas + headings serif/bold.
15. [ ] `Toolbar`: botones sin radios, icon-only, hover neutro.
16. [ ] `NoteEditor`: spacing generoso, tipografía UI.
17. [ ] Un único momento orquestado de carga (CSS keyframes una vez).

## 5. Accesibilidad y motion
18. [ ] Foco visible 2px negro.
19. [ ] `prefers-reduced-motion`: sin animaciones.
20. [ ] Contraste AAA text.

## 6. Verificación
21. [ ] `npm run lint && npm run typecheck && npm run test && npm run build`.
22. [ ] Smoke manual en Chrome: home, login, notas, dispositivos.
23. [ ] CI verde, PR aprobado y merge, eliminar rama.

