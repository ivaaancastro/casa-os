# Tasks — Gestor de contraseñas familiar (prototipo)

**Feature:** `gestor-contrasenas`
**Estado:** cerrada como prototipo; sustituida por `feat/cuentas`
**Spec:** [`spec.md`](spec.md)
**Plan:** [`plan.md`](plan.md)

> Las tareas de UI e import/export **nunca se implementaron**. No se marcan como
> hechas: se retiraron del alcance y se sustituyen por Cuentas zero-knowledge.
> Los follow-ups van con viñetas normales, no con checkboxes.

## Backend (completado)

- [x] Campo `encryptedPasswords` en `User`.
- [x] Migración aditiva `20261028200000_add_encrypted_passwords_to_user`.
- [x] Helpers `encryptPasswords` / `decryptPasswords` en `src/lib/crypto.ts`.
- [x] `GET /api/passwords` (lista los valores del mapa cifrado).
- [x] `POST /api/passwords` (crea por título; ignora usuario, notas y categoría).
- [x] Tests de crypto (ida/vuelta, clave incorrecta, payload manipulado).
- [x] `npm run lint`, `npm run typecheck`, `npm run test` y `npm run build` en
  verde (356 tests en la última ejecución registrada).
- [x] PR #32 mergeado (`c5d2334`).

## UI (no implementada; feature cancelada)

- No se creó `src/app/contrasenas/page.tsx`.
- No se crearon `PasswordList`, `PasswordModal` ni `PasswordActions`.
- No se creó `src/hooks/usePasswords.ts`.
- No hay import/export ni tests de UI.
- El enlace `/contrasenas` se retiró del sidebar el 2026-10-28.

## Verificación y documentación

- [x] `docs/gestor-contrasenas.md` reescrito con el alcance real.
- [x] `spec.md`, `plan.md`, `tasks.md` y `cierre.md` corregidos.
- [x] `MEMORY.md` y `CHANGELOG.md` actualizados.
- [x] `npm run docs:check -- gestor-contrasenas` pasa.

## Follow-ups (sin checkbox)

- **Sustituir por `feat/cuentas`**: bóveda zero-knowledge con master password,
  passkey opcional y visibilidad por cuenta.
- **Retirar el prototipo**: borrar `/api/passwords` y el campo
  `encryptedPasswords` cuando Cuentas esté cerrada.
- **No usar** este prototipo para credenciales reales.
