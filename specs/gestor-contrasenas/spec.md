# Spec — Gestor de contraseñas familiar (prototipo)

**Feature:** `gestor-contrasenas`
**Estado:** prototipo descartado; sustituido por `feat/cuentas`
**Fecha original:** 2026-10-27
**Corrección documental:** 2026-10-28

> **Aviso:** este documento conserva el diseño original, pero el alcance real
> fue mucho menor. Lo que sigue marcado como *no entregado* no existe en el
> repo y no debe documentarse como hecho.

## Resumen

Prototipo de gestor de contraseñas con cifrado AES-256-GCM en el campo
`User.encryptedPasswords`. Sin tabla separada. La UI nunca se implementó y el
cifrado es **server-side**, no zero-knowledge.

## Alcance real entregado

- Campo `User.encryptedPasswords` y migración aditiva.
- Helpers `encryptPasswords` / `decryptPasswords`.
- `GET/POST /api/passwords` básicos.
- Tests de crypto.

## No entregado (cancelado)

- UI en `/perfil` o `/contrasenas`.
- Import/export.
- `PUT` / `DELETE`.
- Validación Zod y `Cache-Control: no-store`.
- Compartir entre miembros.
- Autollenado.
- Cifrado zero-knowledge o derivación PBKDF2.

## Modelo de datos

```prisma
model User {
  // ...
  encryptedPasswords String? // JSON cifrado: { "título": "contraseña" }
}
```

## API real

| Método | Endpoint | Descripción |
|---|---|---|
| GET | `/api/passwords` | Descifra el mapa y devuelve solo los valores |
| POST | `/api/passwords` | Crea por título; ignora usuario, notas y categoría |

No existen `DELETE /api/passwords/:title` ni `PUT /api/passwords/:title`.

## Crypto real

- `encryptPasswords(obj: Record<string, string>): string` — cifra el JSON.
- `decryptPasswords(payload: string): Record<string, string> | null` — descifra
  y parsea.
- Contexto (AAD): `casa-os:passwords:v1`.
- Clave: `TOTP_ENCRYPTION_KEY` directamente. **No hay PBKDF2 ni contraseña
  maestra.**

## Criterios de aceptación (revisados)

1. El campo existe y la migración es aditiva. **Cumplido.**
2. El JSON se guarda cifrado en la base de datos. **Cumplido.**
3. Cada usuario solo accede a su propio campo. **Cumplido.**
4. La UI permite crear, editar, borrar, copiar e importar/exportar. **No
   cumplido: no hay UI.**
5. El servidor no puede descifrar las contraseñas. **No cumplido: puede.**
6. `lint`, `typecheck`, `test` y `build` pasan. **Cumplido.**

## Decisión final

El prototipo no cumple el modelo de seguridad de la bóveda familiar. Se
sustituye por `feat/cuentas` (zero-knowledge, master password, passkey opcional
y visibilidad por cuenta). Cuando Cuentas esté cerrada, se retirarán
`/api/passwords` y el campo `encryptedPasswords`.
