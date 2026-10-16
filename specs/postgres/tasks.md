# Tasks — Migración a PostgreSQL

## 1. Preparación
1. [x] Backup del `prisma/dev.db` actual (seguridad) antes de tocar nada.
2. [x] `docker-compose.yml` con PostgreSQL 16 (dev local).
3. [x] `.env.example`: `DATABASE_URL` + `DIRECT_URL` (Postgres) documentados.

## 2. Prisma → PostgreSQL
4. [x] `prisma/schema.prisma`: `provider = "postgresql"`, `url` + `directUrl`.
5. [x] Migración base `prisma/migrations/0000_init` (con `prisma migrate diff`) +
       `migration_lock.toml`.
6. [x] `package.json`: `db:migrate:deploy`, `db:reset`, `db:migrate-data`,
       `postinstall` (`prisma generate`); adaptar `backup`.

## 3. Datos
7. [x] `scripts/migrate-sqlite-to-postgres.ts`: volcado idempotente
       (`node:sqlite` → Prisma), preservando ids y relaciones.
8. [x] `scripts/backup-db.ts`: adaptado a Postgres (`pg_dump`).

## 4. Verificación
9. [x] Levantar Postgres (`docker compose up -d db`).
10. [x] `prisma migrate deploy` + `db:seed`.
11. [x] `npm run db:migrate-data` y comprobar que los datos coinciden (y que
        reejecutar no duplica). Verificado: 1 usuario, 3 notas, 2 dispositivos.
12. [x] `lint && typecheck && test && build` (106 tests).
13. [x] Smoke test con Chrome MCP contra Postgres (login, notas, familia, alta/baja
        de nota vía API).

## 5. Cierre
14. [x] `README` actualizado (dev local con Docker + nota de nube).
15. [x] `MEMORY.md`: sustituir `acceso-remoto` por `postgres` (hecho) +
        `despliegue-vercel` (siguiente).
