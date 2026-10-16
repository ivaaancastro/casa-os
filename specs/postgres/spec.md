# Spec — Migración a PostgreSQL

> Feature `feat/postgres` (fase 1 de 2 de "despliegue en la nube").
> Estado: **pendiente de aprobación**.

## Requisitos funcionales

1. **RF1 — Prisma sobre PostgreSQL**. `datasource` pasa a `postgresql`; la app
   funciona igual (misma funcionalidad) contra Postgres.
2. **RF2 — Migración base**. Existe `prisma/migrations/0000_init`; `prisma migrate
   deploy` deja el esquema listo en una base vacía.
3. **RF3 — Dev local con Docker**. `docker compose up -d db` levanta PostgreSQL 16
   y la app arranca contra él. Documentado en `README` y `.env.example`.
4. **RF4 — Seed en Postgres**. `npm run db:seed` crea el admin
   (`admin@casa.local`) sin errores.
5. **RF5 — Migración de datos**. `npm run db:migrate-data` copia `User`, `Account`,
   `Session`, `Note` y `Device` desde el `prisma/dev.db` a Postgres, preservando
   ids y relaciones y de forma **idempotente** (se puede reejecutar sin duplicar).
6. **RF6 — Backup**. `npm run backup` funciona con Postgres (vía `pg_dump`) y
   documenta que en la nube el proveedor ya ofrece copias.

## Requisitos no funcionales

- **Sin pérdida de datos**: backup previo del `dev.db` antes de migrar.
- **Config por entorno**: `.env.example` documenta `DATABASE_URL` y `DIRECT_URL`.
- **Reproducible**: cualquier máquina levanta la BD con Docker en un comando.
- **Compatibilidad**: los modelos no cambian (Boolean/String ya son portables).

## Modelo de datos

`prisma/schema.prisma` — solo cambia el `datasource`:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

Sin cambios en los modelos (`User`, `Account`, `Session`, `VerificationToken`,
`Note`, `Device`).

## Scripts / comandos

### `docker compose up -d db`
Levanta PostgreSQL 16 en `localhost:5432` (usuario/clave/base de desarrollo).

### `npm run db:migrate:deploy`
Aplica las migraciones (`prisma migrate deploy`).

### `npm run db:seed`
Pobla datos iniciales (admin).

### `npm run db:migrate-data`
Vuelca los datos del SQLite actual a Postgres (idempotente).

### `npm run backup`
Copia de seguridad de la base de datos Postgres.

## Criterios de aceptación

- [ ] `docker compose up -d db` levanta la base.
- [ ] `prisma migrate deploy` crea el esquema en una base vacía.
- [ ] `npm run db:seed` crea el admin.
- [ ] Tras `npm run db:migrate-data`, Postgres contiene el mismo admin, notas y
      dispositivos que `prisma/dev.db` (comprobado).
- [ ] Reejecutar `db:migrate-data` no duplica filas.
- [ ] `npm run lint && npm run typecheck && npm run test && npm run build` en verde.
- [ ] Smoke test con Chrome MCP contra Postgres local: login, notas y familia.
