# ADR 002: PostgreSQL y despliegue en la nube

- **Fecha**: 2026-10-16
- **Estado**: Aceptado
- **Decisores**: Iván

## Contexto

El objetivo de casa-os es que la familia acceda a la app desde cualquier sitio,
no solo desde la red de casa. El despliegue original (ADR 001) asumía un equipo
siempre encendido en casa (Raspberry Pi / mini PC) con SQLite.

Ese supuesto no se cumple: no hay un equipo que pueda quedarse encendido de forma
permanente, y el usuario prefiere un alojamiento en la nube sin mantener hardware.
El hosting serverless (Vercel) no ofrece disco persistente, por lo que **SQLite no
es viable** allí.

## Opciones consideradas

| Opción | Pros | Contras |
|--------|------|---------|
| **Vercel + PostgreSQL gestionado** | Sin hardware, siempre disponible, deploy sencillo | Datos fuera de casa; requiere Postgres; el escaneo de red no funciona en serverless |
| VPS con PostgreSQL | Mantiene control, disco persistente | Coste mensual, administración del servidor |
| Mini PC en casa + túnel | Todo en casa, escaneo de red funciona | Requiere un aparato siempre encendido (descartado) |

## Decisión

1. **Migrar la base de datos de SQLite a PostgreSQL** (feature `feat/postgres`).
2. **Alojar en Vercel** con un PostgreSQL gestionado (Neon / Vercel Postgres),
   en la feature siguiente `feat/despliegue-vercel`.

En desarrollo local, PostgreSQL se levanta con Docker Compose (`docker compose
up -d db`, puerto 5433).

## Razones

- Serverless no persiste disco → SQLite descartado.
- Prisma abstrae el cambio de motor: los modelos no cambian, solo el `datasource`.
- Un Postgres gestionado ofrece persistencia, pooling y backups sin administración.

## Consecuencias

- **Positiva**: la app es accesible desde cualquier lugar sin hardware propio.
- **Positiva**: backups y alta disponibilidad delegados al proveedor.
- **Negativa**: los datos dejan de residir en casa (menor privacidad).
- **Negativa**: el **escaneo de red** (`nmap`) no puede ejecutarse en serverless;
  habrá que replantearlo en el Hito 2 (agente local o inventario manual).
- **Negativa**: el desarrollo local requiere Docker (contenedor de PostgreSQL).

## Notas de implementación

- Migración base: `prisma/migrations/0000_init`.
- Volcado de datos desde el SQLite antiguo: `npm run db:migrate-data` (idempotente).
- En producción, las migraciones se aplican con `prisma migrate deploy`.
