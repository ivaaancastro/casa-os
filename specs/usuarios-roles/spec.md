# Spec — Usuarios y roles

> Feature `feat/usuarios-roles` (Hito 1 — Base familiar).
> Estado: **pendiente de aprobación**.

## Requisitos funcionales

1. **RF1 — Listar miembros**. Cualquier usuario autenticado ve la lista de
   miembros (nombre, email, rol, estado activo/inactivo).
2. **RF2 — Crear miembro** (ADMIN). Nombre, email único, rol (ADMIN/FAMILY) y
   contraseña inicial (mín. 8). La cuenta queda activa.
3. **RF3 — Editar miembro** (ADMIN). Cambiar nombre y rol; **restablecer
   contraseña** (sin conocer la anterior).
4. **RF4 — Activar/desactivar** (ADMIN). Baja lógica (`active`). Un usuario
   inactivo **no puede iniciar sesión**.
5. **RF5 — Perfil propio**. Ver/editar el nombre y **cambiar la contraseña**
   (actual + nueva + repetir).
6. **RF6 — Permisos por rol**:
   - **FAMILY**: leer todo; crear/editar/borrar **sus propias** notas.
   - **ADMIN**: además, gestionar usuarios (crear/editar/activar) y editar/borrar
     cualquier nota.
7. **RF7 — Protecciones de integridad**: no se puede desactivar/degradar al
   **último ADMIN activo**; no puedes desactivarte a ti mismo; email único.

## Requisitos no funcionales

- **Seguridad**: validación Zod en todos los endpoints; contraseñas con `bcrypt`
  (coste 12); **nunca** devolver `password`; `select` explícito en las consultas;
  autorización por rol comprobada en servidor (no solo en UI).
- **UX**: language editorial Inditex; mobile-first; estados de carga y error
  visibles; sin recargas que pierdan el foco.
- **Coherencia**: reutilizar el patrón de API y estilos de `/api/notes` y del
  editor de notas.

## API

### `GET /api/users`
- **Auth**: sí (cualquier usuario).
- **Response**: `200` → `User[]` con `{ id, name, email, role, active, createdAt }`
  (sin `password`). Orden por `createdAt`.

### `POST /api/users` (ADMIN)
- **Body**: `{ name, email, role, password }`.
- **Response**: `201` → usuario creado (sin `password`).
- **Errores**: `400` datos inválidos · `403` no ADMIN · `409` email duplicado.

### `PATCH /api/users/[id]` (ADMIN)
- **Body** (parcial): `{ name?, role?, active?, password? }`.
- **Reglas**: no degradar/desactivar al último ADMIN activo; no auto-desactivarse.
- **Response**: `200` → usuario actualizado (sin `password`).

### `GET /api/profile`
- **Auth**: sí. **Response**: `200` → usuario propio (sin `password`).

### `PATCH /api/profile`
- **Body**: `{ name }`. **Response**: `200` → usuario propio actualizado.

### `POST /api/profile/password`
- **Body**: `{ currentPassword, newPassword }`.
- **Reglas**: `currentPassword` debe ser correcta; `newPassword` mín. 8.
- **Response**: `200` · `400` contraseña actual incorrecta o datos inválidos.

## Modelo de datos

`prisma/schema.prisma` — añadir a `User`:

```prisma
active Boolean @default(true)
```

Migración: `add-user-active` (aditiva; default `true`, no afecta a usuarios
existentes).

## UI / UX

- **Sidebar**: nuevo item **"Familia"** (`/familia`) para todos.
- **`/familia`**:
  - Lista de miembros (nombre, email, rol, estado) en estilo editorial.
  - Si eres ADMIN: botón **"Añadir miembro"** (formulario) y acciones por
    miembro (editar nombre/rol, activar/desactivar, restablecer contraseña).
  - Si eres FAMILY: solo lectura.
- **`/perfil`**: datos propios (nombre editable) y formulario de cambio de
  contraseña. Enlace desde el sidebar (junto a "Cerrar sesión").
- **`/auth/login`**: si la cuenta está inactiva, error genérico (no revelar por
  qué).

## Criterios de aceptación

- [ ] Un ADMIN crea un miembro y ese miembro inicia sesión con la contraseña inicial.
- [ ] Un miembro desactivado no puede iniciar sesión.
- [ ] Un miembro cambia su nombre y su contraseña (validando la actual).
- [ ] Un FAMILY **no** puede acceder a la gestión de usuarios (403 en API; sin UI).
- [ ] Un FAMILY no puede editar/borrar notas de otros (403).
- [ ] No se puede degradar/desactivar al último ADMIN activo ni auto-desactivarse.
- [ ] El email es único (`409`).
- [ ] Nunca se devuelve `password` en ninguna respuesta.
- [ ] `lint && typecheck && test && build` y CI en verde.
