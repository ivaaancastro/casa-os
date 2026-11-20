# Tareas — Fase 4: Calendario móvil + panel de avisos

> Especificación aprobada: [`spec.md`](spec.md). Enfoque: [`plan.md`](plan.md).
> Una sola feature activa; verificación doble antes de PR y cierre documental.

## Fase 0 — Preparación

- [x] 1. Crear rama `feat/calendario-movil` desde `main` y escribir `plan.md` + `spec.md`; aprobación del usuario (20 nov 2026).

## Fase 1 — Arquitectura de vistas y breakpoint

- [x] 2. Unificar el breakpoint: reutilizar/mover `useIsMobile()` de Notas (`matchMedia('(max-width: 1023px)')`) y eliminar el hook local de 767 px de `CalendarApp.tsx`. Sin cambios en la lógica de eventos.
- [x] 3. Extraer el marcado actual de `CalendarApp.tsx` a `CalendarDesktopView.tsx` (rejilla de mes, semana en columnas, toolbar, agenda lateral) sin cambios funcionales; `CalendarApp` queda como dueño del estado.
- [x] 4. Crear `CalendarMobileView.tsx` con la toolbar de una fila (Mes/Semana, Hoy, Avisos), el título temporal y el selector de vista; `CalendarApp` elige móvil/escritorio con `useIsMobile()` y monta un solo árbol.

## Fase 2 — Mes, semana y agenda táctiles

- [x] 5. Extraer la lógica pura de chips a `src/lib/utils/calendar-chips.ts` (p. ej. `eventsForDay` con límite de 2 + contador) y añadir `tests/calendar-chips.test.ts` con casos: sin eventos, 1, 2, más de 2, todo el día, eventos que cruzan medianoche y orden por hora.
- [x] 6. Adaptar `MonthView.tsx` (o crear `MonthViewMobile.tsx`) con celdas ≥ 44 px, hasta 2 chips con título truncado y «+N más»; conservar lunes primero, 42 celdas y `aria-label` «Abrir el día…». Sin `monthGrid` nuevo.
- [x] 7. Adaptar `WeekView.tsx` para móvil: 7 tarjetas de día con chips de evento y botón «+» ≥ 44 px que abre el alta del día; conservar los `aria-label` actuales y la vista de columnas en escritorio.
- [x] 8. Implementar en móvil «tocar día → agenda del día con chips ≥ 44 px → tocar chip → detalle», manteniendo el tap de escritorio (abre alta) y el deep link `?date=YYYY-MM-DD` (`dateFromKey`/`dateKey`).

## Fase 3 — Creación y paneles táctiles

- [x] 9. Añadir el FAB cuadrado (+) en `CalendarMobileView` sobre la tab bar y `env(safe-area-inset-bottom)`; abre `EventPanel` en modo alta para el día seleccionado (o hoy), reutilizando `POST /api/events`. Añadir `padding-bottom` a la lista.
- [x] 10. Adaptar `EventPanel.tsx` con prop `mobile`: hoja inferior mediante el `createPortal` a `body` ya existente, ancho completo, `padding-bottom` con zona segura, campos en una columna, botones pegajosos ≥ 44 px y `aria-label` en cerrar. Escritorio intacto; no tocar `eventInputSchema`.
- [x] 11. Adaptar `ReminderPanel.tsx` con la misma hoja inferior y un botón «Avisos» ≥ 44 px en la toolbar móvil. Conservar VAPID, suscripción, estados iOS/producción, `role="status"`/`alert` y enlaces `?date=`. Sin tocar API ni service worker.
- [x] 12. Añadir en `src/app/globals.css` reglas móviles para `.date-nav`, botones de vista/nav, chips de mes/agenda y acciones de panel con objetivo ≥ 44 px (CSS global: los paneles se crean por portal). Revisar que no haya desbordamiento a 390 px.

## Fase 4 — Accesibilidad y pulido

- [x] 13. Revisar a 390 px: foco visible de 2 px, `aria-pressed` en Mes/Semana, `aria-current`/`aria-label` en días y navegación, `aria-busy` en carga, `prefers-reduced-motion` respetado, paleta cerrada y rojo `alarm` solo en error/eliminación.
- [x] 14. Verificar que los permisos (FAMILY crea, solo creador/ADMIN edita/borra) y los mensajes de error del panel móvil coinciden con el escritorio; sin atajos nuevos.

## Fase 5 — Verificación

- [x] 15. Crear `tests/e2e/calendario-movil.spec.ts` con login real (Pixel 7/Chromium, `globalSetup` y `workers: 1`): entrada a Mes con chips, navegación y cambio de vista, tap en día → agenda, alta con FAB, edición/borrado, deep link `?date=`, apertura del panel Avisos, objetivos ≥ 44 px y sin overflow. Crear `tests/e2e/helpers/events-setup.ts` con fixtures `e2e-*` y limpieza.
- [x] 16. Ejecutar `npm run lint && npm run typecheck && npm run test && npm run build` y `npm run test:e2e`; corregir cualquier fallo antes de continuar.
- [x] 17. Verificar los estados del panel Avisos con build de producción (`next build && next start`) para que el SW se registre, sin reclamar una notificación real no ejecutable aquí; remitir a `specs/recordatorios/cierre.md`.
- [x] 18. Verificar UI con Chrome MCP a 390×844 y auditoría con la skill `design-audit`: capturas de mes, agenda, semana, formulario y avisos; corregir y reverificar hallazgos; guardar informe en `specs/calendario-movil/auditoria.md`.

## Fase 6 — Integración y cierre

- [ ] 19. Commits atómicos en español (Conventional Commits), push de `feat/calendario-movil`, PR con referencia a la spec y CI en verde; squash merge y borrar rama.
- [ ] 20. Cierre documental (Fase A y B de `AGENTS.md`): borrador de `cierre.md`, `CHANGELOG.md`, `README.md`, `docs/*`, `MEMORY.md`, verificación de producción, `npm run docs:check -- calendario-movil`, PR `docs/cierre-calendario-movil` y CI de `main` en verde.
