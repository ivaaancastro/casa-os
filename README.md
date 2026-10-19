# 🏠 casa-os

> Sistema operativo para tu hogar — gestión de dispositivos, notas familiares y más.

**casa-os** es una aplicación web personal para centralizar todos los datos de tu casa. Diseñada para uso familiar, con acceso desde cualquier dispositivo.

## Características

| Sección | Estado | Descripción |
|---------|--------|-------------|
| 📊 Dashboard | 🚧 En desarrollo | Resumen de la casa de un vistazo |
| 🖥️ Dispositivos | 🚧 En desarrollo | Escaneo y control de dispositivos en la red |
| 🛒 Notas / Compra | 🚧 En desarrollo | Notas compartidas para toda la familia |
| 📅 Calendario | 📋 Planificado | Calendario familiar compartido |
| 📦 Inventario | 📋 Planificado | Control de objetos, caducidades y garantías |
| 💰 Gastos | 💡 Idea | Registro y reparto de gastos del hogar |
| 🔧 Mantenimiento | 💡 Idea | Tareas recurrentes y historial |
| 📄 Documentos | 💡 Idea | Facturas, seguros y manuales |

**Leyenda**: 🚧 En desarrollo · 📋 Planificado · 💡 Idea

## Stack

- **[Next.js 14](https://nextjs.org/)** (App Router) — Framework full-stack React
- **[TypeScript](https://www.typescriptlang.org/)** — Tipado estático
- **[Prisma](https://www.prisma.io/)** + **[PostgreSQL](https://www.postgresql.org/)** — ORM y base de datos
- **[NextAuth.js](https://next-auth.js.org/)** — Autenticación
- **[Tailwind CSS](https://tailwindcss.com/)** — Estilos
- **[Vitest](https://vitest.dev/)** — Tests

## Requisitos

- Node.js >= 20
- npm >= 10
- Docker (para PostgreSQL en desarrollo): [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- nmap (opcional, para escaneo de red): `brew install nmap`

## Inicio rápido

```bash
# 1. Clonar el repositorio
git clone https://github.com/ivaaancastro/casa-os.git
cd casa-os

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env y cambiar NEXTAUTH_SECRET

# 4. Levantar PostgreSQL y preparar la base de datos
docker compose up -d db
npm run db:migrate:deploy
npm run db:seed

# 5. Arrancar en desarrollo
npm run dev
```

La aplicación estará disponible en **http://localhost:3000**

## Despliegue

La aplicación usa **PostgreSQL** (ya no SQLite). Necesitas una base de datos
PostgreSQL accesible desde donde corra la app.

### Base de datos

- **Desarrollo**: `docker compose up -d db` levanta PostgreSQL en `localhost:5433`.
- **Producción**: usa una URL gestionada (Neon, Vercel Postgres…) y configura
  `DATABASE_URL` y `DIRECT_URL`.

```bash
npm run db:migrate:deploy   # crea el esquema
npm run db:migrate-data     # (opcional) migra datos desde un prisma/dev.db antiguo
npm run db:seed             # datos iniciales
```

### Opción A: En local (red de casa)

```bash
docker compose up -d db
npm run build
npm start
```

Acceso desde cualquier dispositivo en la misma red: `http://IP-DEL-SERVIDOR:3000`.
Para acceder desde fuera de casa, **Tailscale** (red privada) es la vía sencilla.

### Opción B: Nube (Vercel + PostgreSQL) — recomendado

Vercel despliega en cada push a `main` y aplica las migraciones en el build
(`npm run vercel-build`). Guía completa paso a paso:
**[`docs/despliegue-vercel.md`](docs/despliegue-vercel.md)**.

Resumen:

1. Crear un Postgres gestionado (Vercel Postgres o Neon) → `DATABASE_URL` (con
   pooler) y `DIRECT_URL` (directa).
2. Importar el repo en Vercel y definir `DATABASE_URL`, `DIRECT_URL`,
   `NEXTAUTH_URL` y `NEXTAUTH_SECRET`.
3. Deploy. Verificar `GET /api/health` → `200`.
4. (Opcional) Añadir dominio propio; Vercel emite el HTTPS.

### Salud y seguridad

- `GET /api/health` → `200` si la BD responde, `503` si no.
- Cabeceras de seguridad (CSP, HSTS en producción, nosniff, frame-options) en
  `next.config.js`.

## Estructura del proyecto

```
casa-os/
├── src/app/              # Rutas y páginas (Next.js App Router)
├── src/components/       # Componentes UI
├── src/lib/              # Utilidades y configuración
├── prisma/               # Esquema y migraciones de BD
├── scripts/              # Scripts de utilidad
├── tests/                # Tests
├── docs/                 # Documentación
├── .opencode/            # Skills y configuración de OpenCode
└── .github/              # CI/CD e issue templates
```

## Contribuir

Este es un proyecto personal, pero si quieres contribuir:

1. Haz un fork del repositorio
2. Crea una rama: `git checkout -b feat/nueva-funcionalidad`
3. Sigue las convenciones de `AGENTS.md`
4. Abre un PR con descripción clara

## Licencia

Proyecto privado — uso personal y familiar.

---

Hecho con ❤️ para mi hogar, desde mi hogar.
