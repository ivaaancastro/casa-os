# MEMORY.md — Memoria del Proyecto

> Este archivo es la memoria persistente del proyecto. Aquí se registran decisiones
> clave, contexto, preferencias y estado actual. Los agentes deben leerlo al empezar
> a trabajar en el proyecto.

## Contexto

**casa-os** nace de la necesidad de centralizar toda la información del hogar en un
solo lugar. Es un proyecto de uso personal/familiar, no comercial. El objetivo es
tener una app que toda la familia pueda usar desde sus móviles y ordenadores.

### Familia usuarios
- Iván (admin)
- [Otros miembros — pendiente de definir]

### Problemas que resuelve
- No saber qué dispositivos hay conectados a la red de casa
- Perder la lista de la compra
- No tener un sitio central para notas familiares

## Decisiones clave

| Fecha | Decisión | Razón |
|-------|----------|-------|
| 2026-10-14 | Next.js como framework | Full-stack, React conocido, fácil despliegue |
| 2026-10-14 | SQLite como base de datos | Cero infraestructura, ideal para hogar |
| 2026-10-14 | Prisma como ORM | Migraciones limpias, tipos automáticos |
| 2026-10-14 | NextAuth para auth | Estándar, soporta roles, JWT |
| 2026-10-14 | Tailwind CSS | Rápido, responsive de fábrica |
| 2026-10-14 | Autoalojado en casa | Privacidad, cero coste, control total |
| 2026-10-14 | Cloudflare Tunnel para acceso externo | Sin abrir puertos, HTTPS gratis |
| 2026-10-14 | TypeScript strict | Evitar bugs, mejor DX |
| 2026-10-16 | **PostgreSQL** en vez de SQLite | Serverless (Vercel) no persiste disco; Postgres gestionado |
| 2026-10-16 | **Despliegue en la nube** (Vercel + Postgres) | Sin hardware en casa siempre encendido |

## Preferencias del usuario

- **Idioma del proyecto**: Español (código en español, comentarios en español)
- **Estilo de código**: Directo, sin over-engineering
- **Commits**: Conventional Commits en español
- **Diseño**: Simple, funcional, mobile-first

## Protocolo de trabajo (regla de oro)

**Una sola rama/PR activa a la vez.** Antes de empezar algo nuevo: `gh pr list`
debe estar vacío. No se abre una rama nueva hasta mergear (squash) o cerrar la
anterior.

Flujo por feature (SDD):

1. `git checkout main && git pull` → `git checkout -b feat/<nombre>` (o `fix/<nombre>`).
2. `specs/<nombre>/`: `plan.md` → `spec.md` → **aprobación del usuario** → `tasks.md`.
3. Implementar en orden, con test cuando aplique.
4. **Verificación obligatoria**: `npm run lint && npm run typecheck && npm run test && npm run build`.
5. Verificación de UI con Chrome MCP si toca interfaz.
6. Commit(s) convencionales en español → push → PR → **CI en verde**.
7. Merge (squash) → borrar rama → actualizar este `MEMORY.md` (roadmap + lecciones).

Reglas de código: nunca a `main`; ramas `feat/*`/`fix/*`; validación con Zod;
estética editorial Inditex; mobile-first; sin over-engineering.

## Roadmap

### ✅ Hecho (v0.1 — fundación)

- Stack, estructura, ESLint/TypeScript/Tailwind, esquema inicial Prisma.
- Auth con NextAuth (login, roles ADMIN/FAMILY, middleware).
- Layout con sidebar + dashboard editorial (rediseño Inditex).
- **Notas**: CRUD completo + editor enriquecido tipo Apple Notas (título como
  primera línea, estilos de párrafo, checklist, listas, tablas, enlaces,
  indentación, atajos).

### ✅ Hecho (v0.2 — base familiar)

- **Usuarios y roles** (`feat/usuarios-roles`): crear/editar miembros, roles
  ADMIN/FAMILY aplicados en API y UI, activar/desactivar (baja lógica), perfil
  propio con cambio de contraseña y protecciones (último admin, auto-baja).
  Secciones `/familia` y `/perfil`.

### ✅ Hecho (v0.3 — preparado para la nube)

- **PostgreSQL** (`feat/postgres`): migración de SQLite a PostgreSQL (requisito
  para alojar en Vercel). Migración base (`prisma/migrations/0000_init`), dev
  local con Docker Compose, script de volcado de datos y backup con `pg_dump`.

### ✅ Hecho (v0.4 — desplegado en producción)

- **Despliegue en Vercel** (`feat/despliegue-vercel`): `vercel-build` (migraciones
  + build), `GET /api/health` (200/503, público), cabeceras de seguridad (CSP,
  HSTS en prod, nosniff, frame-options) y guía paso a paso
  `docs/despliegue-vercel.md`.
- **Producción**: <https://casa-os-mauve.vercel.app> (Vercel + Neon). Verificado:
  health `200`, cabeceras, login real, notas, familia y escritura en Neon.
  Sin dominio propio por ahora (decisión del usuario).

### ✅ Hecho (v0.5 — PWA instalable)

- **PWA** (`feat/pwa-instalable`): manifest (`/manifest.webmanifest`), iconos
  32/192/512 + maskable + Apple, service worker (`/sw.js`) y página sin
  conexión (`/offline`). Instalable en Android/iOS; offline básica **sin
  cachear datos privados** (solo se precachea `/offline`). Guía en
  `docs/pwa.md` y generador de iconos en `npm run icons`.

### ✅ Hecho (v0.6 — dispositivos)

- **Dispositivos** (`feat/dispositivos-crud`): inventario manual con CRUD,
  IP/MAC únicas (índices en Postgres), tipo, propietario, notas y estado
  online/lastSeen de solo lectura. API con Zod y `409` para duplicados; ADMIN
  escribe y FAMILY solo lee. UI editorial responsive con borrado en dos pasos.

### 🎯 Roadmap por hitos (en orden)

> Cada feature = una rama + su carpeta en `specs/`. Se trabaja **una a una**.

**Hito 1 — Base familiar (habilitadores)**

- `feat/despliegue-vercel` — Despliegue en Vercel + PostgreSQL gestionado
  (Neon), cabeceras de seguridad y guía del dominio. **Hecho**: producción en
  <https://casa-os-mauve.vercel.app> (sin dominio propio por ahora).
- `feat/pwa-instalable` — Manifest, iconos, service worker básico, navegación
  mobile-first. **Hecho**: instalable y con página offline; sin datos offline.

**Hito 2 — Dispositivos de la red**

- `feat/dispositivos-crud` — Inventario manual (nombre, IP, MAC, tipo,
  propietario, notas, online/lastSeen). **Hecho**: CRUD completo, IP/MAC únicas
  y permisos ADMIN/FAMILY; tests y verificación móvil.
- `feat/escaneo-red` — Ejecutar el escáner, mostrar descubiertos e importarlos al
  inventario (deduplicar por MAC/IP). *Hecho cuando*: `npm run scan` alimenta la
  sección y se puede importar con un clic.
- `feat/dispositivos-estado` — Estado online/offline, "última vez visto" y
  alertas básicas de altas/bajas. *Hecho cuando*: la lista refleja el estado real.

**Hito 3 — Organización del hogar**

- `feat/calendario` — Eventos familiares (título, fecha, hora, quién, todo el
  día, recordatorio). *Hecho cuando*: vista mes/semana y CRUD + tests.
- `feat/recordatorios` — Notificaciones/tareas programadas ligadas al calendario
  y a las notas TODO. *Hecho cuando*: llega un aviso en el navegador/móvil.

**Hito 4 — Patrimonio del hogar**

- `feat/inventario` — Objetos y enseres (categoría, ubicación, valor, garantía,
  fotos). *Hecho cuando*: CRUD + búsqueda por ubicación/categoría.
- `feat/documentos` — Archivos del hogar (facturas, contratos, garantías):
  subida, etiquetado y relación con inventario/gastos. *Hecho cuando*: subir,
  listar, descargar y borrar con permisos.
- `feat/gastos` — Gastos recurrentes y puntuales, reparto por miembro y
  presupuesto mensual. *Hecho cuando*: registrar gastos y ver resumen por mes.

**Hito 5 — Automatización**

- `feat/domotica` — Integración (p. ej. Home Assistant) para luces/enchufes.
  *Hecho cuando*: listar y accionar dispositivos desde casa-os.

### 📋 Backlog / ideas (sin fecha)

- Buscador global (notas, dispositivos, inventario, documentos).
- Papelera/archivo y exportación de datos (backup/restore ya existe por script).
- Roles granulares y auditoría de cambios.
- App móvil nativa (React Native) si la PWA se queda corta.

### 👉 Foco actual

**En producción:** <https://casa-os-mauve.vercel.app> (Vercel + Neon).

**Siguiente:** Hito 2, `feat/escaneo-red` (descubrir equipos e importarlos al
inventario). Después: `feat/dispositivos-estado`.


## Notas técnicas

- La red local es `192.168.1.0/24`
- El router principal es `192.168.1.1`
- Usar `nmap` para escaneo de red (requiere instalación en el equipo; NO funciona
  en serverless, solo en local)
- Base de datos: **PostgreSQL** (antes SQLite). Dev local con
  `docker compose up -d db` (puerto **5433**; el 5432 lo ocupa otro proyecto,
  `nexus-postgres`)
- **Producción**: Vercel + **Neon** (`neondb`). Variables: `DATABASE_URL` (pooled)
  y `DIRECT_URL` (directa). Sin dominio propio por ahora:
  <https://casa-os-mauve.vercel.app>
- **PWA**: manifest (`src/app/manifest.ts`), SW (`public/sw.js`), offline
  (`src/app/offline/route.ts`) y registro solo en producción. El SW **solo**
  precachea `/offline`; no cachea `/api/*` ni HTML autenticado. Iconos:
  `npm run icons`. Guía: `docs/pwa.md`.
- **Dispositivos**: `ip` y `mac` con índice único en Postgres; la MAC se
  normaliza a `AA:BB:CC:DD:EE:FF`. `online`/`lastSeen` son de solo lectura: los
  actualizará el escáner. La migración de unicidad es **no destructiva**: aborta
  con un error claro si hay duplicados.

## Lecciones aprendidas

- **styled-jsx + DOM ajeno a React**: TipTap/ProseMirror crea su DOM fuera del
  árbol React, así que `<style jsx>` le añade un scope que **nunca coincide** y
  las reglas no se aplican. La CSS de editores/similares va en `globals.css`.
- **TipTap v3 no re-renderiza por transacción por defecto**: la toolbar se quedaba
  "congelada". Se usa `shouldRerenderOnTransaction: true` para reflejar el cursor.
- **Zoom Inditex**: los tokens y tipografías viven en `tailwind.config.ts` y
  `globals.css`; mantener ahí el lenguaje visual (radios 0, Bodoni + Jost).
- **Login NextAuth + middleware**: `signIn({ redirect: false })` seguido de
  `router.push` puede adelantarse al `Set-Cookie` de la sesión y el middleware
  devuelve al login (el botón se queda en "Iniciando sesión..."). Se resuelve con
  navegación dura (`window.location.assign`).
- **Scripts `tsx` no cargan `.env`**: a diferencia de Prisma, un script suelto no
  lee `.env`; si necesita variables, hay que cargarlas (loader propio).
- **SQLite → Postgres**: Prisma guarda Boolean como 0/1 y DateTime como ms en
  SQLite; al volcar datos hay que coercionar. `node:sqlite` (Node 22) permite leer
  el `.db` sin dependencias nuevas.
- **`NEXTAUTH_URL` inválida revienta el build**: si contiene los `< >` del
  placeholder (`https://<tu-proyecto>.vercel.app`) o va vacía, NextAuth lanza
  `TypeError: Invalid URL` al prerenderizar `/`, `/devices`, `/auth/login` y
  `/_not-found`. Debe ser la URL real, sin comillas ni espacios.
- **Prisma Postgres ≠ Neon**: el producto "Prisma Postgres" del Marketplace
  inyecta variables con prefijo (`DATABASE_PRISMA_DATABASE_URL`) y puede dar
  `prisma+postgres://`, que no sirve con Prisma 5.22. En producción usamos
  **Neon** con `DATABASE_URL` (pooled) + `DIRECT_URL` (directa).
- **Variables de entorno**: pegar solo el valor de la URL (sin `NOMBRE=`, sin
  comillas). Validar con `new URL(...)` antes de desplegar.
- **Service worker y datos privados**: cachear HTML autenticado o `/api/*` haría
  que un dispositivo pudiera mostrar datos de otra sesión. El SW de casa-os solo
  precachea `/offline` y deja pasar todo lo demás a la red.
- **Offline autocontenido**: `/offline` es un Route Handler con CSS inline, no
  una página del App Router; si dependiera del layout raíz o de chunks de
  Next.js, sin red se vería sin estilos.
- **SW solo en producción**: registrarlo en desarrollo deja cachés que
  interfieren con HMR y confunden al depurar.
- **Instalabilidad**: Chrome exige iconos 192 y 512, `start_url`, `display:
  standalone` y un SW con handler `fetch`; el maskable va aparte.
- **Migraciones con datos existentes**: no borrar filas desde una migración. Un
  bloque `DO $$ ... RAISE EXCEPTION` aborta con un mensaje claro si hay
  duplicados y permite resolverlos a mano sin pérdida de datos.
- **`prisma migrate dev` sin TTY**: el agente no puede usarlo (pide interacción).
  Crear `prisma/migrations/<timestamp>_<nombre>/migration.sql` y aplicar con
  `prisma migrate deploy`.

---

*Última actualización: 2026-10-20*
