# Gestor de contraseñas (prototipo descartado)

> **Estado: prototipo no apto para uso real.** No hay UI. El servidor puede
> descifrar las contraseñas, así que **no cumple zero-knowledge**. La sección
> definitiva será **Cuentas** (`/cuentas`), con master password en el cliente y
> passkey opcional. No uses esta API para credenciales reales.

## Qué existe realmente

- Campo `User.encryptedPasswords` (`TEXT`) y migración aditiva
  `20261028200000_add_encrypted_passwords_to_user`.
- Helpers `encryptPasswords` / `decryptPasswords` en `src/lib/crypto.ts`.
- `GET /api/passwords` y `POST /api/passwords`.
- Tests unitarios de crypto.

## Qué no existe

- Página `/contrasenas` ni pestaña en `/perfil`.
- Componentes `PasswordList`, `PasswordModal` o `PasswordActions`.
- Hook `usePasswords`.
- Import/export.
- `PUT` / `DELETE /api/passwords`.
- Cifrado zero-knowledge, contraseña maestra o PBKDF2.

## Cómo funciona el prototipo

1. El servidor recibe la contraseña en claro por HTTPS (sesión autenticada).
2. Guarda un mapa `{ "título": "contraseña" }` cifrado con AES-256-GCM.
3. La clave es **la misma** `TOTP_ENCRYPTION_KEY` que usa 2FA. No hay
   derivación PBKDF2 ni contraseña maestra independiente.
4. `GET` descifra el mapa y devuelve solo los valores; `POST` añade por título e
   ignora `username`, `notes` y `category`.

Esto significa que el servidor (y cualquiera con la clave) puede leer todas las
contraseñas. Es exactamente lo que Cuentas debe evitar.

## API (solo desarrollo)

```bash
# Listar (valores del mapa; no incluye título ni metadatos)
GET /api/passwords

# Crear (solo title y password tienen efecto)
POST /api/passwords
Content-Type: application/json
{ "title": "GitHub", "password": "secreto" }
```

No hay endpoints de edición ni borrado. La API no valida con Zod ni envía
`Cache-Control: no-store`.

## Estado en producción

El deployment del PR #32 falló con `P3009` por la migración histórica
`2026102820_add_password_entry`. Tras la reparación de
`fix/estado-real-produccion` (PR #34), el deployment
`dpl_6mQZz8KvrbyZVrQqq3xh8zoZkzjg` (commit `0e8803e`) quedó *Ready* con las 7
migraciones aplicadas, incluida `20261028200000_add_encrypted_passwords_to_user`.
La API existe, pero **no hay UI y no es zero-knowledge**: no debe usarse para
credenciales reales.

> **Resto posible en la base de datos**: la migración fallida podía dejar la
> tabla `PasswordEntry` creada a medias. El esquema actual no la usa y no se
> elimina automáticamente (sería destructivo). Si se quiere limpiar, hacerlo a
> mano con una copia de seguridad y confirmación explícita.

## Variables de entorno

```env
# 32 bytes en base64. Genera una con: openssl rand -base64 32
TOTP_ENCRYPTION_KEY="..."
```

La clave se guarda en Vercel y en el gestor de contraseñas. Nunca en el repo.

## Roadmap

- [x] Prototipo backend (descartado).
- [ ] **Cuentas zero-knowledge** (`feat/cuentas`): master password + passkey
  opcional, visibilidad por cuenta, 2FA obligatorio.
- [ ] Retirar `/api/passwords` y `encryptedPasswords` al cerrar Cuentas.

## Troubleshooting

| Síntoma | Causa | Solución |
|---|---|---|
| `[]` tras crear | Cifrado o clave mal configurada | Verificar `TOTP_ENCRYPTION_KEY`; no usar el prototipo en producción |
| `409 Conflict` | Título duplicado | Usar otro título (solo en el prototipo) |
| `500` | Clave inválida o migración no aplicada | Revisar el deploy y la migración |
