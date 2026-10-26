# 🏠 casa-os

> Sistema operativo para tu hogar — gestión de dispositivos, notas familiares y más.

**casa-os** es una aplicación web personal para centralizar todos los datos de tu casa. Diseñada para uso familiar, con acceso desde cualquier dispositivo.

**Producción**: <https://casa-os-mauve.vercel.app> (Vercel + Neon).

## Características

| Sección | Estado | Descripción |
|---------|--------|-------------|
| 📊 Dashboard | 🚧 En desarrollo | Resumen de la casa de un vistazo |
| 🖥️ Dispositivos | ✅ Terminado | Inventario (IP, MAC, tipo, propietario, notas), escaneo e importación, estado en línea/ausente y última vez visto |
| 🛒 Notas / Compra | ✅ Terminado | Notas compartidas y editor enriquecido |
| 👥 Familia | ✅ Terminado | Miembros, roles ADMIN/FAMILY y perfil |
| 📅 Calendario | ✅ Terminado | Calendario compartido con vistas de mes/semana, eventos, todo el día y recordatorio |
| 🔔 Recordatorios | 🚧 En desarrollo | Avisos Web Push de eventos, prueba y panel in-app; pendiente de verificación en producción |
| 📦 Inventario | 📋 Planificado | Control de objetos, caducidades y garantías |
| 💰 Gastos | 💡 Idea | Registro y reparto de gastos del hogar |
| 🔧 Mantenimiento | 💡 Idea | Tareas recurrentes y historial |
| 📄 Documentos | 💡 Idea | Facturas, seguros y manuales |

**Leyenda**: ✅ Terminado · 🚧 En desarrollo · 📋 Planificado · 💡 Idea

## Stack

- **[Next.js 14](https://nextjs.org/)** (App Router) — Framework full-stack React
- **[TypeScript](https://www.typescriptlang.org/)** — Tipado estático
- **[Prisma](https://www.prisma.io/)** + **[PostgreSQL](https://www.postgresql.org/)** — ORM y base de datos
- **[NextAuth.js](https://next-auth.js.org/)** — Autenticación
- **[Tailwind CSS](https://tailwindcss.com/)** — Estilos
- **PWA** — Manifest, service worker y página offline (instalable en el móvil)
- **[Vitest](https://vitest.dev/)** — Tests

## Requisitos

- Node.js >= 20
- npm >= 10
- Docker (para PostgreSQL en desarrollo): [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- nmap (necesario para escanear la red): `brew install nmap`

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

## Calendario familiar

El calendario compartido de la casa tiene vista de **mes** y **semana**, eventos
con hora o de **todo el día**, responsable opcional y recordatorio. Cualquier
miembro activo puede crear; solo el creador o un ADMIN puede editar o borrar.

El botón **Avisos** permite activar Web Push en cada dispositivo, enviar una
prueba y consultar los próximos recordatorios. Los eventos con hora avisan
`inicio - recordatorio`; los de todo el día, a las 09:00 de `Europe/Madrid`
(configurable con `HOUSE_TIMEZONE`). Un cron cada 5 minutos procesa la ventana
de envío y deduplica las entregas.

Guía de uso, permisos, API y límites:
**[`docs/calendario.md`](docs/calendario.md)**.
Configuración de VAPID, scheduler y funcionamiento:
**[`docs/recordatorios.md`](docs/recordatorios.md)**.

## Escanear la red

`nmap` no puede ejecutarse en Vercel, así que el escaneo corre en tu ordenador y
la app importa el resultado:

```bash
npm run scan -- --out scan-latest.json
```

Después, como ADMIN, entra en **Dispositivos → Importar escaneo**, sube el
archivo y revisa la previsualización. Se importan los equipos nuevos que marques
y, al aplicar el escaneo, se actualiza el estado del inventario: los equipos
vistos pasan a en línea y los que ya no aparecen en esa red se marcan como
ausentes. Las IP/MAC existentes y los conflictos se muestran sin duplicar nada.

Guía completa, formato JSON y resolución de conflictos:
**[`docs/escaneo-red.md`](docs/escaneo-red.md)**.

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
Para acceder desde fuera de casa, usa la opción B (Vercel).

### Opción B: Nube (Vercel + PostgreSQL) — recomendado

Vercel despliega en cada push a `main` y aplica las migraciones en el build
(`npm run vercel-build`). Guía completa paso a paso:
**[`docs/despliegue-vercel.md`](docs/despliegue-vercel.md)**.

Resumen:

1. Crear un Postgres gestionado (Vercel Postgres o Neon) → `DATABASE_URL` (con
   pooler) y `DIRECT_URL` (directa).
2. Importar el repo en Vercel y definir `DATABASE_URL`, `DIRECT_URL`,
   `NEXTAUTH_URL` y `NEXTAUTH_SECRET`.
3. Para los recordatorios, añadir `NEXT_PUBLIC_VAPID_PUBLIC_KEY`,
   `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, `CRON_SECRET` y, si aplica,
   `HOUSE_TIMEZONE`. Configurar el workflow de GitHub Actions con
   `CASA_OS_URL` y `CRON_SECRET` (ver
   [`docs/recordatorios.md`](docs/recordatorios.md)).
4. Deploy. Verificar `GET /api/health` → `200`.
5. (Opcional) Añadir dominio propio; Vercel emite el HTTPS.

### Salud y seguridad

- `GET /api/health` → `200` si la BD responde, `503` si no.
- Cabeceras de seguridad (CSP, HSTS en producción, nosniff, frame-options) en
  `next.config.js`.

## Instalar como app (PWA)

casa-os es instalable desde el navegador, sin tienda:

- **Android/Chrome**: menú → *Instalar aplicación*.
- **iOS/Safari**: *Compartir* → *Añadir a pantalla de inicio*.

Se abre en ventana propia y, sin conexión, muestra una página de aviso. El
service worker **no cachea datos privados** (solo `/offline`) y gestiona los
avisos push de los recordatorios. Detalles y verificación:
**[`docs/pwa.md`](docs/pwa.md)**.

## Estructura del proyecto

```
casa-os/
├── src/app/              # Rutas y páginas (Next.js App Router)
├── src/components/       # Componentes UI
├── src/lib/              # Utilidades y configuración
├── prisma/               # Esquema y migraciones de BD
├── scripts/              # Scripts de utilidad (incl. docs:check)
├── specs/                # Plan, spec, tasks y cierre de cada feature
├── tests/                # Tests
├── docs/                 # Documentación y protocolo de cierre
├── .opencode/            # Skills y configuración de OpenCode
└── .github/              # CI/CD, PR e issue templates
```

## Calidad

Antes de abrir o mergear un PR:

```bash
npm run lint && npm run typecheck && npm run test && npm run build
```

`npm run test` ejecuta una pasada; para desarrollo, `npm run test:watch`.
La CI de GitHub ejecuta lint, typecheck, tests y build en cada PR y en `main`.

## Documentación y proceso

- [`AGENTS.md`](AGENTS.md) — reglas del agente, SDD, verificación y cierre.
- [`MEMORY.md`](MEMORY.md) — roadmap vivo, decisiones, estado y registro de
  features.
- [`docs/cierre-feature.md`](docs/cierre-feature.md) — protocolo obligatorio de
  cierre (código → producción → PR de documentación).
- [`specs/`](specs/) — `plan.md`, `spec.md`, `tasks.md` y `cierre.md` por feature.
- [`docs/`](docs/) — arquitectura, despliegue, PWA, calendario, recordatorios,
  escaneo de red y guías.

Cada feature se cierra con un PR `docs/cierre-<nombre>` después de verificar
producción. El registro queda en `specs/<nombre>/cierre.md` y se valida con:

```bash
npm run docs:check -- <nombre>
```

## Contribuir

Este es un proyecto personal, pero si quieres contribuir:

1. Haz un fork del repositorio.
2. Lee `AGENTS.md` y `MEMORY.md`.
3. Crea una rama: `git checkout -b feat/nueva-funcionalidad`.
4. Escribe `specs/<nombre>/plan.md` y `spec.md`; espera la aprobación.
5. Implementa, verifica y abre un PR con descripción clara.
6. Tras el merge, completa el cierre documental antes de la siguiente feature.

Nunca se commitea directamente a `main`.

## Licencia

Proyecto privado — uso personal y familiar.

---

Hecho con ❤️ para mi hogar, desde mi hogar.
