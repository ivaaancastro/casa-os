# Spec — Corrección del estado real y desbloqueo de producción

**Tipo:** fix
**Estado:** implementado y verificado
**Fecha:** 2026-10-28
**Rama:** `fix/estado-real-produccion`

## Objetivo

Dejar el repositorio, la documentación y producción en un estado que coincida
con la realidad: desbloquear Neon, retirar la UI fantasma y corregir los cierres
que afirmaban funcionalidades inexistentes.

## Requisitos funcionales

1. El build de Vercel debe reparar la migración histórica fallida
   `2026102820_add_password_entry` de forma idempotente y limitada a esa
   migración.
2. Tras la reparación, `prisma migrate deploy` debe aplicar las migraciones
   pendientes y el build debe terminar *Ready*.
3. El sidebar no debe enlazar `/contrasenas` mientras la sección no exista.
4. Los cierres de `2fa`, `gestor-contrasenas` y `gestor-contrasenas-ui` deben
   reflejar lo realmente entregado.
5. `docs:check` debe aceptar cierres con `Estado: cancelada`.
6. El proyecto debe usar un único lockfile (`package-lock.json`).

## Requisitos no funcionales

- El script no debe borrar datos ni ejecutar SQL destructivo.
- Cualquier fallo de migración distinto del conocido debe detener el build.
- No se documentan secretos, credenciales ni valores de variables.
- No se inventan PRs, commits, deployments ni verificaciones.

## Fuera de alcance

- Implementar Cuentas zero-knowledge (siguiente feature, requiere spec propia).
- Borrar la tabla `PasswordEntry` que pudo quedar a medias en Neon.
- Repetir el smoke autenticado de 2FA en producción (no hay credenciales).
- Cambiar el esquema o crear migraciones nuevas.

## Criterios de aceptación

1. `npm run lint`, `typecheck`, `test` y `build` pasan.
2. `docs:check -- 2fa`, `-- gestor-contrasenas` y `-- gestor-contrasenas-ui`
   pasan.
3. El script se prueba en una base temporal: base vacía, migración fallida
   simulada, reparación e idempotencia.
4. El PR mergeado dispara un deployment *Ready* en Vercel.
5. `/api/health` → `200`, `/api/2fa/status` sin sesión → `401`, `/auth/login` →
   `200`.
6. El sidebar de producción no muestra «Contraseñas».
7. CI de `main` verde y sin PRs abiertos antes de abrir Cuentas.

## Decisión sobre el gestor de contraseñas

El prototipo server-side se conserva por historial, pero se documenta como **no
apto para uso real** y **no zero-knowledge**. Su UI se marca como **cancelada**.
La sección definitiva será **Cuentas** (`/cuentas`), con cifrado en el cliente.
