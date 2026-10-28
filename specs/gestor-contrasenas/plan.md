# Plan — Gestor de contraseñas familiar (prototipo)

**Feature:** `gestor-contrasenas`
**Estado:** prototipo entregado y descartado; sustituido por `feat/cuentas`
**PR:** #32 (`c5d2334`)

> Este plan se corrigió el 2026-10-28. El plan original daba por hecha una UI,
> un import/export y un PBKDF2 que nunca se implementaron.

## Contexto

La idea inicial era un gestor de contraseñas familiar cifrado en el campo
`User.encryptedPasswords`, con UI en `/perfil` y cifrado AES-256-GCM. Durante la
implementación se comprobó que el modelo no servía para el objetivo real: el
servidor conserva la clave y puede descifrar todas las contraseñas. Se decidió
no invertir más en él y diseñar **Cuentas** con cifrado zero-knowledge en el
cliente.

## Fases reales

### 1. Modelo y migración — completado

- Campo `encryptedPasswords String?` en `User`.
- Migración aditiva `20261028200000_add_encrypted_passwords_to_user`.
- El campo sigue en el esquema, pero no se usa desde la UI.

### 2. Crypto — completado (con limitaciones)

- `encryptPasswords` / `decryptPasswords` en `src/lib/crypto.ts`.
- AES-256-GCM con AAD `casa-os:passwords:v1`.
- Clave: `TOTP_ENCRYPTION_KEY` directamente. **No hay PBKDF2, no hay
  contraseña maestra y no es zero-knowledge.**

### 3. API — parcial

- `GET /api/passwords`: devuelve los valores del mapa `{ título: contraseña }`.
- `POST /api/passwords`: crea por título; ignora `username`, `notes` y
  `category`; sin Zod y sin `Cache-Control: no-store`.
- No hay `PUT` ni `DELETE`.
- No hay tests de la API.

### 4. UI — no implementada (cancelada)

- No hay página `/contrasenas`, componentes ni hook.
- El enlace del sidebar se retiró el 2026-10-28.

### 5. Verificación y despliegue — parcial

- Lint, typecheck, tests y build locales en verde.
- PR #32 mergeado y CI verde.
- **Producción nunca recibió este código**: el deployment falló con `P3009` por
  una migración histórica. El último deployment *Ready* es `562c9b0`, anterior
  al prototipo.

## Riesgos

- **Cifrado reversible por el servidor**: no apto para contraseñas reales.
- **Clave compartida con 2FA**: mezcla dominios y complica la rotación.
- **Código muerto**: la API y el campo se retirarán cuando Cuentas esté cerrada.

## Follow-ups

- `feat/cuentas`: bóveda zero-knowledge (master password + passkey opcional,
  visibilidad por cuenta, 2FA obligatorio).
- Retirar `/api/passwords` y `encryptedPasswords` al cerrar Cuentas.
- No documentar este prototipo como funcionalidad de usuario.
