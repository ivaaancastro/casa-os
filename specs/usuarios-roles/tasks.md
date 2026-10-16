# Tasks — Usuarios y roles

## 1. Modelo de datos
1. [x] `prisma/schema.prisma`: añadir `active Boolean @default(true)` a `User`.
2. [x] Sincronizar BD (`db push`; el repo no usa carpeta de migraciones) + `db:generate`.

## 2. Validación y reglas (TDD)
3. [x] `src/lib/schemas/user.ts`: `createUserSchema`, `updateUserSchema`,
       `updateProfileSchema`, `changePasswordSchema` + tipos.
4. [x] `src/lib/utils/user-rules.ts`: `validateUserUpdate` (último admin, auto-baja).
5. [x] Tests: `tests/api/user.schemas.test.ts` (20) y `tests/user-rules.test.ts` (8).

## 3. Auth
6. [x] `src/lib/auth.ts`: rechazar login si `!user.active`.
7. [x] `src/lib/api-auth.ts`: helpers `requireUser` / `requireAdmin` / `isAdmin`.

## 4. API
8. [x] `src/app/api/users/route.ts`: `GET` (lista) y `POST` (crear, ADMIN).
9. [x] `src/app/api/users/[id]/route.ts`: `PATCH` (editar/estado/reset, ADMIN).
10. [x] `src/app/api/profile/route.ts`: `GET` y `PATCH` (nombre propio).
11. [x] `src/app/api/profile/password/route.ts`: `POST` (cambio de contraseña).
12. [x] `src/lib/users.ts`: `publicUserSelect` (nunca devuelve `password`).

## 5. UI
13. [x] `src/components/family/FamilyManager.tsx`: lista + administración (ADMIN).
14. [x] `src/app/familia/page.tsx`: página (server) que pasa los miembros.
15. [x] `src/components/ProfileForm.tsx`: nombre + cambio de contraseña.
16. [x] `src/app/perfil/page.tsx`: página (server) con los datos propios.
17. [x] `src/components/Sidebar.tsx`: item "Familia" + enlace "Perfil".

## 6. Cierre
18. [x] `MEMORY.md`: marcar usuarios-roles como hecho y actualizar el foco.
19. [x] Verificación: `lint && typecheck && test (106) && build`.
20. [x] Verificación UI con Chrome MCP (crear miembro, login, permisos, baja).

## 7. Arreglo colateral (bug preexistente)
21. [x] `src/components/LoginForm.tsx`: navegación dura tras `signIn` para evitar
        la carrera con la cookie de sesión que devolvía al login.
