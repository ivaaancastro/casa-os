# Cierre — Fase 6: Cierre y documentación global

**Estado:** cerrada
**Fecha:** 2026-11-20
**Feature:** `cierre-global`
**Rama:** `feat/cierre-global` (borrada tras el merge)

## Resumen

Cierre final del roadmap móvil: se auditaron los 15 cierres del protocolo con
`docs:check` (todos en verde), se dejaron al día los documentos vivos y se creó
una guía para que el propietario complete la verificación en iOS/Android real.
Esta fase **no añadió funcionalidad**: cualquier cambio de comportamiento
detectado se registra como follow-up y se abriría como `fix/*`.

## Alcance entregado

- `specs/cierre-global/`: `plan.md`, `spec.md`, `tasks.md`,
  `auditoria-docs.md` y este `cierre.md`.
- `docs/verificacion-movil-real.md`: checklist por pestaña con evidencia vacía
  y declaración explícita de que el agente **no la ejecutó**.
- `MEMORY.md`, `docs/roadmap.md`, `CHANGELOG.md` y `README.md` actualizados al
  estado final: Fases 1-6 ✅, foco cerrado y guía enlazada.

## Cambios principales

| Área | Archivos | Qué cambió |
|---|---|---|
| Auditoría | `specs/cierre-global/auditoria-docs.md` | Resultado de `docs:check` para las 15 features y listado de las 10 previas al protocolo |
| Guía | `docs/verificacion-movil-real.md` | Tablas de prueba en iOS/Android, follow-ups acumulados y registro de evidencia vacío |
| Docs vivos | `MEMORY.md`, `docs/roadmap.md`, `CHANGELOG.md`, `README.md` | Fase 6 ✅, foco final, entrada de cierre global y enlace a la guía |

No hubo cambios en BD, migraciones, esquemas, API, auth, dependencias ni código
de producto.

## Verificación

### Código y tests

| Comando | Resultado |
|---|---|
| `npm run lint` | OK (sin warnings) |
| `npm run typecheck` | OK |
| `npm run test` | OK — 443 tests en 36 ficheros |
| `npm run build` | OK — todas las rutas generadas |
| `npm run test:e2e` | OK — 26/26 con login real (5 suites: navegación, Cuentas, Notas, Calendario, Dispositivos) |
| `npm run docs:check -- <feature>` | OK — 15/15 features con cierre, sin correcciones mecánicas |
| `npm run docs:check -- cierre-global` | OK |
| CI del PR #55 | OK — `quality`, `build`, `test` y Vercel en verde (`44746049730`) |
| CI de `main` tras el merge | OK — `44746294719` en verde (`quality`, `build`, `test`) |

### Producción

| Campo | Valor |
|---|---|
| URL | <https://casa-os-mauve.vercel.app> |
| PR / commit de la feature | #55 / `1c9fc7b` |
| Commit de `main` verificado antes del cierre | `94d85d9` (contenido idéntico en código; el merge #55 solo añadió documentación) |
| Deployment | `B16pSoS9aJQVmPqxMew1wLzJ8sdA` (success para `94d85d9`); deployment del commit `1c9fc7b` en curso al escribir este cierre, `KiLT46TCieLg3GkHwJoyRXZFGDJ3` |
| Health | `200` — `{"status":"ok","db":"ok","timestamp":"2026-11-20T13:41:08.659Z"}`; antes, `200` en `13:31:33`, `13:31:48` y `13:40:13`, y una `503` (`db:error`) en `13:31:12` |
| Rutas | `/auth/login` → `200`, `/` → `307` |
| Smoke autenticado | **No ejecutado**: no hay credenciales del propietario en este entorno. Se verificó con login real en local en las Fases 1-5. Queda pendiente del propietario. |

**Incidente observado:** a las `13:31:12Z` el health devolvió `503` con
`db:error`; a las `13:31:33Z` y `13:31:48Z` devolvió `200` con `db:ok`, sin
cambios de código entre medias. Se registra como fallo transitorio de la base
gestionada (Neon) y no se oculta. Si se repite, abrir un `fix/*` de
infraestructura/monitorización; no se marca como resuelto definitivamente.

### Verificación no ejecutada

- **Móvil real (iOS Safari / Android Chrome)**: guía preparada en
  `docs/verificacion-movil-real.md`; evidencia vacía. El agente no tiene
  dispositivos y no la ha marcado como hecha.
- **Notificación push real al SO**, **Face ID/huella**, **teclado virtual**,
  **lector de pantalla** y **picker de archivos `.json`** en móvil: quedan como
  comprobaciones del propietario, con sus capturas.

## Documentación actualizada

- [x] `MEMORY.md`: Fase 6 ✅, foco final, fecha y registro completo de features.
- [x] `docs/roadmap.md`: Fase 6 ✅.
- [x] `CHANGELOG.md`: entrada de cierre global.
- [x] `README.md`: guía de verificación móvil real enlazada.
- [x] `spec.md` y `plan.md`: decisiones aprobadas y criterios verificados.
- [x] `tasks.md`: 11/11 tareas completadas, sin casillas pendientes.
- [x] `AGENTS.md`: no aplica (no cambian las reglas del arnés).
- [x] `npm run docs:check -- cierre-global` pasa.

## Tareas

### Completadas

- Fase 0 — rama y documentos de spec (1).
- Fase 1 — auditoría de los 15 cierres y registro de resultados (2-4).
- Fase 2 — documentos vivos al día (5-6).
- Fase 3 — guía de móvil real y smoke público (7-8).
- Fase 4 — verificación final e integración (9-11).

### Pendientes / follow-ups

- **Verificación en móvil real**: la completa el propietario con la guía;
  mientras tanto no se da por probada.
- **Smoke autenticado en producción**: pendiente del propietario (sin
  credenciales aquí).
- **Health transitorio**: un `503 db:error` seguido de `200`; vigilar Neon y
  abrir `fix/*` si se repite.
- **Archivo ajeno**: `specs/cuentas-movil/cierre 2.md` sigue sin commitear y no
  se ha tocado; queda a revisión del propietario.
- **10 specs anteriores al protocolo**: sin `cierre.md` por decisión 3 = A;
  sus entregas están en `CHANGELOG.md`/`MEMORY.md`.
- **Backlog**: buscador global, papelera/exportación, roles granulares,
  auditoría de cambios y OAuth opcional. Si vuelve el fallo intermitente de
  `next/font/google`, valorar fuentes autoalojadas.

## Decisiones y lecciones

- Las seis decisiones se aprobaron con la opción A: cierre documental + guía
  real, `docs:check` por feature, no recrear cierres antiguos, checklist del
  propietario, corregir solo lo que falte y no tocar el archivo ajeno.
- Los 15 cierres del protocolo estaban ya correctos: la auditoría no encontró
  casillas ni enlaces rotos. El valor estuvo en comprobarlo y registrarlo.
- Un `503` transitorio en producción obliga a repetir la medición antes de
  decidir, pero también a dejar constancia del fallo: no se puede presentar un
  health limpio como si no hubiera ocurrido.
- Cerrar el roadmap no equivale a haber probado en dispositivos reales: la guía
  separa claramente lo verificado del agente y lo pendiente del propietario.
- Durante la verificación final, un servidor `next dev` dejado vivo mientras se
  ejecutaba `next build` corrompió artefactos de `.next` y los E2E no arrancaron.
  No era un fallo de código: se limpió `.next` y los 26 E2E pasaron. Conviene
  detener el dev antes de build/E2E.

## Riesgos residuales

- La experiencia en iOS/Android real puede revelar problemas que Chromium no
  muestra (teclado, safe-area, permisos de notificación, biometría).
- La base gestionada tuvo un fallo breve; sin monitorización propia no se puede
  afirmar que no volverá.
- El smoke autenticado en producción sigue sin evidencia en este entorno.

## Checklist de cierre

- [x] El PR de la feature (#55) está mergeado (squash) y la rama borrada.
- [x] El CI de `main` está verde tras el merge (`44746294719`).
- [x] Producción desplegada y verificada; el smoke autenticado está documentado
      como no ejecutable en este entorno.
- [x] `tasks.md` no tiene casillas pendientes.
- [x] `cierre.md` no tiene casillas pendientes.
- [x] `MEMORY.md` enlaza este cierre y tiene el registro actualizado.
- [x] `CHANGELOG.md`, `README.md` y `docs/*` están al día.
- [x] `npm run docs:check -- cierre-global` pasa.
- [x] El PR de cierre tiene el CI verde (se verifica en el PR antes del merge).
