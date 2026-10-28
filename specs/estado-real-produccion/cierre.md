# Cierre — Corrección del estado real y desbloqueo de producción

**Estado:** cerrada
**Fecha:** 2026-10-28
**Tipo:** fix
**PR:** #34, squash merge `0e8803e`
**Rama:** `fix/estado-real-produccion` (eliminada)

## Resumen

Se desbloqueó producción (`P3009`), se retiró la UI fantasma de contraseñas y se
corrigieron los cierres que afirmaban funcionalidades inexistentes. El
repositorio, la documentación y Vercel reflejan ahora el estado real.

## Alcance entregado

- Script idempotente que repara la migración histórica fallida antes de
  `prisma migrate deploy`.
- Sidebar sin el enlace roto `/contrasenas`; dashboard alineado con el roadmap.
- Cierres honestos de 2FA, del prototipo de contraseñas y de la UI cancelada.
- `docs:check` y plantilla de cierre aceptan `Estado: cancelada`.
- Un solo gestor de paquetes: npm.

Fuera de alcance: Cuentas zero-knowledge, limpieza destructiva de la tabla
`PasswordEntry` y smoke autenticado de 2FA en producción.

## Cambios principales

| Área | Archivos | Qué cambió |
|---|---|---|
| Despliegue | `scripts/repair-known-migrations.mjs`, `package.json` | Reparación de la migración histórica en `vercel-build` |
| UI | `src/components/Sidebar.tsx`, `src/app/page.tsx` | Enlace roto retirado; módulos Familia/Cuentas |
| Docs | `docs/2fa.md`, `docs/gestor-contrasenas.md`, `docs/despliegue-vercel.md`, `docs/cierre-feature.md`, `docs/architecture.md`, `docs/roadmap.md` | Estado real y protocolo de cancelación |
| Specs | `specs/2fa/*`, `specs/gestor-contrasenas*/*`, `specs/_template/cierre.md` | Cierres corregidos y UI marcada como cancelada |
| Estado | `MEMORY.md`, `CHANGELOG.md`, `README.md` | Roadmap, registro, decisiones y lecciones |
| Paquetes | `package-lock.json` | Se eliminan `pnpm-lock.yaml` y `pnpm-workspace.yaml` |

## Verificación

### Código y tests

| Comando | Resultado |
|---|---|
| `npm run lint` | OK, sin avisos |
| `npm run typecheck` | OK |
| `npm run test` | 356 tests en 26 archivos |
| `npm run build` | OK; el build no genera `/contrasenas` |
| CI del PR #34 | Verde |
| CI de `main` | Verde (run `40665897804`). El cierre `67fe675` pasó tras un rerun: el primer intento falló de forma transitoria al descargar `next/font` |

### Script de reparación

Probado en una base PostgreSQL temporal:

1. Base vacía → «No hay historial de Prisma todavía».
2. Migraciones aplicadas → 7 migraciones.
3. Migración fallida simulada → marcada como `rolled-back`.
4. Segunda ejecución → «sin fallo pendiente» (idempotente).
5. `prisma migrate deploy` posterior → sin migraciones pendientes.

### UI / Chrome

- Chromium del agente sobre el build de producción.
- Sidebar: Dashboard, Dispositivos, Notas, Calendario, Familia. **Sin
  «Contraseñas».**
- Dashboard: Familia (Disponible) y Cuentas (Planificado); sin Inventario ni
  Gastos.
- Sin errores visibles en la página.

### Producción

| Campo | Valor |
|---|---|
| URL | <https://casa-os-mauve.vercel.app> |
| Deployment | `dpl_6mQZz8KvrbyZVrQqq3xh8zoZkzjg` (*Ready*, alias de producción) |
| Commit | `0e8803e` |
| Build | `[migraciones] 2026102820_add_password_entry: sin fallo pendiente` · 7 migraciones · *No pending migrations to apply* |
| Health | `GET /api/health` → `200` (`db: ok`) |
| Rutas | `/api/2fa/status` sin sesión → `401`; `/auth/login` → `200`; `/contrasenas` → `307` al login |
| Sidebar | Verificado en Chromium: sin «Contraseñas» |

> El preview deployment del PR reparó Neon antes del merge; el deployment de
> producción encontró la migración ya resuelta y no tuvo nada pendiente. El
> resultado es el mismo: el build deja de fallar con `P3009`.

## Documentación actualizada

- [x] `MEMORY.md`: decisiones, roadmap, foco, registro, notas y lecciones.
- [x] `CHANGELOG.md`: 2FA, reparación de producción, descarte del gestor y
  correcciones documentales.
- [x] `README.md`: 2FA, `TOTP_ENCRYPTION_KEY`, reparación de migraciones y
  enlaces.
- [x] `docs/2fa.md`: guía completa.
- [x] `docs/gestor-contrasenas.md`: prototipo real, sin UI y no zero-knowledge.
- [x] `docs/despliegue-vercel.md`: variable, script, `P3009` y verificación.
- [x] `docs/cierre-feature.md` y `specs/_template/cierre.md`: estado
  `cancelada`.
- [x] `docs/architecture.md` y `docs/roadmap.md`: 2FA y Cuentas.
- [x] `specs/2fa/*`, `specs/gestor-contrasenas/*`, `specs/gestor-contrasenas-ui/*`.
- [x] `npm run docs:check -- estado-real-produccion` pasa.

## Tareas

### Completadas

- Reproducción y diagnóstico de `P3009`.
- Script de reparación, integración en `vercel-build` y prueba en local.
- Retirada del enlace roto y alineación del dashboard.
- Corrección de los tres cierres y de la documentación afectada.
- Verificación local, CI, UI y producción.

### Pendientes / follow-ups

- **Cuentas zero-knowledge** (`/cuentas`): siguiente feature; requiere
  `plan.md` y `spec.md` aprobados. No se abre hasta que este cierre esté
  mergeado (hecho) y el CI de `main` verde (hecho).
- **Tabla `PasswordEntry`**: si quedó creada a medias en Neon, no se borra
  automáticamente. Limpiarla exige copia de seguridad y confirmación explícita.
- **Smoke autenticado de 2FA en producción**: no ejecutado por falta de
  credenciales del agente; verificado en local. Lo puede confirmar el usuario.
- **Retirar `/api/passwords` y `encryptedPasswords`** cuando Cuentas esté
  cerrada.

## Decisiones y lecciones

- **Reparar en el build, no a mano**: un script cerrado y idempotente deja el
  arreglo versionado y evita que el siguiente deployment vuelva a fallar.
- **Un preview deployment también toca la base**: al compartir `DATABASE_URL`
  entre Production y Preview, el build del PR reparó Neon antes del merge. Hay
  que tenerlo en cuenta al interpretar logs.
- **`docs:check` valida forma, no verdad**: los cierres falsos pasaban. Hay que
  contrastar cada archivo citado con `git ls-files`.
- **Cancelar no es cerrar como hecho**: una feature descartada se marca
  `cancelada`, se retira lo que la anunciaba y se documenta qué la sustituye.
- **`next/font/google` puede fallar en CI sin cambios de código**: la descarga
  de Bodoni Moda/Jost devolvió una respuesta inesperada y el build falló dos
  veces; un rerun pasó. Se registra como fallo transitorio, no como regresión.

## Riesgos residuales

- La tabla `PasswordEntry` puede seguir en Neon sin usarse; es inocua, pero
  conviene limpiarla con confirmación.
- El prototipo `/api/passwords` sigue en el código hasta que Cuentas lo
  sustituya; no debe usarse con credenciales reales.
- El smoke autenticado de 2FA en producción sigue sin repetirse; el riesgo es
  una regresión de entorno que solo se vería al iniciar sesión.

## Checklist de cierre

- [x] PR #34 mergeado (squash) y rama eliminada.
- [x] CI de `main` verde tras el merge.
- [x] Producción desplegada y verificada (health, rutas, sidebar).
- [x] `tasks.md` sin casillas pendientes.
- [x] `cierre.md` sin casillas pendientes.
- [x] `MEMORY.md` enlaza este cierre y tiene el registro actualizado.
- [x] `CHANGELOG.md`, `README.md` y `docs/*` al día.
- [x] `npm run docs:check -- estado-real-produccion` pasa.
