# Plan: Gestor de contraseñas familiar

## Fases

### 1. Modelo y Migración ✅
- [x] Añadir campo `encryptedPasswords String?` a `User` en `prisma/schema.prisma`
- [x] Crear migración `20261028200000_add_encrypted_passwords_to_user`
- [x] Aplicar en local (`prisma migrate deploy`) y marcar como aplicada
- [x] `prisma generate`

### 2. Crypto Helpers ✅
- [x] Añadir `encryptPasswords` / `decryptPasswords` en `src/lib/crypto.ts`
- [x] Tests unitarios en `tests/crypto.test.ts` (ya existentes, 9 tests pasan)

### 3. API Endpoints ✅
- [x] `GET /api/passwords` — lista descifrada
- [x] `POST /api/passwords` — crea/actualiza
- [x] Validación Zod (título requerido, único por usuario)
- [x] Manejo de errores (400, 409, 500)

### 4. UI (pendiente - próxima iteración)
- [ ] Pestaña "Contraseñas" en `/perfil`
- [ ] Lista con acciones (ver/ocultar, copiar, editar, borrar)
- [ ] Modal crear/editar
- [ ] Import/Export botones

### 5. Verificación y Deploy ✅
- [x] `npm run test` (356 tests pass)
- [x] `npm run lint` (clean)
- [x] `npm run typecheck` (clean)
- [x] PR #32 creado, revisado, squash-merged a main
- [x] Vercel deploy en producción verificado (health OK)

## Riesgos mitigados
- **Migración fallida anterior**: Se revirtió PR #31, se limpió BD, se creó migración limpia
- **Cifrado**: Usa misma infraestructura que 2FA (TOTP_ENCRYPTION_KEY), probada en producción
- **Sin tabla extra**: Evita joins, simplifica RLS/permisos, una sola migración

## Follow-ups
- UI en `/perfil` (feature separada `feat/gestor-contrasenas-ui`)
- Compartir contraseñas entre miembros familia
- Extensión navegador para autollenado
