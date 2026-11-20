# Plan — Fase 6: Cierre y documentación global

## Contexto

El roadmap (`MEMORY.md` → *Fase 6*) pide dos cosas: tener el `cierre.md` de
cada fase al día con `MEMORY.md` y `docs/roadmap.md` actualizados, y verificar
la app en móvil real (iOS + Android). Las Fases 1-5 ya se cerraron una a una con
sus PRs de cierre y sus `docs:check` en verde; esta fase es la **auditoría
final del conjunto**, no una feature nueva de producto.

Estado observado al preparar la spec:

- Hay **16 `cierre.md`** (15 features del protocolo + la plantilla). Todos
  pertenecen a features cerradas con PR mergeado.
- Hay **10 directorios de specs anteriores al protocolo** sin `cierre.md`
  (`auth-layout`, `postgres`, `pwa-instalable`, `rediseno-inditex`, …). Sus
  entregas ya están resumidas en `CHANGELOG.md` y en el *Registro de features*
  de `MEMORY.md`. No se debe fabricar evidencia retroactiva.
- `docs:check` comprueba una feature por vez (archivos, casillas, secciones y
  enlace desde `MEMORY.md`); no existe un comando global.
- La verificación en **dispositivo real** no es ejecutable en este entorno:
  no hay iOS/Android, no hay credenciales del propietario para el smoke
  autenticado en producción y no se puede dar por hecha sin evidencia.
- Existe un archivo ajeno sin commitear, `specs/cuentas-movil/cierre 2.md`,
  duplicado exacto de `cierre.md`. No ha sido tocado en las fases 3-5.

## Enfoque técnico

### 1. Auditoría documental de todos los cierres

Ejecutar `npm run docs:check -- <feature>` para cada una de las 15 features con
`cierre.md` y registrar el resultado (feature, PR, commit, ✅/❌) en un único
`specs/cierre-global/auditoria-docs.md`. Si falla alguno, corregir solo el
fallo mecánico (casilla sin marcar, sección ausente o enlace roto) en la specs
correspondiente y repetir la comprobación. No reescribir cierres ya correctos.

### 2. Coherencia de los documentos vivos

Revisar que `MEMORY.md`, `docs/roadmap.md`, `CHANGELOG.md` y `README.md`
reflejen el estado real tras la Fase 5: las seis fases ✅, el foco en Fase 6,
el registro de features completo y la descripción de los comandos (`test:e2e`
incluye las cinco suites). Añadir una entrada de cierre global en `CHANGELOG.md`
y actualizar la fecha del `MEMORY.md`. No tocar specs cerradas salvo correcciones
mecánicas detectadas en el paso 1.

### 3. Checklist de verificación en móvil real

Crear `docs/verificacion-movil-real.md` con una tabla por pantalla (Notas,
Cuentas, Calendario, Dispositivos, Perfil/menú «Más»): gestos a probar,
resultado esperado, dispositivo (iOS Safari / Android Chrome) y columna de
evidencia vacía. Incluir los follow-ups acumulados (teclado virtual, Face
ID/huella, lector de pantalla, contraste de `ash`, notificación push real y
picker de archivos `.json`). La propia guía dejará claro que **el agente no la
ha ejecutado** y que la completing la propietaria/o con sus dispositivos.

### 4. Estado honesto de producción

Repetir el smoke público: `/api/health`, `/auth/login` y `/`, y contrastar el
commit desplegado con `main`. El smoke autenticado seguirá documentado como
pendiente del propietario; no se inventará evidencia ni se pedirá al usuario
que compruebe algo que el agente no ha comprobado.

### 5. Verificación

- `npm run lint && npm run typecheck && npm run test && npm run build` y
  `npm run test:e2e` como comprobación final del repo (aunque esta fase no
  cambie código de producto).
- `npm run docs:check -- <feature>` para las 15 features y para `cierre-global`.
- Sin cambios en BD, API, auth, modelos ni dependencias. El único archivo nuevo
  de producto es documentación.

## Decisiones aprobadas

Ver `spec.md` → *Decisiones aprobadas (2026-11-20)*. El usuario aprobó la opción
A en las seis: no crear código nuevo, auditar los cierres con la herramienta
existente, no fabricar cierres retroactivos, dejar la prueba real como checklist
del propietario y no tocar el archivo ajeno.

## Dependencias

- [x] Fases 1-5 cerradas con sus PRs de cierre y CI de `main` en verde.
- [x] `docs:check` disponible y `docs/cierre-feature.md` como guía operativa.
- [x] `@playwright/test` y la skill `design-audit` disponibles para la
      verificación final del repo.
- [ ] Aprobación de `specs/cierre-global/spec.md` por el usuario.

## Riesgos

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| Dar por verificada la prueba en móvil real sin dispositivos | Alta | Alto | Guía con evidencia vacía y declaración explícita de «no ejecutado por el agente» |
| Reabrir specs cerradas y generar regresiones documentales | Media | Medio | Solo corregir fallos mecánicos detectados por `docs:check` |
| Inventar cierres retroactivos sin evidencia | Media | Alto | Decisión explícita: las features previas al protocolo quedan resumidas en CHANGELOG/MEMORY |
| `docs:check` falle por formato en un cierre antiguo | Media | Bajo | Corrección mínima y nueva ejecución; registrar el antes/después |
| Confundir al usuario con el archivo `cierre 2.md` | Media | Bajo | No tocarlo y documentarlo como artefacto ajeno pendiente de su revisión |

## Fuera de alcance

- Features nuevas de producto, cambios en BD, API, auth, modelos ni dependencias.
- Rehacer auditorías `design-audit` de fases cerradas.
- Crear cierres retroactivos para specs anteriores al protocolo.
- Borrar o modificar `specs/cuentas-movil/cierre 2.md` sin confirmación.
- Publicar la app en tiendas: sigue siendo PWA instalable.

## Verificación final

- `npm run lint && npm run typecheck && npm run test && npm run build && npm run test:e2e`.
- `npm run docs:check -- <feature>` para cada cierre y para `cierre-global`.
- Smoke público de producción y registro del commit de `main`.
- CI del PR en verde, squash merge, cierre documental y CI final de `main`.
