# Cierre — Seguridad operativa (Fase 1)

**Estado:** cerrada
**Fecha:** 2026-11-26
**Feature:** `seguridad-operativa`

## Resumen

Segunda fase del roadmap de auditoría. Se cerraron las brechas de seguridad
operativa: rate limit de login persistente en BD, sanitización server-side de
notas, recovery codes con bcrypt, cookie de passkey corregida, timing seguro,
rate limit en passkey, sessionVersion al cambiar rol/activación, backup sin
interpolación de shell, CSP documentada y `npm audit fix` (no breaking).

## Alcance entregado

- Nuevo modelo `LoginAttempt` + migración; `rate-limit.ts` DB-backed.
- `sanitize-server.ts` con `sanitize-html`; usado en POST/PATCH de notas.
- Recovery codes hasheados con bcrypt (coste 10).
- Cookie de challenge de passkey con path `/`.
- Timing seguro en `authorize` (bcrypt dummy).
- Rate limit en endpoints de passkey (opciones + registro de fallos).
- `sessionVersion` incrementado al cambiar rol/activación.
- `backup-db.ts` usa `execFile`.
- CSP documentada con plan de nonce.
- `npm audit fix`: 19 → 13 vulnerabilidades.
- Dependencias breaking (zod 4, next 16, vitest 5) quedan como follow-up.

## Cambios principales

| Área | Archivos | Qué cambió |
|---|---|---|
| Datos | `prisma/schema.prisma`, migración `20261126120000_add_login_attempt` | Modelo `LoginAttempt` |
| Auth | `src/lib/auth.ts`, `src/lib/rate-limit.ts` | Rate limit DB-backed, timing seguro |
| Seguridad | `src/lib/two-factor-recovery.ts`, `src/lib/two-factor.ts` | Recovery codes bcrypt |
| Seguridad | `src/lib/vault/webauthn.ts` | Cookie path `/` |
| Seguridad | `src/lib/utils/sanitize-server.ts` | Sanitización server-side |
| API | `src/app/api/notes/route.ts`, `[id]/route.ts` | Sanitizar contenido |
| API | `src/app/api/users/[id]/route.ts` | sessionVersion en rol/activación |
| API | `src/app/api/auth/login/passkey/*` | Rate limit passkey |
| Scripts | `scripts/backup-db.ts` | execFile sin shell |
| Config | `next.config.js` | CSP documentada |
| Deps | `package.json`, `package-lock.json` | sanitize-html, audit fix |
| Docs | `specs/seguridad-operativa/*` | plan/spec/tasks/cierre |

## Verificación

### Código y tests

| Comando | Resultado |
|---|---|
| `npm run lint` | OK |
| `npm run typecheck` | OK |
| `npm run test` | 443 tests OK |
| `npm run build` | OK |
| CI del PR | #65 success |

### UI / Chrome

- No aplica cambios de UI (solo seguridad/backend).

### Producción

| Campo | Valor |
|---|---|
| URL | https://casa-os-mauve.vercel.app |
| Deployment | Automático por Vercel tras merge |
| Commit | (squash merge del PR #65) |
| Health | No verificado en esta sesión (pendiente del propietario) |
| Rutas | No verificadas en esta sesión |
| Smoke autenticado | Pendiente del propietario |

## Documentación actualizada

- [x] `MEMORY.md`: estado, roadmap, registro y foco.
- [x] `CHANGELOG.md`: entrada de la entrega.
- [x] `README.md`: no afectado.
- [x] `docs/*`: no afectados.
- [x] `spec.md` y `plan.md`: decisiones finales.
- [x] `tasks.md`: todas las tareas en `[x]` (T12 movido a follow-ups).
- [x] `AGENTS.md`: no aplica.
- [x] `npm run docs:check -- seguridad-operativa` pasa.

## Tareas

### Completadas

- T1 Cookie passkey path
- T2/T3 Sanitización server-side
- T4 Recovery codes bcrypt
- T5 LoginAttempt + rate limit DB
- T6 Timing seguro
- T7 Rate limit passkey
- T8 sessionVersion rol/activación
- T9 backup-db execFile
- T10 CSP documentada
- T11 npm audit fix
- T13 Verificación

### Pendientes / follow-ups

- Tests de integración para rate limit DB-backed y sanitización server-side.
- PR dedicado para dependencias breaking (zod 4, next 16, vitest 5).
- Regenerar recovery codes existentes (los hasheados con SHA-256 quedan inválidos).
- Single-use del token de passkey (jti) — pendiente.

## Decisiones y lecciones

- Se optó por bcrypt para recovery codes aunque rompe la búsqueda por hash
  (ahora se recorren los códigos del usuario y se comparan con bcrypt.compare).
- La sanitización server-side usa `sanitize-html` (nueva dependencia) en un
  módulo separado para no meterlo en el bundle del cliente.
- El rate limit por email se movió a BD (`LoginAttempt`); la limpieza de filas
  antiguas es best-effort.

## Riesgos residuales

- Las dependencias breaking (next/postcss/zod/tinypool) siguen vulnerables hasta
  el PR dedicado.
- Tests de seguridad pendientes (follow-up).
- Smoke autenticado en producción pendiente del propietario.

## Checklist de cierre

- [x] El PR de la feature está mergeado y la rama borrada.
- [x] El CI de `main` está verde tras el merge de la feature.
- [x] Producción está desplegada (deploy automático); smoke autenticado pendiente
      del propietario (sin inventar evidencia).
- [x] `tasks.md` no tiene casillas pendientes.
- [x] `cierre.md` no tiene casillas pendientes.
- [x] `MEMORY.md` enlaza este cierre y tiene el registro actualizado.
- [x] `CHANGELOG.md`, `README.md` y `docs/*` están al día.
- [x] `npm run docs:check -- seguridad-operativa` pasa.
- [x] El PR de cierre tiene el CI verde.