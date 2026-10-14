# Skill: casa-deploy

## Descripción

Guía de despliegue para casa-os. Cubre despliegue local, acceso externo
seguro, backups y mantenimiento.

## Activación

Usa esta skill cuando:
- Se vaya a desplegar la app por primera vez
- Se configura acceso desde fuera de casa
- Se vaya a hacer backup o restauración
- Se actualice la infraestructura

## Opciones de despliegue

### A. Desarrollo local

```bash
npm install
npm run db:push && npm run db:seed
npm run dev
```

### B. Producción en casa (recomendado)

```bash
npm ci
npm run build
npm start

# O con PM2 para gestión de proceso:
npm install -g pm2
pm2 start npm --name "casa-os" -- start
pm2 save
pm2 startup
```

### C. Acceso externo — Cloudflare Tunnel

```bash
brew install cloudflared  # macOS
# Linux: descargar de https://github.com/cloudflare/cloudflared/releases

cloudflared tunnel --url http://localhost:3000
# Genera una URL pública HTTPS como https://xxx.trycloudflare.net
```

### D. Acceso externo — Tailscale

```bash
brew install tailscale  # macOS
tailscale up
# Acceso vía IP interna desde cualquier dispositivo con Tailscale
```

### E. VPS (alternativa)

```bash
# En el servidor:
git clone https://github.com/ivaaancastro/casa-os.git
cd casa-os
npm ci
cp .env.example .env
# Editar .env
npm run build
npm start

# Recomendado: systemd o PM2 para auto-arranque
```

## Backups

```bash
npm run backup  # Crea backup.gz con timestamp en /backups/
```

**Recomendación**: Programar backup diario con cron:

```cron
0 3 * * * cd /Users/ivan/Documents/proyects/casa-os && npm run backup
```

## Restauración

```bash
gunzip backups/casa-os-2026-10-14-03-00-00.db.gz
cp backups/casa-os-2026-10-14-03-00-00.db prisma/dev.db
npm run db:generate
```

## Actualización de la app

```bash
git pull origin main
npm ci
npm run db:migrate
npm run build
pm2 restart casa-os  # si usas PM2
```

## Troubleshooting

### La app no arranca
1. Verificar que el puerto 3000 está libre: `lsof -i :3000`
2. Revisar logs: `pm2 logs casa-os` o salida de `npm start`
3. Verificar variables de entorno en `.env`

### Error de base de datos
1. Verificar que `prisma/dev.db` existe
2. `npm run db:push` para sincronizar schema
3. `npm run db:generate` para regenerar cliente Prisma

### No se puede acceder desde otro dispositivo
1. Verificar que ambos dispositivos están en la misma red
2. Verificar firewall del servidor
3. Usar IP correcta: `ipconfig getifaddr en0` (macOS)
