# Tareas — Rediseño visual: Inditex → Apple

> **Feature:** `rediseno-apple`
> **Spec aprobada:** 2026-11-24
> **Rama:** `feat/rediseno-apple`

## Fase A — Tokens y tipografía

- [x] A1. Actualizar `tailwind.config.ts`: colores (background/surface/accent/success/warning/error/separator), radios, sombras, tipografía del sistema, transiciones.
- [x] A2. Actualizar `src/app/globals.css`: variables CSS semánticas light/dark, materiales, separadores, botones, inputs, tarjetas, hojas inferiores.
- [x] A3. Revisar `src/app/layout.tsx`: tipografía del sistema, sin Bodoni en body.
- [x] A4. Verificar `npm run lint && npm run typecheck && npm run build`.

## Fase B — Componentes base

- [x] B1. `btn` / `btn-primary` / `btn-secondary` / `btn-danger`: radios, colores Apple.
- [x] B2. `input`, `label`, `card`: radios, fondos, separadores.
- [x] B3. Tab bar inferior: material translúcido, blur, iconos.
- [x] B4. Sidebar escritorio: blur, separador fino, wordmark único.
- [x] B5. `PageHeader` y badges.
- B6 (pendiente). TipTap CSS en `globals.css`: radios, colores, selección (parcial).

## Fase C — Pantallas

- [x] C1. Login (`src/app/auth/login/page.tsx`).
- [x] C2. Dashboard (`src/app/page.tsx`).
- C3 (parcial por clases globales). Notas (`NotesLayout`, `NoteEditor`, `NoteItem`, vistas móvil/escritorio) — parcial (clases globales).
- C4 (parcial por clases globales). Calendario (`CalendarApp`, vistas, `EventPanel`, `ReminderPanel`) — parcial (clases globales).
- C5 (parcial por clases globales). Dispositivos (`DeviceLayout`, vistas, hojas) — parcial (clases globales).
- C6 (parcial por clases globales). Cuentas (`VaultApp`, `VaultUnlock`, tarjetas) — parcial (clases globales).
- [x] C7. Perfil (`src/app/perfil/page.tsx`).
- [x] C8. Familia (`src/app/familia/page.tsx`).

## Fase D — QA y cierre

- D1. Capturas Chrome MCP (móvil + escritorio) de todas las pantallas (parcial).
- D2 (pendiente). Lighthouse accesibilidad ≥ 95 en dashboard y notas.
- D3. Ejecutar `lint && typecheck && test && build` (OK).
- D4 (OK: 26/26 E2E). E2E Playwright en verde.
- D5 (pendiente). Cierre documental (`specs/rediseno-apple/cierre.md`, MEMORY, CHANGELOG, docs).
- D6 (pendiente). `npm run docs:check -- rediseno-apple`.

## Pendientes / follow-ups

- Dark mode completo queda para una fase posterior; esta fase solo prepara tokens.
- Verificación en dispositivo físico (safe-area, Face ID) sigue pendiente del propietario.
