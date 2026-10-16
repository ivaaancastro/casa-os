# Plan — Usuarios y roles

## Contexto

Hoy la app arranca con un único **ADMIN** sembrado (`admin@casa.local`). No hay
forma de crear miembros de la familia, gestionar sus roles ni que cada uno cambie
su contraseña. Es un **habilitador**: el resto de hitos (dispositivos, calendario,
inventario, gastos…) necesitan saber "quién es quién" y respetar permisos.

## Enfoque técnico

- **Modelo**: añadir `active Boolean @default(true)` a `User` (baja lógica) y
  migración Prisma (`add-user-active`). No se hace borrado duro.
- **API**:
  - `/api/users` — `GET` (listar) y `POST` (crear) — administración.
  - `/api/users/[id]` — `PATCH` (editar nombre/rol/estado; reset de contraseña).
  - `/api/profile` — `GET`/`PATCH` (nombre) y `POST /api/profile/password`
    (cambio de contraseña con la actual).
- **Autorización**: helpers (`requireUser`, `requireAdmin`) + comprobación de rol
  en cada endpoint. Los FAMILY no pueden tocar la gestión de usuarios.
- **UI editorial** (Inditex): páginas `/familia` (lista + administración) y
  `/perfil` (datos propios), con nuevo item "Familia" en el sidebar.
- **Login**: los usuarios inactivos no pueden iniciar sesión.

## Dependencias

- [x] Auth con NextAuth + JWT (roles ya en sesión).
- [x] Modelo `User` (se amplía con `active`).
- [x] Patrón de API/validación Zod de `/api/notes`.

## Riesgos

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|------------|
| Dejar la casa sin ADMIN activo | Media | Alto | Bloquear degradar/desactivar al último ADMIN |
| Escalada de privilegios (FAMILY → gestión) | Baja | Alto | `requireAdmin` en todos los endpoints de gestión |
| Fuga de contraseñas | Muy baja | Alto | Nunca devolver `password`; `select` explícito |
| Romper sesiones existentes al migrar | Baja | Medio | `active` con default `true`; migración aditiva |

## Fuera de alcance

- Invitaciones por email (no hay proveedor de correo).
- Auto-registro público.
- Borrado duro de usuarios (se usa **desactivar**).
- Permisos granulares por sección (más allá de ADMIN/FAMILY).
- Avatar/foto de perfil.
