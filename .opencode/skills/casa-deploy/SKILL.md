# Skill: casa-deploy

## Descripción

Guía de despliegue para casa-os. Cubre desarrollo local, despliegue en la nube,
backups y mantenimiento.

## Activación

Usa esta skill cuando:
- Se vaya a desplegar la app
- Se configuren base de datos o variables de entorno
- Se vaya a hacer backup o restauración
- Se actualice la infraestructura

## Base de datos

La app usa **PostgreSQL** (ya no SQLite). En desarrollo se levanta con Docker:

```bash
docker compose up -d db      # PostgreSQL 16 en localhost:5433
npm run db:migrate:deploy    # aplica migraciones
npm run db:seed              # datos iniciales (admin@casa.local)
```

> El puerto de desarrollo es **5433** porque el 5432 lo ocupa otro proyecto
> (`nexus-postgres`). En la nube se usa una URL gestionada (`DATABASE_URL` +
> `DIRECT_URL`).

## A. Desarrollo local

```bash
npm install
docker compose up -d db
npm run db:migrate:deploy && npm run db:seed
npm run dev
```

## B. Despliegue en la nube (Vercel + PostgreSQL)

> En preparación (feature `despliegue-vercel`). La app ya está lista para
> PostgreSQL; la guía paso a paso se añadirá con el despliegue real.
>
> Esbozo: conectar el repo a Vercel, provisionar Postgres (Neon/Vercel Postgres),
> definir `DATABASE_URL`, `DIRECT_URL`, `NEXTAUTH_URL` y `NEXTAUTH_SECRET`, y
> aplicar migraciones en el build (`prisma migrate deploy`).

## C. Producción en un servidor propio (alternativa)

```bash
git clone https://github.com/ivaaancastro/casa-os.git
cd casa-os
npm ci
cp .env.example .env   # ajustar DATABASE_URL/DIRECT_URL al Postgres del servidor
npm run db:migrate:deploy
npm run build
npm start

# Auto-arranque recomendado: systemd o PM2
```

Para acceso desde fuera de casa sin abrir puertos, **Tailscale** (red privada) es
la vía sencilla.

## Backups

```bash
npm run backup  # pg_dump comprimido con timestamp en /backups/
```

- Localmente, si no hay `pg_dump` en el sistema, el script usa el contenedor de
  Docker Compose.
- En la nube (Neon/Vercel Postgres) el proveedor ya ofrece copias y restauración
  a un instante; este script es para copias manuales/portables.

Backup diario con cron:

```cron
0 3 * * * cd /Users/ivan/Documents/proyects/casa-os && npm run backup
```

## Restauración

```bash
gunzip -c backups/casa-os-<timestamp>.sql.gz | psql "$DATABASE_URL"
```

Para recrear el esquema desde cero: `npm run db:migrate:deploy`.

## Actualización de la app

```bash
git pull origin main
npm ci
npm run db:migrate:deploy
npm run build
# reiniciar el proceso (pm2 restart casa-os / restart del servicio)
```

## Migrar datos desde el SQLite antiguo

```bash
npm run db:migrate-data   # vuelca prisma/dev.db → PostgreSQL (idempotente)
```

## Troubleshooting

### La app no arranca
1. Verificar que el puerto 3000 está libre: `lsof -i :3000`
2. Revisar variables de entorno en `.env`
3. `npm run build` para ver errores de compilación

### Error de base de datos
1. Verificar que Postgres está arriba (`docker compose ps` o el estado del
   proveedor)
2. `npm run db:migrate:deploy` para aplicar migraciones
3. `npm run db:generate` para regenerar el cliente Prisma

### No se puede acceder desde otro dispositivo
1. Verificar que ambos dispositivos están en la misma red (o Tailscale)
2. Verificar firewall del servidor
3. Usar la IP correcta: `ipconfig getifaddr en0` (macOS)
