# Tasks — Cuentas zero-knowledge

**Feature:** `cuentas`
**Rama:** `feat/cuentas`
**Spec aprobado:** 2026-10-28 (contacto de confianza en v1, master password 12+, familia por defecto)

Cada tarea se marca `[x]` solo cuando está implementada y verificada. Al cerrar
la feature no puede quedar ninguna casilla pendiente: lo no ejecutado se mueve a
`cierre.md` → *Pendientes / follow-ups*.

## Fase 0 — Preparación

- [x] **1. Esquema Prisma** — añadir `Vault`, `VaultAccount`,
  `VaultAccountKey`, `VaultRecovery`, `VaultPasskey`, `VaultRecoveryShare` y
  `VaultEvent`; relaciones inversas en `User`. Archivo:
  `prisma/schema.prisma`.
- [x] **2. Migración aditiva** — `npm run db:migrate -- --name
  cuentas_zero_knowledge`; probar en base temporal y revisar el SQL.
- [x] **3. CSP y middleware** — `'wasm-unsafe-eval'` en `script-src`;
  `/api/cuentas` fuera del redirect del middleware para devolver `401` JSON.
  Archivos: `next.config.js`, `src/middleware.ts`, `tests/middleware.test.ts`.
- [x] **4. Dependencias** — instalar `libsodium-wrappers-sumo`,
  `@simplewebauthn/server` y `@simplewebauthn/browser`; tipos si faltan.
  Archivo: `package.json`.

## Fase 1 — Criptografía y utilidades

- [x] **5. Constantes y tipos** — `src/lib/vault/constants.ts` y
  `src/lib/vault/types.ts` (visibilidades, estados, límites, payload de cuenta).
- [x] **6. Cripto de bóveda** — `src/lib/vault/crypto.ts`: Argon2id,
  `crypto_kdf`, cifrado/descifrado del keyring y de cuentas, `crypto_box_seal`,
  generación de claves, `memzero`. Sin DOM.
- [x] **7. Tests de cripto** — `tests/vault-crypto.test.ts`: round-trip,
  nonce distinto, manipulación detectada, DEK para varios destinatarios,
  destrezas de derivación y clave incorrecta.
- [x] **8. Código de recuperación** — `src/lib/vault/recovery-code.ts`
  (Crockford base32 + checksum) y `tests/vault-recovery-code.test.ts`.
- [x] **9. Generador y fortaleza** — `src/lib/vault/password.ts` (generador
  local, mínimo 12, lista de comunes) y `tests/vault-password.test.ts`.
- [x] **10. Esquemas Zod** — `src/lib/vault/schemas.ts` para todas las rutas y
  `tests/api/vault.schemas.test.ts`.

## Fase 2 — Servidor: grant, auditoría y bóveda

- [x] **11. Grant de bóveda** — `src/lib/vault/grant.ts`: firma HMAC,
  cookie `casaos_vault`, 15 min, validación con `sessionVersion`; tests.
- [x] **12. Auditoría y rate limit** — `src/lib/vault/audit.ts` sobre
  `VaultEvent`, con `hashIp`; límites 5/15 min y 3/hora; tests.
- [x] **13. Estado** — `GET /api/cuentas/status` con 2FA, bóveda, passkeys,
  recuperación, contactos y grant.
- [x] **14. Crear bóveda** — `POST /api/cuentas/vault`: valida 2FA, Zod,
  guarda sal/params/`authHash`/`pk`/keyring; emite grant.
- [x] **15. Desbloquear** — `POST /api/cuentas/unlock`: rate limit, TOTP,
  `bcrypt(authKey)`, keyring y grant. Tests de fallos.
- [x] **16. Bloquear** — `POST /api/cuentas/lock`.
- [x] **17. Cambiar master password** — `PUT /api/cuentas/vault/keyring`.
- [x] **18. Kit de recuperación** — `PUT /api/cuentas/recovery` y
  `POST /api/cuentas/recovery/reset` con TOTP y auditoría.

## Fase 3 — Cuentas y compartición

- [x] **19. Miembros** — `GET /api/cuentas/members` con `pk` y si tienen bóveda.
- [x] **20. Listar y crear** — `GET/POST /api/cuentas/accounts`; solo
  destinatarios; `no-store`; validación de dueño y destinatarios.
- [x] **21. Editar y borrar** — `PATCH/DELETE /api/cuentas/accounts/[id]` con
  `revision`, `canEdit`, `404` sin filtración y transacción al borrar.
  transaccional; rotación de DEK; solo dueño; auditoría.
- [x] **23. Tests de permisos** — Prisma mockeado: dueño, `canEdit`, lector,
  ADMIN ajeno, `409`, `404`, grant caducado y usuario sin 2FA.

## Fase 4 — Passkeys y contacto de confianza

  autenticación, verificación con `@simplewebauthn/server`, challenge firmado.
  `DELETE /api/cuentas/passkeys/[id]`; exige PRF confirmado en cliente.
  aserción + TOTP + grant.
  `POST .../[id]/accept`, `DELETE .../[id]`, `POST .../[id]/reveal`; estado
  `PENDING/ACCEPTED/STALE/REVOKED` y auditoría.

## Fase 5 — UI

- [x] **28. Página y estados** — `src/app/cuentas/page.tsx` (shell servidor) y
  `src/components/cuentas/VaultApp.tsx` (sin 2FA → onboarding → bloqueada →
  abierta).
- [x] **29. Onboarding** — `VaultOnboarding.tsx`: requisitos, master password,
  kit obligatorio, passkey opcional.
- [x] **30. Desbloqueo** — `VaultUnlock.tsx`: master password + TOTP, passkey,
  recuperación, auto-lock y bloqueo manual.
- [x] **31. Lista y detalle** — `VaultWorkspace.tsx`, `AccountDialog.tsx`:
  búsqueda, filtros, copiar, revelar, generador, crear/editar/borrar.
- [x] **32. Compartir** — `ShareDialog.tsx`: visibilidad, destinatarios,
  `canEdit` y aviso de miembros nuevos.
- [x] **33. Ajustes** — `VaultSettings.tsx`: master password, kit, passkeys,
  contactos, auditoría y borrado.
- [x] **34. Navegación** — enlace **Cuentas** en `Sidebar.tsx` y estado
  «Planificado» → «Disponible» en el dashboard solo al terminar.
  `prefers-reduced-motion`.

## Fase 6 — Verificación y cierre

- [x] **36. Tests de API y regresión** — ejecutar toda la suite; añadir tests de
  `unlock`, `grant`, `sharing` y `recovery` si faltan.
- [x] **37. Verificación local** — `lint`, `typecheck`, `test` y `build`.
  desbloquear, recuperar y auto-lock en escritorio y 390 px.
  `P3009`; comprobar que las tablas nuevas existen.
  prueba, health `200` y `/cuentas` sin filtrar contenido.
  `README.md`, `CHANGELOG.md`, `MEMORY.md`, `docs/architecture.md`,
  `docs/roadmap.md` y `docs/despliegue-vercel.md` si cambia algo.
  uso y `User.encryptedPasswords` con migración; pedir confirmación explícita
  antes de un `DROP COLUMN`.
  PR `docs/cierre-cuentas`, CI de `main` verde.
