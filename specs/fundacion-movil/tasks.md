# Tasks — Fase 1: Fundación móvil

Ordenadas por dependencia. Cada tarea pequeña (30 min–2 h). Checkboxes marcados
solo con verificación real; lo no verificado se mueve a `cierre.md` → follow-ups.

## Fase 0 — Preparación

- [x] 1. Confirmar rama `feat/fundacion-movil` desde `main` actualizado y sin PRs
      abiertos. Archivos: git. (Hecho al crear la spec.)

## Fase 1 — Estructura del shell

- [x] 2. Extraer `NAV_ITEMS` y el wordmark a `src/components/navigation/nav-items.ts`
      para compartirlos entre sidebar, tab bar y drawer. Sin lógica nueva.
- [x] 3. Crear `src/components/mobile/BottomTabBar.tsx` (cliente): cuatro pestañas
      Notas/Cuentas/Calendario/Perfil, `usePathname`, `aria-current="page"`,
      icono 20 px + etiqueta, alto ≥44 px, `env(safe-area-inset-bottom)`, borde
      superior `mist`, activo `ink` / inactivo `ash`, sin badges de color.
- [x] 4. Crear `src/components/mobile/MoreDrawer.tsx` (cliente): drawer con
      Dashboard, Dispositivos, Familia y `LogoutButton`; portal a `document.body`,
      cierre al pulsar fondo/Escape, foco inicial y `aria-modal`. Reutiliza `NAV_ITEMS`.
- [x] 5. Crear `src/components/AppShell.tsx`: `Sidebar` en `lg:`, `main` con
      padding inferior para la tab bar, `BottomTabBar` y `InstallPrompt`. Sustituir
      el `div.flex` de `src/app/layout.tsx`. Las rutas `/auth/*` no llevan shell.
- [x] 6. Ajustar `src/components/Sidebar.tsx`: ocultar en móvil, importar
      `NAV_ITEMS`, quitar el botón de menú móvil y su backdrop. Conservar wordmark
      y `LogoutButton` en escritorio.

## Fase 2 — Bienvenida e instalación

- [x] 7. Crear `src/components/pwa/InstallPrompt.tsx` (cliente): `beforeinstallprompt`,
      aviso compacto en el flujo (sin wordmark duplicado), fallback textual para
      iOS Safari, dismiss persistente en `localStorage`, solo `lg:hidden`.
- [x] 8. Verificado: `manifest.ts`, `sw.js` y `/offline` intactos; tests
      `tests/pwa-sw.test.ts` y `tests/manifest.test.ts` pasan.

## Fase 3 — Pantallas

- [x] 9. Adaptar contenedores/cabeceras de notas, Cuentas y dashboard: sin
      wordmark duplicado, título Jost 21 px en móvil (Bodoni en `md:`), metadatos
      13 px `ash`. No se tocaron hooks ni lógica.
- [x] 10. Igual para Calendario y Perfil; `PageHeader` compartido; acceso al
      menú «Más» en la cabecera de Perfil.

## Fase 4 — Tests y verificación

- [x] 11. `tests/e2e/navigation.spec.ts` con Playwright (Pixel 7, Chromium):
      cuatro pestañas, `aria-current`, drawer y sin overflow a 390 px.
      `playwright.config.ts` + script `test:e2e`; Vitest excluye `tests/e2e`.
- [x] 12. `npm run lint && npm run typecheck && npm run test && npm run build`
      pasan (408 tests unitarios + 4 E2E con login real).
- [x] 13. Verificación de UI con Chrome MCP a 390×844: las siete capturas del
      flujo están en `specs/fundacion-movil/auditoria.md`; sin overflow ni
      contenido tapado.
- [x] 14. Auditoría con `design-audit` en `specs/fundacion-movil/auditoria.md`:
      dos P2 corregidos y reverificados. Quedan dos ítems no bloqueantes como
      follow-up (contraste/ foco con teclado y acceso «Más» en Fase 2).

## Fase 5 — Cierre documental (no en este PR de código)

- [x] 15. PR #45 mergeado por squash, rama borrada y CI de `main` verde.
- [x] 16. Cierre documental (PR `docs/cierre-fundacion-movil`): `cierre.md`,
      `MEMORY.md`, `CHANGELOG.md`, `README.md`, `docs/roadmap.md` y
      `npm run docs:check -- fundacion-movil`. La verificación en dispositivo real
      (iOS/Android) queda como follow-up en `cierre.md`; no se inventa evidencia.
