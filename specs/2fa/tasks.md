# Tasks — Autenticación en dos pasos (2FA)

**Feature:** `2fa`
**Rama:** `feat/2fa`
**Spec:** [`spec.md`](spec.md)
**Plan:** [`plan.md`](plan.md)

> Ordenadas por dependencia. Cada tarea debe dejar `lint`, `typecheck` y los
> tests relevantes en verde. No se considera terminada hasta completar la
> verificación final y el cierre documental.

## Preparación

- [ ] **1. Dependencias y entorno** — Instalar `otplib`, `qrcode` y
  `@types/qrcode` (dev); añadir `TOTP_ENCRYPTION_KEY` a `.env.example` y
  documentar su generación (`openssl rand -base64 32`) sin valores reales.
  Archivos: `package.json`, `package-lock.json`, `.env.example`,
  `docs/despliegue-vercel.md`.

- [ ] **2. Modelo de datos y migración** — Añadir a `User`
  `twoFactorEnabled`, `twoFactorSecret`, `twoFactorConfirmedAt` y
  `sessionVersion`; crear `TwoFactorRecoveryCode` y `AuthEvent`; migración
  aditiva `add_2fa`. Archivos: `prisma/schema.prisma`,
  `prisma/migrations/add_2fa/migration.sql`.

## Criptografía y utilidades

- [ ] **3. Cifrado de secretos** — Crear `src/lib/crypto.ts` con AES-256-GCM
  (IV, tag, versión), validación de `TOTP_ENCRYPTION_KEY` y errores claros.
  Tests con ida/vuelta, clave incorrecta y payload manipulado. Archivos:
  `src/lib/crypto.ts`, `tests/crypto.test.ts`.

- [ ] **4. TOTP** — Crear `src/lib/totp.ts` con generación de secreto, URI
  `otpauth://`, verificación con ventana ±1 y validación de código de 6 dígitos.
  Tests con vectores conocidos. Archivos: `src/lib/totp.ts`,
  `tests/totp.test.ts`.

- [ ] **5. Códigos de recuperación** — Generar 10 códigos, hashearlos, consumirlos
  una sola vez y contar restantes. Tests de formato, hash, consumo y
  regeneración. Archivos: `src/lib/two-factor-recovery.ts`,
  `tests/two-factor-recovery.test.ts`.

- [ ] **6. Esquemas Zod** — Añadir esquemas para setup, enable, disable,
  regenerar códigos y reset admin. Archivos:
  `src/lib/schemas/two-factor.ts`, `tests/api/two-factor.schemas.test.ts`.

## Auth y sesiones

- [ ] **7. Login con TOTP** — Añadir `totp` al proveedor de credenciales;
  verificar TOTP o código de recuperación si `twoFactorEnabled`; mensaje
  genérico; registrar eventos sin secretos. Archivos: `src/lib/auth.ts`,
  `src/types/next-auth.d.ts`.

- [ ] **8. `sessionVersion`** — Incluir la versión en el JWT y comprobarla en
  `requireUser` junto con `active`; invalidar al cambiar contraseña o 2FA.
  Tests de token antiguo, usuario inactivo y versión incorrecta. Archivos:
  `src/lib/auth.ts`, `src/lib/api-auth.ts`, `src/types/next-auth.d.ts`,
  `src/app/api/profile/password/route.ts`, `tests/api-auth.test.ts`.

## API

- [ ] **9. Estado y setup** — `GET /api/2fa/status` y `POST /api/2fa/setup` con
  QR, clave manual y `no-store`; no devolver el secreto fuera del setup.
  Archivos: `src/app/api/2fa/status/route.ts`,
  `src/app/api/2fa/setup/route.ts`.

- [ ] **10. Activar y desactivar** — `POST /api/2fa/enable` con códigos de
  recuperación de una sola visualización; `POST /api/2fa/disable` con
  contraseña + TOTP/recuperación. Archivos:
  `src/app/api/2fa/enable/route.ts`, `src/app/api/2fa/disable/route.ts`.

- [ ] **11. Regenerar códigos** — `POST /api/2fa/recovery-codes` con contraseña +
  TOTP; invalidar los anteriores. Archivo:
  `src/app/api/2fa/recovery-codes/route.ts`.

- [ ] **12. Reset por ADMIN** — `POST /api/users/[id]/2fa/reset` con
  `requireAdmin`, 2FA del admin, auditoría y bloqueo de auto-reset. Archivo:
  `src/app/api/users/[id]/2fa/reset/route.ts`.

- [ ] **13. Rate limiting y auditoría** — Limitar a 5 fallos/15 min por email o
  usuario; registrar `AuthEvent` con hash de IP; no guardar secretos. Archivos:
  `src/lib/auth-events.ts`, `src/lib/rate-limit.ts`, rutas de auth/2FA.

## Interfaz

- [ ] **14. Perfil → Seguridad** — Tarjeta con estado, activar, desactivar,
  regenerar códigos, códigos restantes y últimos eventos; asistente con QR,
  clave manual y códigos de recuperación. Archivos:
  `src/components/SecuritySection.tsx`, `src/app/perfil/page.tsx`.

- [ ] **15. Login** — Campo opcional «Código 2FA o de recuperación», textos de
  ayuda, error genérico y enlace de recuperación. Archivos:
  `src/components/LoginForm.tsx`.

- [ ] **16. Reset en Familia** — Acción **Restablecer 2FA** en el detalle del
  miembro, visible solo para ADMIN y con confirmación. Archivos:
  `src/components/UserManager.tsx` (o el componente equivalente),
  `src/app/familia/page.tsx`.

- [ ] **17. Script de emergencia** — `npm run 2fa:reset -- <email>` que desactiva
  2FA, borra secreto/códigos, incrementa `sessionVersion` y no imprime secretos.
  Archivos: `scripts/reset-2fa.mjs`, `package.json`.

## Verificación y cierre

- [ ] **18. Tests completos** — Cubrir cifrado, TOTP, recuperación, login,
  rate limit, sesiones, reset admin y esquemas. `npm run test` en verde.

- [ ] **19. Verificación doble check** — `npm run lint && npm run typecheck &&
  npm run test && npm run build` en verde.

- [ ] **20. UI** — Verificar escritorio y 390 px: activar, escanear QR, códigos,
  login con TOTP, desactivar, reset admin y errores. Chrome MCP.

- [ ] **21. Documentación** — `docs/2fa.md`, `README.md`, `CHANGELOG.md`,
  `MEMORY.md`, `docs/despliegue-vercel.md` y `.env.example`; sin secretos.

- [ ] **22. PR y CI** — Commits atómicos, push, PR con el spec, CI verde, squash
  merge, borrar rama y verificar CI de `main`.

- [ ] **23. Producción** — Configurar `TOTP_ENCRYPTION_KEY` en Vercel, desplegar,
  verificar health y un login real con TOTP y código de recuperación.

- [ ] **24. Cierre documental** — `specs/2fa/cierre.md`, `tasks.md` sin
  pendientes, `MEMORY.md`, `CHANGELOG.md`, `README.md`, `docs/*`,
  `npm run docs:check -- 2fa` y PR de cierre mergeado con CI verde.
