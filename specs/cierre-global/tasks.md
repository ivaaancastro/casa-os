# Tareas — Fase 6: Cierre y documentación global

> Especificación aprobada: [`spec.md`](spec.md). Enfoque: [`plan.md`](plan.md).
> Solo documentación; cualquier cambio de comportamiento se abre como `fix/*`.

## Fase 0 — Preparación

- [x] 1. Crear rama `feat/cierre-global` desde `main` y escribir `plan.md` + `spec.md`; aprobación del usuario (20 nov 2026).

## Fase 1 — Auditoría documental

- [x] 2. Obtener la lista de features con `cierre.md` (excluir `_template`) y ejecutar `npm run docs:check -- <feature>` para cada una, guardando la salida.
- [x] 3. Crear `specs/cierre-global/auditoria-docs.md` con la tabla de resultados (feature, PR, commit, ✅/❌) y el listado de specs anteriores al protocolo sin cierre, con su referencia en `CHANGELOG.md`/`MEMORY.md`.
- [x] 4. Corregir solo los fallos mecánicos que detecte `docs:check` (casillas, secciones o enlaces) y repetir la comprobación de esas features.

## Fase 2 — Documentos vivos

- [x] 5. Verificar/actualizar `MEMORY.md`: foco final, Fase 6 ✅, fecha y registro de features completo.
- [x] 6. Verificar/actualizar `docs/roadmap.md`, `CHANGELOG.md` (entrada de cierre global) y `README.md` (comandos y suites E2E).

## Fase 3 — Verificación real y producción

- [x] 7. Crear `docs/verificacion-movil-real.md` con la tabla por pestaña/flujo, dispositivo, resultado esperado y evidencia vacía; declarar explícitamente que el agente no la ejecutó.
- [x] 8. Repetir el smoke público (`/api/health`, `/auth/login`, `/`) y contrastar el commit de `main` con el desplegado; dejar el smoke autenticado como pendiente del propietario.

## Fase 4 — Verificación e integración

- [x] 9. Ejecutar `npm run lint && npm run typecheck && npm run test && npm run build && npm run test:e2e` y `npm run docs:check -- cierre-global`; corregir cualquier fallo.
- [x] 10. Escribir `specs/cierre-global/cierre.md` con resultados, evidencia y follow-ups honestos; commits atómicos, push, PR y CI en verde; squash merge y borrar rama.
- [x] 11. PR de cierre documental (si aplica), CI de `main` en verde y verificación final de que no quedan PRs abiertos.
