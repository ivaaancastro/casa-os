# Tareas — Fase 5: Dispositivos y red en móvil

> Especificación aprobada: [`spec.md`](spec.md). Enfoque: [`plan.md`](plan.md).
> Una sola feature activa; verificación doble antes de PR y cierre documental.

## Fase 0 — Preparación

- [x] 1. Crear rama `feat/dispositivos-movil` desde `main` y escribir `plan.md` + `spec.md`; aprobación del usuario (20 nov 2026).

## Fase 1 — Arquitectura de vistas

- [x] 2. Convertir `DeviceManager.tsx` en `DeviceLayout.tsx` (dueño de `error`, `pending`, `creating`, `importingScan`, `editingId`, `confirmingId`) usando el hook compartido `useIsMobile()` y extrayendo el marcado actual a `DeviceDesktopView.tsx`. Sin cambios funcionales.
- [x] 3. Crear `DeviceMobileView.tsx` con la lista de tarjetas en una columna, `data-testid="devices-mobile-list"`, acciones ≥ 44 px, `padding-bottom` para la tab bar y el aviso de frescura; `DeviceLayout` monta una sola vista por breakpoint.
- [x] 4. Añadir los tipos compartidos (`DeviceViewProps`) y conservar `isAdmin`/FAMILY en ambas vistas; sin FAB ni acciones de escritura para FAMILY.

## Fase 2 — FAB y hoja de acciones

- [x] 5. Crear `DeviceActionSheet.tsx`: FAB (+) portalado a `body` tras `mounted` (patrón de `CalendarMobileView`) sobre la tab bar y la zona segura, que abre una hoja de acciones «Añadir dispositivo» / «Importar escaneo»; solo ADMIN. Verificar que no se ancla al wrapper `animate-fade-rise`.

## Fase 3 — Formulario e importación táctiles

- [x] 6. Adaptar `DeviceForm` en `DeviceManager.tsx` (o extraer a `DeviceForm.tsx`) con prop `mobile`: hoja inferior portalada (`role="dialog"`, `aria-modal`, `data-mobile-panel`, scrim, Escape, foco, bloqueo de scroll, safe-area), campos apilados y acciones pegajosas ≥ 44 px; escritorio inline intacto. No tocar `createDeviceSchema`/`updateDeviceSchema`.
- [x] 7. Adaptar `ScanImportPanel.tsx` con prop `mobile`: hoja inferior con `data-testid="devices-mobile-scan-preview"`, file input y checkboxes ≥ 44 px, resumen y «Estado tras aplicar» intactos, acciones pegajosas; escritorio en `card`. No tocar el flujo `dryRun`/preview/deduplicación ni los schemas.
- [x] 8. Añadir «Copiar comando» junto al `<code>` del escaneo: `navigator.clipboard.writeText` con fallback y resultado anunciado con `role="status"`. Reforzar el texto de que `nmap` corre en un ordenador de casa y el JSON se elige desde el móvil. Sin campo para pegar JSON ni botón «Escanear».

## Fase 4 — Accesibilidad y pulido

- [x] 9. Añadir en `src/app/globals.css` reglas móviles (`@media (max-width: 1023px)`) para botones de lista, `.btn`, `.input`, file input y checkboxes ≥ 44 px, además de `[data-mobile-panel] .panel-actions` pegajosas (patrón ya existente).
- [x] 10. Poner `font-ui` explícito en el `<h1>` de `src/app/devices/page.tsx` y en los títulos de las hojas móviles; revisar a 390 px foco visible, `aria-live`, `prefers-reduced-motion`, paleta cerrada y sin desbordamiento horizontal.

## Fase 5 — Verificación

- [x] 11. Crear `tests/e2e/helpers/devices-setup.ts` con fixtures deterministas (ids/IPs/MACs fijos, upsert y limpieza; cuidado con 409 por unicidad) y un JSON de escaneo de prueba. Crear `tests/e2e/dispositivos-movil.spec.ts` con login real: entrada a lista, alta, edición, borrado en dos pasos, importación preview→aplicar, visibilidad FAMILY, «Copiar comando», objetivos ≥ 44 px y sin overflow.
- [x] 12. Ejecutar `npm run lint && npm run typecheck && npm run test && npm run build` y `npm run test:e2e`; corregir cualquier fallo antes de continuar.
- [x] 13. Verificar UI con Chrome MCP a 390×844 y auditoría con la skill `design-audit`: capturas de lista, alta/edición, importación y vista FAMILY; corregir y reverificar hallazgos; guardar informe en `specs/dispositivos-movil/auditoria.md`.

## Fase 6 — Integración y cierre

- [x] 14. Commits atómicos en español (Conventional Commits), push de `feat/dispositivos-movil`, PR con referencia a la spec y CI en verde; squash merge y borrar rama.
- [x] 15. Cierre documental (Fase A y B de `AGENTS.md`): borrador de `cierre.md`, `CHANGELOG.md`, `README.md`, `docs/*`, `MEMORY.md`, verificación de producción, `npm run docs:check -- dispositivos-movil`, PR `docs/cierre-dispositivos-movil` y CI de `main` en verde.
