# Spec — Fase 6: Cierre y documentación global

**Estado:** aprobada el 2026-11-20
**Feature:** `cierre-global`
**Depende de:** Fases 1-5 del roadmap móvil, todas cerradas documentalmente

## Objetivo

Dejar el proyecto con la documentación coherente y verificable al final del
roadmap móvil: todos los cierres existentes revisados, los documentos vivos al
día, un checklist honesto para la verificación en dispositivo real y un registro
final de lo que sí y lo que no se pudo comprobar. Esta fase **no añade
funcionalidad**.

## Situación actual

| Hecho | Consecuencia en esta fase |
|---|---|
| 15 features del protocolo tienen `cierre.md` | Ejecutar `docs:check` en cada una y registrar el resultado |
| 10 specs son anteriores al protocolo y no tienen cierre | Documentar que ya están en `CHANGELOG.md`/`MEMORY.md`; no fabricar cierres |
| `docs:check` solo acepta un slug | Recorrer los 15 con un bucle y volcar la salida al informe |
| No hay iOS/Android ni credenciales del propietario aquí | La prueba real queda como checklist del propietario, no como evidencia del agente |
| `specs/cuentas-movil/cierre 2.md` es un duplicado ajeno sin commitear | No tocarlo; dejar constancia de su existencia |

## Requisitos funcionales

1. **RF1 — Auditoría de cierres.** Ejecutar `npm run docs:check -- <feature>`
   para las 15 features con `cierre.md` y guardar un registro con feature, PR,
   commit y resultado en `specs/cierre-global/auditoria-docs.md`. Si hay fallos
   mecánicos, corregirlos y repetir la comprobación.
2. **RF2 — Documentos vivos.** Revisar y, si falta, corregir `MEMORY.md`,
   `docs/roadmap.md`, `CHANGELOG.md` y `README.md` para que reflejen Fases 1-6,
   el registro de features, el foco final y los comandos de test (incluidas las
   cinco suites E2E). Añadir la entrada de la Fase 6 al `CHANGELOG.md`.
3. **RF3 — Checklist de móvil real.** Crear `docs/verificacion-movil-real.md`
   con una tabla por pestaña y flujo (Notas, Cuentas, Calendario, Dispositivos,
   Perfil/menú «Más»), gestos, resultado esperado, dispositivo (iOS Safari /
   Android Chrome) y evidencia vacía. Incluir los follow-ups: teclado virtual,
   Face ID/huella, lector de pantalla, contraste de `ash`, notificación push
   real y picker de archivos `.json`.
4. **RF4 — Honestidad de evidencia.** La guía y el `cierre.md` deben declarar
   explícitamente que el agente **no ejecutó** la verificación en dispositivo
   real ni el smoke autenticado en producción. No se marcarán como hechas esas
   comprobaciones ni se pedirá al usuario que verifique algo que el agente no
   verificó.
5. **RF5 — Smoke público.** Repetir `/api/health`, `/auth/login` y `/`, y
   contrastar el commit desplegado con `main`. Registrar fecha, HTTP y commit
   en el cierre. El smoke autenticado queda como pendiente del propietario.
6. **RF6 — Sin colateral.** No cambiar BD, migraciones, esquemas, API, auth,
   dependencias ni navegación. No rehacer auditorías de fases cerradas. No
   modificar el archivo ajeno `specs/cuentas-movil/cierre 2.md`.
7. **RF7 — Cierre de esta fase.** `specs/cierre-global/` con `plan.md`,
   `spec.md`, `tasks.md`, `auditoria-docs.md` y `cierre.md`; `docs:check --
   cierre-global` en verde y PR de cierre mergeado con CI de `main` verde.

## Requisitos no funcionales

- **Precisión**: cada resultado de `docs:check` se registra con el comando
  exacto; no se resume como «todo bien» sin la salida.
- **Trazabilidad**: cada corrección documental queda en un commit con mensaje
  que indique la feature afectada.
- **Alcance**: solo documentación; cualquier cambio de comportamiento debe
  abrir una feature/fix nueva.

## API / Endpoints

Ninguno nuevo. Solo se consultan las rutas públicas ya existentes
(`/api/health`, `/auth/login`, `/`).

## Modelo de datos

Ninguno.

## UI / UX

No aplica: no se modifica interfaz. La auditoría visual de las fases 1-5 queda
como evidencia histórica en sus respectivos `auditoria.md`.

## Criterios de aceptación

- [ ] `docs:check` pasa para las 15 features con cierre y se registra cada
      resultado en `specs/cierre-global/auditoria-docs.md`.
- [ ] `MEMORY.md`, `docs/roadmap.md`, `CHANGELOG.md` y `README.md` reflejan el
      estado final (Fase 6 ✅, foco cerrado, registro y comandos correctos).
- [ ] Existe `docs/verificacion-movil-real.md` con la tabla por pestaña y la
      declaración de «no ejecutado por el agente».
- [ ] El cierre de la Fase 6 registra smoke público con fecha/HTTP/commit y
      deja el smoke autenticado y la prueba real como pendientes honestos.
- [ ] No hay cambios en BD, API, auth, dependencias ni código de producto
      (revisión de diff).
- [ ] `specs/cuentas-movil/cierre 2.md` sigue sin commitear y sin modificar.
- [ ] `npm run lint && npm run typecheck && npm run test && npm run build &&
      npm run test:e2e` pasan.
- [ ] `npm run docs:check -- cierre-global` pasa.
- [ ] CI del PR en verde, squash merge, cierre documental y CI final de `main`.

## Decisiones aprobadas (2026-11-20)

El usuario aprobó la spec con la **opción A en las seis decisiones**. Se recogen
aquí con su resultado para trazabilidad.

### 1. Alcance de la Fase 6 → **A: cierre documental + checklist real** (aprobada)

- **A (aprobada)**: auditar docs, dejar la guía de prueba en móvil real y
  registrar lo no verificado. Cierra el roadmap sin inventar evidencia.
- **B**: reabrir follow-ups de fases anteriores (espaciado, preview largo,
  jerarquía del título). Son features/fix nuevos y rompen «una feature a la vez».

### 2. Cómo auditar los cierres → **A: usar `docs:check` por feature** (aprobada)

- **A (aprobada)**: recorrer las 15 features con el script existente y volcar
  la salida a `auditoria-docs.md`. Sin código nuevo.
- **B**: añadir un script `docs:check:all`. Comodidad futura, pero amplía el
  alcance y requiere tests de un script que hoy no es necesario.

### 3. Specs anteriores al protocolo → **A: documentar, no recrear** (aprobada)

- **A (aprobada)**: dejar constancia de que 10 specs no tienen cierre porque
  son previas al protocolo y que sus entregas están en `CHANGELOG.md`/`MEMORY.md`.
- **B**: escribir cierres retroactivos. No hay evidencia verificable de PRs,
  CI ni deployments de esas entregas; sería documentación inventada.

### 4. Verificación en móvil real → **A: checklist del propietario** (aprobada)

- **A (aprobada)**: `docs/verificacion-movil-real.md` con pasos y evidencia
  vacía, declarando que el agente no la ejecutó. El usuario la completa cuando
  tenga los dispositivos.
- **B**: darla por hecha con la emulación de Chromium de las fases 1-5. No es
  cierto: emular 390×844 no sustituye a iOS Safari ni a Android Chrome.

### 5. Revisión de documentos vivos → **A: corregir lo que falte** (aprobada)

- **A (aprobada)**: tocar solo `MEMORY.md`, `docs/roadmap.md`, `CHANGELOG.md`
  y `README.md`, además de correcciones mecánicas detectadas por `docs:check`.
- **B**: reescribir todas las specs y cierres para unificar estilo. Riesgo alto
  y poco valor: cada cierre ya fue revisado en su PR.

### 6. Archivo ajeno `cierre 2.md` → **A: no tocarlo y documentarlo** (aprobada)

- **A (aprobada)**: dejarlo sin commitear y mencionarlo en el cierre global
  como artefacto pendiente de revisión del propietario.
- **B**: borrarlo. Es trabajo ajeno al agente; no se elimina sin confirmación.

## Supuestos

- La propietaria/o ejecutará la guía de móvil real cuando tenga los
  dispositivos; el agente no la ejecuta ni la marca como hecha.
- No hay credenciales de producción en el entorno del agente para el smoke
  autenticado; se mantiene el registro de las fases anteriores.
- El PWA sigue instalable desde «Añadir a pantalla de inicio»; no se publica en
  tiendas.
- Cualquier cambio de comportamiento detectado durante esta auditoría se abre
  como `fix/*` nuevo, no se mezcla con la Fase 6. Cualquier hallazgo de esta
  auditoría se registra en el informe, no se corrige cambiando comportamiento.
