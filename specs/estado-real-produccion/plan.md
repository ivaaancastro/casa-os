# Plan — Corrección del estado real y desbloqueo de producción

**Rama:** `fix/estado-real-produccion`
**Tipo:** fix (corrección de estado, documentación y despliegue)
**Fecha:** 2026-10-28

## Contexto

Al revisar el cierre de 2FA se detectaron tres problemas encadenados:

1. **Producción atascada**: todos los deployments posteriores a `562c9b0`
   fallaban con `P3009` porque la migración histórica
   `2026102820_add_password_entry` (PR #31, revertida en `90b3fbe`) seguía
   marcada como fallida en Neon.
2. **Documentación falsa**: `specs/2fa`, `specs/gestor-contrasenas` y
   `specs/gestor-contrasenas-ui` afirmaban tests, UI, import/export, PBKDF2 y
   despliegues que no existían.
3. **UI fantasma**: el sidebar enlazaba `/contrasenas`, una ruta que el build
   nunca generó.

El usuario aprobó reparar la migración con un script idempotente ejecutado
desde el build.

## Enfoque

- Rama `fix/estado-real-produccion` desde `main` (`989ff54`).
- `scripts/repair-known-migrations.mjs`: comprueba `_prisma_migrations` y marca
  como `rolled-back` **solo** la migración histórica conocida.
- `vercel-build`: script → `prisma migrate deploy` → `next build`.
- Retirar el enlace `/contrasenas` y alinear los módulos del dashboard.
- Reescribir cierres y documentación con el alcance real; no inventar
  verificación de producción.
- Unificar el gestor de paquetes en npm.

## Dependencias

- Acceso al historial de Vercel (`vercel ls/inspect`).
- Base PostgreSQL local para probar el script (Docker, puerto 5433).
- No se modifican migraciones ni el esquema.

## Riesgos y mitigación

| Riesgo | Mitigación |
|---|---|
| El script resuelve un fallo nuevo por error | Lista cerrada a una sola migración; si no está fallida, no hace nada |
| `prisma migrate resolve` toca datos | Solo actualiza `_prisma_migrations`; no ejecuta SQL de la migración |
| El build se queda sin base de datos | Falla de forma visible; no se silencian errores |
| La tabla `PasswordEntry` quedó a medias | No se borra automáticamente; se documenta como resto a limpiar con confirmación |
| Se vuelve a documentar algo no verificado | Solo se registra lo observado en local, CI y Vercel |
