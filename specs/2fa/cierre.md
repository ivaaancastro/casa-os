# Cierre — Autenticación en dos pasos (2FA)

**Estado:** cerrada (verificación de producción parcial)
**Fecha:** 2026-10-28
**Feature:** `2fa`
**PR de feature:** no hubo PR de implementación; el código se integró en `main`
mediante los commits `8a6498b`, `307857c`, `c5ed603` y `e4e5730`. El PR #30
(`Close 2FA feature`, merge `562c9b0`) solo añadió el marcador histórico
`.close-2fa.txt`, retirado en la corrección documental de 2026-10-28.

## Resumen

2FA TOTP completo sobre el login de NextAuth: activación desde `/perfil` con QR
y clave manual, 10 códigos de recuperación de un solo uso, desactivación con
contraseña + segundo factor, regeneración de códigos, reset por ADMIN y script
de emergencia. El secreto TOTP se guarda cifrado con AES-256-GCM y los cambios
sensibles invalidan las sesiones con `sessionVersion`.

## Alcance entregado

- TOTP estándar (6 dígitos, 30 s, ventana ±1) compatible con Google
  Authenticator, 1Password, Apple Passwords y similares.
- Activación desde `/perfil` → **Seguridad**, con QR y clave manual.
- Login con contraseña + TOTP o código de recuperación; mensaje genérico si
  falla cualquier credencial.
- 10 códigos de recuperación hasheados, de un solo uso, visibles una sola vez.
- Desactivación y regeneración con contraseña + segundo factor.
- Reset por ADMIN desde `/familia`, con auditoría y bloqueo de auto-reset.
- `sessionVersion` en el JWT, comprobado en `requireUser`; se incrementa al
  cambiar contraseña o 2FA.
- Rate limit de 5 fallos/15 min y eventos `AuthEvent` sin secretos.
- Script local de emergencia `npm run 2fa:reset -- <email>`.

Fuera de alcance: SMS/email, passkeys, recordar dispositivos, step-up por acción
y 2FA obligatorio para toda la app. `feat/cuentas` exigirá 2FA con el helper
`requireTwoFactor`.

## Cambios principales

| Área | Archivos | Qué cambió |
|---|---|---|
| Datos | `prisma/schema.prisma`, `prisma/migrations/20261026154250_add_2fa`, `20261026154507_add_auth_event_actor` | Campos 2FA y `sessionVersion` en `User`; tablas `TwoFactorRecoveryCode` y `AuthEvent` |
| Crypto | `src/lib/crypto.ts`, `src/lib/totp.ts`, `src/lib/two-factor-recovery.ts` | AES-256-GCM con AAD, TOTP y códigos de recuperación |
| Auth | `src/lib/auth.ts`, `src/lib/api-auth.ts`, `src/types/next-auth.d.ts` | Login con TOTP/recuperación y validación de `sessionVersion` |
| API | `src/app/api/2fa/*`, `src/app/api/users/[id]/2fa/reset/route.ts` | Estado, setup, enable, disable, recovery-codes y reset admin |
| UI | `src/components/SecuritySection.tsx`, `src/components/LoginForm.tsx`, `src/app/perfil/page.tsx`, `src/app/familia/page.tsx` | Tarjeta de seguridad, asistente, login y reset admin |
| Scripts | `scripts/reset-2fa.ts`, `package.json` | Reset de emergencia por email |
| Tests | `tests/crypto.test.ts`, `tests/totp.test.ts`, `tests/two-factor-recovery.test.ts`, `tests/api/two-factor.schemas.test.ts`, `tests/auth.test.ts` | Cifrado, TOTP, recuperación, esquemas y login |

## Verificación

### Código y tests

| Comando | Resultado |
|---|---|
| `npm run lint` | OK |
| `npm run typecheck` | OK |
| `npm run test` | 356 tests en verde (última ejecución registrada) |
| `npm run build` | OK |
| CI del PR / `main` | CI de `main` verde tras la integración |

### UI / Chrome

- Navegador: Chromium del agente, escritorio; servidor local con `npm run dev`
  y base PostgreSQL local (`docker compose up -d db` + `npm run db:seed`).
- Flujos comprobados el 2026-10-28:
  1. Login con `admin@casa.local`.
  2. `/perfil` → **Activar 2FA**: QR generado y clave manual visible.
  3. Código TOTP de 6 dígitos aceptado; se muestran los 10 códigos de
     recuperación una sola vez.
  4. Cierre de sesión y nuevo login con contraseña + TOTP: correcto.
  5. **Desactivar 2FA** con contraseña + TOTP: correcto; redirección a
     `/auth/login?2fa=desactivado`.
- Consola: sin errores propios de la feature.
- Responsive: la comprobación específica a 390 px no se repitió en esta
  corrección; la UI ya era mobile-first y este punto queda como limitación.

### Producción

| Campo | Valor |
|---|---|
| URL | <https://casa-os-mauve.vercel.app> |
| Deployment | `dpl_HJXPZgEHzYZeXAQuk2R1CKqR6MfD` (*Ready · Current*, alias de producción) |
| Commit | `562c9b0` (incluye el código de 2FA de `e4e5730`) |
| Health | `GET /api/health` → `200` (`db: ok`) |
| Rutas | `/api/2fa/status` sin sesión → `401`; `/auth/login` → `200` |
| Smoke autenticado | No ejecutado en producción: el agente no tiene credenciales y la credencial de seed ya no es válida. El flujo completo se verificó en local. |

> El 2026-10-28 se detectó que los deployments posteriores a `562c9b0` fallaban
> por la migración histórica `2026102820_add_password_entry` (P3009). La
> reparación y el redeploy se registran en el cierre de la corrección
> `fix/estado-real-produccion`; no afectan al código de 2FA ya desplegado.

## Documentación actualizada

- [x] `MEMORY.md`: decisión, roadmap, foco, registro y notas técnicas de 2FA.
- [x] `CHANGELOG.md`: 2FA en `Added`.
- [x] `README.md`: característica de seguridad y variable `TOTP_ENCRYPTION_KEY`.
- [x] `docs/2fa.md`: guía de uso, recuperación, reset y emergencia.
- [x] `docs/despliegue-vercel.md`: variable de cifrado y verificación.
- [x] `.env.example`: `TOTP_ENCRYPTION_KEY` documentada sin valor real.
- [x] `spec.md`, `plan.md` y `tasks.md`: estado final y verificación real.
- [x] `AGENTS.md`: no aplica (no cambian las reglas del arnés).
- [x] `npm run docs:check -- 2fa` pasa.

## Tareas

### Completadas

- Dependencias, modelo y migraciones aditivas.
- Cifrado AES-256-GCM, TOTP y códigos de recuperación con tests.
- Login, `sessionVersion`, rate limit y auditoría.
- API de estado, setup, enable, disable, regeneración y reset admin.
- UI de perfil, login y familia; script de emergencia.
- Verificación local de activación, códigos, login con TOTP y desactivación.

### Pendientes / follow-ups

- Repetir el smoke autenticado de 2FA en producción cuando el usuario pueda
  facilitar una sesión o confirmarlo él mismo. Motivo: el agente no tiene
  credenciales de producción. No bloquea el código ya desplegado.
- Verificación específica de la UI a 390 px en una sesión de Chrome con
  emulación móvil. Motivo: no se repitió durante la corrección documental.

## Decisiones y lecciones

- **TOTP, no passkeys**, para el primer factor adicional: cualquier app
  autenticadora sirve y no hay dependencia de plataforma.
- **Códigos de recuperación hasheados**: el servidor nunca puede reconstruirlos.
- **`sessionVersion`**: un cambio de contraseña o 2FA invalida los JWT
  anteriores sin necesidad de una tabla de sesiones.
- **Lección**: el merge del código no es el cierre. 2FA estuvo en `main` sin
  `cierre.md` completo y sin entrada en `MEMORY.md`; `docs:check` lo detectó.
- **Lección**: no se puede afirmar "verificado en producción" si el agente no
  tiene credenciales. Se documenta la verificación local y la limitación.

## Riesgos residuales

- Pérdida del dispositivo: mitigada con 10 códigos de recuperación, reset por
  ADMIN y script local con acceso a la base de datos.
- Pérdida de `TOTP_ENCRYPTION_KEY`: los secretos no se pueden descifrar; el
  script de emergencia desactiva 2FA para que cada usuario lo configure de
  nuevo. La clave debe estar en el gestor de contraseñas.
- Reloj desincronizado: ventana ±1 y textos de ayuda en la UI.
- Sin smoke autenticado de producción en esta revisión: riesgo de que una
  regresión de entorno pase desapercibida hasta que el usuario lo pruebe.

## Checklist de cierre

- [x] Código de 2FA en `main`; commits y PR de cierre histórico identificados.
- [x] CI de `main` verde tras la integración.
- [x] Producción desplegada con el código de 2FA (`dpl_HJXPZgEHzYZeXAQuk2R1CKqR6MfD`); health y rutas verificadas.
- [x] Smoke autenticado de producción documentado como no ejecutado por falta de credenciales, con verificación local completa.
- [x] `tasks.md` sin casillas pendientes.
- [x] `cierre.md` sin casillas pendientes.
- [x] `MEMORY.md` enlaza este cierre y tiene el registro actualizado.
- [x] `CHANGELOG.md`, `README.md`, `docs/2fa.md` y `docs/despliegue-vercel.md` al día.
- [x] `npm run docs:check -- 2fa` pasa.
