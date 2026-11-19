# Cierre — Fase 3: Notas móvil

**Estado:** cerrada
**Fecha:** 2026-11-19
**Feature:** `notas-movil`
**Rama:** `feat/notas-movil` (borrada tras el merge)

## Resumen

Se entrega `/notas` como pantalla de uso con una mano: entrar muestra la lista,
el buscador y las carpetas quedan a la vista, un FAB crea notas de un toque y el
editor se apila con un toolbar compacto y un checklist táctil. Se reutilizan el
editor TipTap, la API y el modelo de datos existentes; el escritorio conserva su
layout. Es la Fase 3 del roadmap móvil-first.

## Alcance entregado

- Lista por defecto con preview y fecha relativa, buscador fijo local y chips de
  carpetas con contadores.
- FAB cuadrado sobre la tab bar; editor apilado con «← Notas» que conserva
  filtro, búsqueda y scroll al volver.
- Toolbar compacta de una fila con «Más formato» (panel en flujo con el toolbar
  completo); acciones y casillas con objetivos ≥ 44 px.
- Una sola vista montada por breakpoint (`useIsMobile`), sin dos editores TipTap
  simultáneos; escritorio intacto.
- Filtro de notas extraído a función pura y testeada; E2E con login real y
  auditoría visual con capturas.

## Cambios principales

| Área | Archivos | Qué cambió |
|---|---|---|
| Vistas | `NotesLayout.tsx`, `NotesDesktopView.tsx`, `NotesMobileView.tsx`, `useIsMobile.ts`, `FolderChips.tsx` | Estado centralizado, una vista por breakpoint, lista-first y FAB. |
| Editor | `NoteEditor.tsx`, `Toolbar.tsx`, `NoteItem.tsx`, `globals.css` | Toolbar compacta, botones/casillas de 44 px, guardado al volver y correcciones de creación. |
| Lógica | `src/types/note.ts`, `src/lib/utils/note-filter.ts` | Tipo compartido, `filterNotes()` y `countByFolder()` puros. |
| Tests | `tests/note-filter.test.ts`, `tests/e2e/notas-movil.spec.ts`, `tests/e2e/helpers/notes-setup.ts` | 11 tests unitarios nuevos y 6 E2E con fixtures deterministas. |
| Docs | `specs/notas-movil/*`, `MEMORY.md`, `CHANGELOG.md`, `README.md`, `docs/roadmap.md` | Spec aprobada, tareas, auditoría y registro de la entrega. |

## Verificación

### Código y tests

| Comando | Resultado |
|---|---|
| `npm run lint` | OK (sin warnings) |
| `npm run typecheck` | OK |
| `npm run test` | OK — 436 tests en 35 ficheros |
| `npm run build` | OK — todas las rutas generadas |
| `npm run test:e2e` | OK — 11/11 con login real (Pixel 7 / Chromium), 6 nuevos de Notas |
| CI del PR #49 | OK — `quality`, `build`, `test` y Vercel en verde (`44614158486`) |
| CI de `main` tras el merge | OK — `44614387032` en verde (`quality`, `build`, `test`) |

### UI / Chrome

- Navegador y viewport: Chromium (Chrome MCP), 390×844, sesión real contra BD
  local sembrada.
- Flujos comprobados: lista → búsqueda → filtros → editor → «Más formato» →
  volver → crear con FAB → checklist.
- Consola: sin errores en las capturas finales; solo el aviso conocido de
  TipTap/`immediatelyRender` con Next.js 14.
- Responsive: sin desbordamiento horizontal a 390 px (E2E + capturas).
- Evidencia: 9 capturas referenciadas en [`auditoria.md`](auditoria.md). Tres
  hallazgos corregidos y reverificados (etiqueta «Más» recortada, «×» azul del
  buscador y franjas de scroll).

### Producción

| Campo | Valor |
|---|---|
| URL | <https://casa-os-mauve.vercel.app> |
| Deployment | `6pfkjtUCoNwD9jZ8sVEKmVyYn9kr` (estado `success` en GitHub status; la API de Vercel no se consultó por falta de token). Preview del PR: `Ecpu3WSquEw4f53TXVGVfncQKWq9` |
| Commit | `fb4e0c8` (merge squash del PR #49) |
| Health | `200` — `{"status":"ok","db":"ok","timestamp":"2026-11-19T21:01:51.174Z"}` verificado tras el merge |
| Rutas | `/auth/login` → `200`, `/` → `307` |
| Smoke autenticado | No ejecutado en producción: no hay credenciales válidas del propietario en este entorno. Se verificó con login real en local (BD sembrada). Lo confirma el propietario con sus credenciales. |

## Documentación actualizada

- [x] `MEMORY.md`: Fase 3 ✅, registro del PR #49, foco en Fase 4, notas técnicas y lecciones.
- [x] `CHANGELOG.md`: entrada de la Fase 3.
- [x] `README.md`: E2E de Notas incluido en la descripción de `test:e2e`.
- [x] `docs/roadmap.md`: Fase 3 ✅ y Fase 4 como siguiente.
- [x] `spec.md` y `plan.md`: decisiones aprobadas y criterios verificados.
- [x] `tasks.md`: 20/20 tareas completadas, sin casillas pendientes.
- [x] `AGENTS.md`: no aplica (no cambian las reglas del arnés).
- [x] `npm run docs:check -- notas-movil` pasa.

## Tareas

### Completadas

- Fase 0 — rama y documentos de spec (1).
- Fase 1 — filtrado puro, tipo compartido y hook de breakpoint (2–5).
- Fase 2 — vista móvil, chips y lista (6–9).
- Fase 3 — editor móvil, toolbar y FAB (10–13).
- Fase 4 — checklist, accesibilidad y pulido (14–15).
- Fase 5 — E2E, verificaciones, Chrome MCP y auditoría (16–18).
- Fase 6 — PR #49 mergeado, CI verde y cierre documental (19–20).

### Pendientes / follow-ups

- **Jerarquía del título en notas nuevas**: la primera línea nace como `<p>` y
  usa Jost, frente al `<h1>` Bodoni de notas antiguas. Inicializar el borrador
  con `<h1></h1>` provocó `RangeError` en TipTap v3; se revirtió y queda para
  investigar. Afecta solo a estética, no al guardado (`auditoria.md`, hallazgo P3).
- **Dispositivo real**: no hay iOS/Android en este entorno; repetir la revisión
  con teclado virtual, Face ID/huella de Fase 2 y lector de pantalla.
- **Accesibilidad específica**: orden de lectura del editor apilado, foco al
  cerrar «Más formato» y contraste de `ash` a 13 px requieren prueba con
  teclado/lector (igual que en Fases 1 y 2).
- **«Más» fuera de Perfil**: decisión 5 aprobada = mantenerlo solo en Perfil;
  follow-up cerrado con esa decisión, sin cambios en la navegación de Fase 1.
- **CI intermitente de `next/font/google`**: no se repitió en esta fase; si
  vuelve, valorar `next/font/local` en una feature separada.
- **BD local de desarrollo**: arrastra notas de pruebas de sesiones anteriores;
  los E2E usan `ensureNotesForE2E()` con ids fijos para no depender de ese estado.

## Decisiones y lecciones

- Las seis decisiones de la spec se aprobaron con la opción A: lista por
  defecto, FAB en la lista, toolbar compacta con panel, chips de carpetas,
  «Más» solo en Perfil y checklist sin modelo nuevo.
- Un solo editor por breakpoint: montar dos vistas con CSS habría duplicado ids
  y efectos de TipTap.
- El borrador no debe recargarse desde el servidor al convertirse en nota real;
  además, `createdRef` se marca antes del POST para evitar duplicados en
  desarrollo y el guardado pendiente se vuelca al desmontar.
- La corrección visual más visible fue cambiar «Más formato» por «Más» en la
  barra compacta: con «completar» y borrar presentes, la etiqueta larga se
  recortaba.

## Riesgos residuales

- El teclado virtual del móvil podría tapar parte del editor; no se pudo probar
  en Chromium de escritorio.
- La primera línea de una nota recién creada no usa la misma tipografía que las
  notas antiguas (follow-up estético documentado).
- En `/` (Dashboard) sigue sin haber pestaña activa, coherente con la decisión
  de cuatro pestañas de Fase 1.

## Checklist de cierre

- [x] El PR de la feature (#49) está mergeado (squash) y la rama borrada.
- [x] El CI de `main` está verde tras el merge (`44614387032`).
- [x] Producción desplegada y verificada; el smoke autenticado está documentado
      como no ejecutable en este entorno.
- [x] `tasks.md` no tiene casillas pendientes.
- [x] `cierre.md` no tiene casillas pendientes.
- [x] `MEMORY.md` enlaza este cierre y tiene el registro actualizado.
- [x] `CHANGELOG.md`, `README.md` y `docs/*` están al día.
- [x] `npm run docs:check -- notas-movil` pasa.
- [x] El PR de cierre tiene el CI verde (se verifica en el PR antes del merge).
