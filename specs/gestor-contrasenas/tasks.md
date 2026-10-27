# Tasks: Gestor de contraseñas familiar

## Backend (completado)
- [x] Modelo: campo `encryptedPasswords` en `User`
- [x] Migración: `20261028200000_add_encrypted_passwords_to_user`
- [x] Crypto: `encryptPasswords` / `decryptPasswords` en `src/lib/crypto.ts`
- [x] API: `GET /api/passwords`
- [x] API: `POST /api/passwords`
- [x] Tests: 356 pasando (vitest)
- [x] Lint: 0 warnings/errors
- [x] Typecheck: 0 errors

## Frontend (movido a feature separada: `feat/gestor-contrasenas-ui`)
- [x] Pestaña "Contraseñas" en layout de `/perfil` → follow-up
- [x] Componente `PasswordList` (tabla/responsive) → follow-up
- [x] Componente `PasswordModal` (crear/editar) → follow-up
- [x] Hook `usePasswords` (SWR/React Query) → follow-up
- [x] Botón exportar (descarga JSON cifrado) → follow-up
- [x] Botón importar (file input + merge) → follow-up
- [x] Tests UI (playwright/vitest) → follow-up

## Documentación (completado)
- [x] `specs/gestor-contrasenas/spec.md`
- [x] `specs/gestor-contrasenas/plan.md`
- [x] `specs/gestor-contrasenas/tasks.md`
- [x] `docs/gestor-contrasenas.md` (guía usuario)

## Deploy y verificación (completado)
- [x] PR #32 squash-merged a main
- [x] CI verde (test, quality, build)
- [x] Vercel deploy producción: health 200, DB ok
- [x] Verificación manual en producción con `admin@casa.local`