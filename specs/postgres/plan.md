# Plan — Migración a PostgreSQL

## Contexto

El objetivo del usuario es **alojar casa-os en la nube** (Vercel) para acceder
desde cualquier sitio sin depender de un equipo encendido en casa. El hosting
serverless no tiene disco persistente, así que **SQLite no es viable**. Este
feature migra la base de datos a **PostgreSQL** y deja el proyecto listo para
producción; es **verificable por completo en local** (con Docker).

Se separa del despliegue para reducir riesgo y revisar en dos pasos:
1. **`feat/postgres`** (este): base de datos + datos + dev local.
2. `feat/despliegue-vercel`: despliegue en Vercel, variables de entorno,
   cabeceras de seguridad y documentación.

> Sustituye al antiguo `feat/acceso-remoto` (el túnel ya no aplica: la app deja
> de correr en casa).

## Enfoque técnico

- **Prisma**: `provider = "postgresql"`; `url = env("DATABASE_URL")` y
  `directUrl = env("DIRECT_URL")` (necesario con poolers tipo Neon/Vercel).
- **Migraciones**: crear una **migración base** `prisma/migrations/0000_init`
  generada con `prisma migrate diff` (no interactivo) e incluirla en el repo. En
  producción se aplicará con `prisma migrate deploy`.
- **Dev local**: `docker-compose.yml` con PostgreSQL 16. `DATABASE_URL`/`DIRECT_URL`
  apuntan a `localhost:5432`. `.env.example` y `README` documentados.
- **Migración de datos**: `scripts/migrate-sqlite-to-postgres.ts` lee el
  `prisma/dev.db` actual con **`node:sqlite`** (nativo en Node 22, sin dependencias)
  y lo vuelca a Postgres con Prisma, **idempotente** y preservando ids y relaciones.
- **Scripts npm**: `db:migrate:deploy`, `db:reset`; `backup` adaptado a Postgres.
- `scripts/scan-network.ts` se mantiene para uso local (no aplica en serverless).

## Dependencias

- [x] Docker — disponible en el entorno.
- [ ] URL de PostgreSQL (para producción) — se usará en la fase 2.

## Riesgos

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|------------|
| Pérdida de datos al migrar | Media | Alto | Volcado idempotente + backup previo del `dev.db` |
| Drift de migraciones | Baja | Alto | Migración base única; prod siempre con `migrate deploy` |
| Pooling en serverless | Media | Medio | `directUrl` + provider con pooler en la fase 2 |
| Dev local requiere Postgres | Alta | Bajo | `docker compose up -d db` documentado |

## Fuera de alcance

- Despliegue en Vercel (fase 2).
- Cabeceras de seguridad / hardening (fase 2).
- Escaneo de red (no viable en serverless; se replanteará en el Hito 2).
- Migración a otro proveedor de BD distinto del Postgres estándar.
