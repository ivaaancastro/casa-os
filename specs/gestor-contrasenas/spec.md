# Spec: Gestor de contraseñas familiar

## Resumen
Gestor de contraseñas familiar con cifrado AES-256-GCM almacenado en campo `encryptedPasswords` del modelo `User`. Sin tabla separada, UI en perfil de usuario.

## Alcance
- CRUD de contraseñas (crear, listar, eliminar, actualizar)
- Cifrado AES-256-GCM con clave derivada de `TOTP_ENCRYPTION_KEY`
- Import/Export (JSON cifrado)
- UI en `/perfil` (pestaña "Contraseñas")
- Permisos: cada usuario solo gestiona sus propias contraseñas

## Fuera de alcance
- Compartir contraseñas entre usuarios (fase futura)
- Autollenado en navegador (extensión separada)
- 2FA para entradas individuales

## Modelo de datos
```prisma
model User {
  // ... campos existentes
  encryptedPasswords String? // JSON cifrado: { "titulo": "password" }
}
```

## API
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/passwords` | Lista contraseñas descifradas del usuario autenticado |
| POST | `/api/passwords` | Crea entrada (body: title, username?, password, notes?, category?) |
| DELETE | `/api/passwords/:title` | Elimina entrada por título |
| PUT | `/api/passwords/:title` | Actualiza entrada |

## Crypto
- `encryptPasswords(obj: Record<string,string>): string` — cifra JSON completo
- `decryptPasswords(payload: string): Record<string,string> | null` — descifra y parsea
- Contexto: `casa-os:passwords:v1`
- Clave: derivada de `TOTP_ENCRYPTION_KEY` (PBKDF2, 100k iteraciones)

## UI
- Pestaña "Contraseñas" en `/perfil`
- Lista con título, usuario, categoría, acciones (ver/ocultar, copiar, editar, borrar)
- Modal para crear/editar
- Botón exportar (descarga JSON cifrado)
- Botón importar (sube JSON cifrado, mergea)

## Criterios de aceptación
1. Usuario autenticado puede crear contraseña → aparece en lista
2. Contraseña se almacena cifrada en BD (verificar en Prisma Studio)
3. Usuario no ve contraseñas de otros usuarios
4. Export/import mantiene cifrado end-to-end
5. 356 tests pasan, lint/typecheck limpios
