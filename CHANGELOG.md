# Changelog

Todos los cambios notables en este proyecto se documentarán en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/),
y este proyecto se adhiere al [Versionado Semántico](https://semver.org/lang/es/).

---

## [Sin lanzar]

### Added

- Notas familiares con editor enriquecido (estilo Apple Notas) y carpetas
- Gestión de usuarios y roles (ADMIN/FAMILY), baja lógica y perfil propio con
  cambio de contraseña
- Diseño editorial (Inditex) con tipografías Bodoni Moda + Jost
- Configuración de Tailwind CSS con paleta de colores personalizada
- Scripts de utilidad: `scan-network.ts` y `backup-db.ts`
- CI con GitHub Actions (lint, typecheck, build)
- Issue templates para bugs y features
- Skills de OpenCode para desarrollo, despliegue y router
- Documentación completa: README, AGENTS.md, MEMORY.md

### Changed

- **Base de datos: SQLite → PostgreSQL** (requisito para desplegar en la nube).
  Añadida migración base `prisma/migrations/0000_init`, PostgreSQL de desarrollo
  con Docker Compose (`docker compose up -d db`), script de volcado de datos
  (`db:migrate-data`) y backup con `pg_dump`.
- `AGENTS.md`, `docs/architecture.md` y ADRs actualizados a PostgreSQL
  (nuevo ADR 002).
- Preparado el despliegue en Vercel: script `vercel-build`, cabeceras de
  seguridad y guía `docs/despliegue-vercel.md`.

### Added

- `GET /api/health` (público): estado de la app y de la base de datos.

### Fixed

- Login: usar navegación dura tras `signIn` para no adelantarse al `Set-Cookie`
  de la sesión

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
