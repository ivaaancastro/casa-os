# 🏠 casa-os

> Sistema operativo para tu hogar — gestión de dispositivos, notas familiares y más.

**casa-os** es una aplicación web personal y autoalojada para centralizar todos los datos de tu casa. Diseñada para uso familiar, con acceso desde cualquier dispositivo de la red local (y opcionalmente desde fuera mediante Cloudflare Tunnel o Tailscale).

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
- **[Prisma](https://www.prisma.io/)** + **[SQLite](https://www.sqlite.org/)** — ORM y base de datos
- **[NextAuth.js](https://next-auth.js.org/)** — Autenticación
- **[Tailwind CSS](https://tailwindcss.com/)** — Estilos
- **[Vitest](https://vitest.dev/)** — Tests

## Requisitos

- Node.js >= 20
- npm >= 10
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

# 4. Inicializar la base de datos
npm run db:push
npm run db:seed

# 5. Arrancar en desarrollo
npm run dev
```

La aplicación estará disponible en **http://localhost:3000**

## Despliegue

### Opción A: En local (recomendado para empezar)

```bash
npm run build
npm start
```

Acceso desde cualquier dispositivo en la misma red: `http://IP-DEL-SERVIDOR:3000`

### Opción B: Cloudflare Tunnel (acceso desde fuera)

```bash
# Instalar cloudflared
brew install cloudflared

# Crear tunnel
cloudflared tunnel --url http://localhost:3000
```

### Opción C: Tailscale (red privada virtual)

Instalar Tailscale en los dispositivos de la familia y acceder por la IP interna.

### Opción D: VPS

```bash
# En el servidor
git clone https://github.com/ivaaancastro/casa-os.git
cd casa-os
npm ci
npm run build
npm start
```

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
