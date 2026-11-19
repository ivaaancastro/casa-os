# Tareas — Fase 3: Notas móvil

> Especificación aprobada: [`spec.md`](spec.md). Enfoque: [`plan.md`](plan.md).
> Una sola feature activa; verificación doble antes de PR y cierre documental.

## Fase 0 — Preparación

- [x] 1. Crear rama `feat/notas-movil` desde `main` y escribir `plan.md` + `spec.md`; aprobación del usuario (19 nov 2026).

## Fase 1 — Lógica de filtrado y arquitectura de vistas

- [x] 2. Extraer el filtrado de `NotesLayout` a `src/lib/utils/note-filter.ts`: `filterNotes(notes, { folder, query })` y el mapeo tipo → carpeta (`FolderFilter`). Sin cambiar la semántica actual (título + contenido, `createdAt` desc).
- [x] 3. Añadir `tests/note-filter.test.ts` con casos: todas, cada carpeta, búsqueda por título, por contenido, combinado, sin resultados y orden.
- [x] 4. Crear `src/components/notes/useIsMobile.ts` (`matchMedia('(max-width: 1023px)')`, valor inicial `false` en servidor, sincronización en `mount`, cleanup del listener).
- [x] 5. Extraer el marcado actual de `NotesLayout` a `NotesDesktopView.tsx` (sidebar + lista + editor) sin cambios funcionales; `NotesLayout` queda como dueño del estado.

## Fase 2 — Lista móvil (entrada por defecto)

- [x] 6. Crear `NotesMobileView.tsx` con cabecera Jost 21 px + contador «N notas» en `ash` 13 px; `NotesLayout` elige móvil/escritorio con `useIsMobile()` y monta un solo árbol.
- [x] 7. Crear `FolderChips.tsx`: chips `Todas`/`Compra`/`General`/`Pendientes` en fila con scroll horizontal, activo en `ink`, contador por carpeta, objetivo ≥ 44 px y `aria-pressed`.
- [x] 8. Crear buscador fijo «Buscar notas» con `aria-label`, conectado a `filterNotes`; estados «Sin resultados» / «No hay notas» y sin peticiones por pulsación.
- [x] 9. Adaptar `NoteItem.tsx` para la lista móvil: fila ≥ 64 px, título + preview + fecha relativa, selección sobria (sin bloque de color), `aria-current` cuando aplica.

## Fase 3 — Editor móvil y creación rápida

- [x] 10. Añadir prop `compact?: boolean` a `Toolbar.tsx`: en móvil una sola fila (negrita, lista, lista de tareas, color) y botón «Más formato» que despliega el toolbar completo en panel en flujo; escritorio sin cambios (`compact = false`).
- [x] 11. Crear `NoteEditorMobile.tsx` (o adaptar `NoteEditor` con prop `mobile`): cabecera «← Notas» + estado «Guardando…/Guardado» + acciones «completar» y borrar con confirmación; conserva foco, guardado con debounce y pie «Creada por…».
- [x] 12. «Volver» regresa a la lista conservando `activeFolder`, `searchQuery` y scroll; sin recarga ni refetch. El FAB cuadrado (+) crea el borrador y abre el editor con foco en el título.
- [x] 13. Colocar el FAB por encima de la tab bar y de `env(safe-area-inset-bottom)`; añadir `padding-bottom` a la lista para que la última fila no quede tapada.

## Fase 4 — Checklist, accesibilidad y pulido

- [x] 14. Añadir en `src/app/globals.css` reglas móviles para casillas de `TaskList` y botón «completar» con objetivo ≥ 44 px y estado completado visible (CSS global: TipTap crea DOM fuera de React).
- [x] 15. Revisar a 390 px: sin desbordamiento horizontal, foco visible en controles nuevos, `role="status"`/`aria-live` en guardado/errores, `prefers-reduced-motion` respetado y rojo `alarm` solo en borrado/error.

## Fase 5 — Verificación

- [x] 16. Crear `tests/e2e/notas-movil.spec.ts` con login real (Pixel 7/Chromium, `globalSetup` y `workers: 1`): entrada a lista, búsqueda, filtro por carpeta, abrir nota y volver, crear con FAB, marcar tarea.
- [x] 17. Ejecutar `npm run lint && npm run typecheck && npm run test && npm run build` y `npm run test:e2e`; corregir cualquier fallo antes de continuar.
- [x] 18. Verificar UI con Chrome MCP a 390×844 y auditoría con la skill `design-audit`: capturas de lista, búsqueda/filtros, editor, creación y checklist; corregir y reverificar hallazgos; guardar informe en `specs/notas-movil/auditoria.md`.

## Fase 6 — Integración y cierre

- [x] 19. Commits atómicos en español (Conventional Commits), push de `feat/notas-movil`, PR con referencia a la spec y CI en verde; squash merge y borrar rama.
- [x] 20. Cierre documental (Fase A y B de `AGENTS.md`): borrador de `cierre.md`, `CHANGELOG.md`, `README.md`, `docs/*`, `MEMORY.md`, verificación de producción, `npm run docs:check -- notas-movil`, PR `docs/cierre-notas-movil` y CI de `main` en verde.
