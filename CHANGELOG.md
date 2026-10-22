# Changelog

Todos los cambios notables en este proyecto se documentarán en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/),
y este proyecto se adhiere al [Versionado Semántico](https://semver.org/lang/es/).

---

## [Sin lanzar]

### Added

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

### Fixed

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
