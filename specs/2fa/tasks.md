# Tasks — Autenticación en dos pasos (2FA)

**Feature:** `2fa`
**Rama:** `feat/2fa` (histórica; el código se integró en `main` mediante commits directos y el PR #30 solo añadió el marcador de cierre)
**Spec:** [`spec.md`](spec.md)
**Plan:** [`plan.md`](plan.md)

> Ordenadas por dependencia. Las tareas se marcan con lo que realmente se
> verificó; las comprobaciones que no se repitieron quedan reflejadas en
> [`cierre.md`](cierre.md) → *Limitaciones*.

## Preparación

- [x] **1. Dependencias y entorno** — `otplib`, `qrcode` y `@types/qrcode`
  instalados; `TOTP_ENCRYPTION_KEY` documentada en `.env.example` y en
  `docs/despliegue-vercel.md` sin valores reales.
- [x] **2. Modelo de datos y migración** — `User.twoFactorEnabled`,
  `twoFactorSecret`, `twoFactorConfirmedAt` y `sessionVersion`;
  `TwoFactorRecoveryCode` y `AuthEvent`; migraciones aditivas `add_2fa` y
  `add_auth_event_actor`.

## Criptografía y utilidades

- [x] **3. Cifrado de secretos** — `src/lib/crypto.ts` con AES-256-GCM (IV,
  tag, versión y AAD), validación de `TOTP_ENCRYPTION_KEY` y errores claros.
  Tests de ida/vuelta, clave incorrecta y payload manipulado.
- [x] **4. TOTP** — `src/lib/totp.ts` con generación de secreto, URI
  `otpauth://`, verificación con ventana ±1 y validación de código de 6
  dígitos. Tests con vectores conocidos.
- [x] **5. Códigos de recuperación** — `src/lib/two-factor-recovery.ts`:
  generación de 10 códigos, hash, consumo único y conteo de restantes. Tests de
  formato, hash, consumo y regeneración.
- [x] **6. Esquemas Zod** — `src/lib/schemas/two-factor.ts` para setup, enable,
  disable, regenerar códigos y reset admin. Tests en
  `tests/api/two-factor.schemas.test.ts`.

## Auth y sesiones

- [x] **7. Login con TOTP** — campo opcional `totp` en el proveedor de
  credenciales; verificación TOTP o código de recuperación si
  `twoFactorEnabled`; mensaje genérico y eventos sin secretos.
- [x] **8. `sessionVersion`** — incluida en el JWT y comprobada en
  `requireUser` junto con `active`; se incrementa al cambiar contraseña o 2FA.
  Tests de token antiguo, usuario inactivo y versión incorrecta.

## API

- [x] **9. Estado y setup** — `GET /api/2fa/status` y `POST /api/2fa/setup` con
  QR, clave manual y `no-store`; el secreto solo se devuelve en el setup.
- [x] **10. Activar y desactivar** — `POST /api/2fa/enable` con códigos de
  recuperación de una sola visualización; `POST /api/2fa/disable` con
  contraseña + TOTP o código de recuperación.
- [x] **11. Regenerar códigos** — `POST /api/2fa/recovery-codes` con contraseña
  + TOTP; invalida los anteriores.
- [x] **12. Reset por ADMIN** — `POST /api/users/[id]/2fa/reset` con
  `requireAdmin`, 2FA del admin, auditoría y bloqueo de auto-reset.
- [x] **13. Rate limiting y auditoría** — límite de 5 fallos/15 min por email o
  usuario; `AuthEvent` con hash de IP; sin secretos en los eventos.

## Interfaz

- [x] **14. Perfil → Seguridad** — tarjeta con estado, activar, desactivar,
  regenerar códigos, códigos restantes y últimos eventos; asistente con QR,
  clave manual y códigos de recuperación.
- [x] **15. Login** — campo opcional «Código 2FA o de recuperación», textos de
  ayuda, error genérico y enlace de recuperación.
- [x] **16. Reset en Familia** — acción **Restablecer 2FA** en el detalle del
  miembro, visible solo para ADMIN y con confirmación.
- [x] **17. Script de emergencia** — `npm run 2fa:reset -- <email>`
  (`scripts/reset-2fa.ts`) que desactiva 2FA, borra secreto/códigos,
  incrementa `sessionVersion` y no imprime secretos.

## Verificación y cierre

- [x] **18. Tests completos** — cifrado, TOTP, recuperación, login, rate limit,
  sesiones, reset admin y esquemas. Suite completa en verde.
- [x] **19. Verificación doble check** — `npm run lint && npm run typecheck &&
  npm run test && npm run build` en verde (356 tests en la última ejecución
  registrada).
- [x] **20. UI** — smoke local en escritorio: activar 2FA con QR/clave manual,
  confirmar con TOTP, ver los 10 códigos de recuperación, cerrar sesión, entrar
  con TOTP y desactivar 2FA con contraseña + TOTP. La comprobación específica a
  390 px no se repitió en la corrección documental de 2026-10-28.
- [x] **21. Documentación** — `docs/2fa.md` (guía de activación, login,
  recuperación, reset y emergencia), `README.md`, `docs/despliegue-vercel.md`
  con `TOTP_ENCRYPTION_KEY` y `.env.example`. Se corrigió la documentación que
  faltaba.
- [x] **22. PR y CI** — el código se integró en `main` mediante los commits
  `8a6498b`, `307857c`, `c5ed603` y `e4e5730`; el PR #30 solo añadió el
  marcador de cierre. El CI de `main` quedó verde.
- [x] **23. Producción** — `TOTP_ENCRYPTION_KEY` configurada en Vercel;
  deployment `dpl_HJXPZgEHzYZeXAQuk2R1CKqR6MfD` (commit `562c9b0`) *Ready*, y
  posteriormente `dpl_6mQZz8KvrbyZVrQqq3xh8zoZkzjg` (`0e8803e`) tras reparar
  `P3009`; health `200` y `/api/2fa/status` sin sesión → `401`. El login real
  con TOTP en producción no se repitió por falta de credenciales del agente; se
  verificó en local.
- [x] **24. Cierre documental** — `cierre.md` completo, `tasks.md` sin
  pendientes, `MEMORY.md`, `CHANGELOG.md`, `README.md` y `docs/*` actualizados;
  `npm run docs:check -- 2fa` pasa.
