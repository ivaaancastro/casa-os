# Changelog

Todos los cambios notables en este proyecto se documentarán en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/),
y este proyecto se adhiere al [Versionado Semántico](https://semver.org/lang/es/).

---

## [Sin lanzar]

### Added

- **Autenticación en dos pasos (2FA)**: TOTP de 6 dígitos compatible con apps
  estándar, 10 códigos de recuperación de un solo uso, activación con QR o clave
  manual desde **Perfil → Seguridad**, desactivación y regeneración con
  contraseña + segundo factor, reset por ADMIN desde **Familia** y script de
  emergencia `npm run 2fa:reset -- <email>`. El secreto se cifra con
  AES-256-GCM, `sessionVersion` invalida los JWT anteriores, hay rate limit de
  5 fallos/15 min y auditoría sin secretos. Guía: `docs/2fa.md`.
- **Recordatorios Web Push**: avisos de eventos del calendario en navegador o
  PWA, activación por dispositivo, envío de prueba, panel **Avisos** con
  próximos recordatorios y enlace profundo al día del evento. Incluye VAPID,
  suscripciones, deduplicación de entregas, scheduler de GitHub Actions cada 5
  minutos y guía en `docs/recordatorios.md`. Verificado en producción el
  2026-10-26 con una suscripción FCM real, aviso de prueba y recordatorio
  recibido una sola vez.
- **Calendario familiar**: vistas de mes y semana, eventos con hora o de todo el
  día, responsable opcional y recordatorio almacenado. Cualquier miembro activo
  puede crear; solo el creador o un ADMIN puede editar o borrar. Incluye API
  autenticada, migración aditiva, tests y guía en `docs/calendario.md`.
- Notas familiares con editor enriquecido (estilo Apple Notas) y carpetas
- Dispositivos: CRUD manual con IP/MAC únicas, tipo, propietario, notas y
  estado online de solo lectura; ADMIN escribe y FAMILY solo lee
- Escaneo de red local con nmap: salida JSON, previsualización e importación de
  equipos nuevos con deduplicación por IP/MAC y detección de conflictos
  (`docs/escaneo-red.md`)
- Estado de dispositivos al aplicar un escaneo: en línea/ausente, última vez
  visto, proyección de altas y bajas antes de aplicar y aviso de frescura si el
  último dato tiene más de 24 h. Sin cambios de esquema.
- PWA instalable: manifest, iconos, service worker y página sin conexión
  (`docs/pwa.md`)
- Gestión de usuarios y roles (ADMIN/FAMILY), baja lógica y perfil propio con
  cambio de contraseña
- Diseño editorial (Inditex) con tipografías Bodoni Moda + Jost
- Configuración de Tailwind CSS con paleta de colores personalizada
- Scripts de utilidad: `scan-network.ts` y `backup-db.ts`
- `GET /api/health` (público): estado de la app y de la base de datos
- CI con GitHub Actions (lint, typecheck, test y build)
- Issue templates para bugs y features
- Skills de OpenCode para desarrollo, despliegue y router
- Documentación completa: README, AGENTS.md, MEMORY.md
- Protocolo de cierre de feature (`docs/cierre-feature.md`), plantilla
  `specs/_template/cierre.md` y comprobación `npm run docs:check`
- Registro de cierre por feature en `specs/<nombre>/cierre.md`

### Changed

- **Base de datos: SQLite → PostgreSQL** (requisito para desplegar en la nube).
  Añadida migración base `prisma/migrations/0000_init`, PostgreSQL de desarrollo
  con Docker Compose (`docker compose up -d db`), script de volcado de datos
  (`db:migrate-data`) y backup con `pg_dump`.
- `AGENTS.md`, `docs/architecture.md` y ADRs actualizados a PostgreSQL
  (nuevo ADR 002).
- Preparado el despliegue en Vercel: script `vercel-build`, cabeceras de
  seguridad y guía `docs/despliegue-vercel.md`.
- **Desplegado en producción**: <https://casa-os-mauve.vercel.app> (Vercel +
  Neon), con migraciones automáticas en el build.
- **Dispositivos verificado en producción** (PR #16, commit `3e38e80`,
  deployment `AN59fx6pKkakZqNB5qeQ3v1h1Q4U`): health, cabeceras, rutas
  protegidas y smoke autenticado.
- `Device.ip` y `Device.mac` con índice único. La migración no borra datos:
  aborta con un error claro si encuentra duplicados.
- **Cierre documental obligatorio** tras cada feature: `tasks.md` sin
  pendientes, `cierre.md`, MEMORY/CHANGELOG/README/docs actualizados y PR
  `docs/cierre-<nombre>` antes de la siguiente feature.
- `npm run test` ejecuta Vitest en una pasada; `npm run test:watch` para watch.
- **Escáner de red**: valida el CIDR, usa `execFile` (sin shell), soporta
  `--out`, `--json` y `--cidr`, y normaliza MAC. La importación se previsualiza
  con `dryRun` y solo crea equipos nuevos (`POST /api/devices/import`).
- La ruta de importación de escaneo queda fuera del middleware de redirección
  para devolver `401`/`403` JSON; sigue protegida por `requireAdmin`.
- **Importación de escaneos con estado**: la UI envía todas las filas (no solo
  las nuevas) y `importIps` con la selección; la API actualiza `online` y
  `lastSeen`, marca ausentes solo dentro del CIDR y nunca pisa un `lastSeen`
  posterior. Los equipos nuevos nacen en línea.
- **Escaneo de red verificado en producción** (PRs #18, #19 y #20; commit
  `5835fd2`): panel ADMIN con preview de fixture, móvil 390 px sin overflow y
  consola limpia. FAMILY verificado en local; sin credencial FAMILY en
  producción. Cuenta temporal desactivada tras el smoke.
- **API de eventos**: se excluye `/api/events` del middleware para que las rutas
  devuelvan `401` JSON en vez de redirigir al login, manteniendo `requireUser`
  en cada handler.
- Dashboard y sidebar actualizados: Calendario aparece como módulo disponible y
  enlaza a `/calendario`.
- **Calendario verificado en producción** (PR #24, commit `94a4d40`, deployment
  `CYckvdS6Bf8bMXKz1HkRH223bdEn`): health y rutas públicas OK, `/api/events` sin
  sesión → `401` JSON y smoke autenticado ADMIN con alta, edición, recordatorio
  y borrado. Evento temporal eliminado; la API quedó con 0 eventos.
- **Recordatorios verificados en producción** (PR #26, commit `76f0683`; PR #27
  de documentación, commit `bfb7477`; deployment de verificación
  `dpl_GLUPgBsHBLV6k7MXAP11mikGiVKr`): health `200`, workflow `Recordatorios`
  activo cada 5 minutos y VAPID/`CRON_SECRET`/`HOUSE_TIMEZONE`/`CASA_OS_URL`
  configurados. Suscripción FCM real, aviso de prueba `sent:1`, recordatorio de
  evento `sent:1` y segunda ejecución `skipped:1` por deduplicación. Datos y
  suscripciones de prueba eliminados; feature cerrada.
- **PWA**: el service worker sube a `CACHE_VERSION = v2` para añadir `push` y
  `notificationclick`, limpiar la caché de la PWA anterior y mantener la
  política de no cachear APIs ni datos privados.
- **Calendario**: el formulario de evento ahora explica que el aviso se enviará
  a los dispositivos con los avisos activados, en lugar de anunciar una entrega
  futura.
- **API de push y reminders** excluida del middleware de redirección para
  devolver `401` JSON; el dispatch queda protegido por `CRON_SECRET`.
- **`vercel-build` repara la migración histórica fallida** antes de
  `prisma migrate deploy` mediante `scripts/repair-known-migrations.mjs`,
  limitado a `2026102820_add_password_entry`. Desbloquea los deployments que
  fallaban con `P3009` sin tocar migraciones nuevas.
- **Gestor de contraseñas descartado**: el prototipo server-side (PR #32) y su
  UI inexistente (PR #33) se documentan como no aptos para uso real y se
  sustituyen por **Cuentas** zero-knowledge. Se retiró el enlace
  `/contrasenas` del sidebar, que apuntaba a una ruta inexistente.
- **Lockfile único**: se eliminan `pnpm-lock.yaml` y `pnpm-workspace.yaml`; el
  proyecto y la CI usan npm (`package-lock.json`).

### Fixed

- **Producción atascada (`P3009`)**: reparación de la migración histórica
  `2026102820_add_password_entry`, revertida en el repo pero aún fallida en
  Neon. El build aplica ahora `20261028200000_add_encrypted_passwords_to_user` y
  vuelve a desplegar. Verificado en el PR #34 (merge `0e8803e`): deployment
  `dpl_6mQZz8KvrbyZVrQqq3xh8zoZkzjg` *Ready*, `/api/health` `200` y sidebar sin
  «Contraseñas».
- **Cierres documentales falsos**: se corrigieron `specs/2fa`,
  `specs/gestor-contrasenas` y `specs/gestor-contrasenas-ui`, que afirmaban UI,
  import/export, PBKDF2 y despliegues inexistentes. `docs:check` acepta ahora
  el estado `cancelada`.
- Panel **Avisos**: el contador de dispositivos se actualiza al sincronizar una
  suscripción que ya existía en el navegador pero no en el servidor.
- Login: usar navegación dura tras `signIn` para no adelantarse al `Set-Cookie`
  de la sesión
- Panel de escaneo: concordancia singular/plural en el resumen (`1 nuevo`,
  `1 ya existente`) y comando de ejemplo completo en móvil.
- Panel de evento: se renderiza en un portal sobre `document.body` para que un
  ancestro con `transform` no limite el `position: fixed`; así cubre todo el
  viewport en móvil y no se superpone con el botón del menú.
- Metadatos PWA: añadido `mobile-web-app-capable` junto al de Apple para evitar
  el aviso de deprecación en consola.

---

## [0.1.0] - 2026-10-14

### Added

- Inicialización del proyecto con Next.js 14 App Router
- Configuración de TypeScript strict
- Esquema Prisma con modelos User, Note y Device
- Seed de base de datos con datos de ejemplo
- Escáner de red local con nmap
- Script de backup de base de datos
- Configuración de NextAuth (pendiente de implementar)

[0.1.0]: https://github.com/ivaaancastro/casa-os/releases/tag/v0.1.0
[Sin lanzar]: https://github.com/ivaaancastro/casa-os/compare/v0.1.0...HEAD
