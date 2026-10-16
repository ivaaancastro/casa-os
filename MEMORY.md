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

### 🎯 Roadmap por hitos (en orden)

> Cada feature = una rama + su carpeta en `specs/`. Se trabaja **una a una**.

**Hito 1 — Base familiar (habilitadores)**

- `feat/usuarios-roles` — Gestión de miembros: invitar/crear cuentas, roles
  ADMIN/FAMILY aplicados de verdad, perfil y cambio de contraseña.
  *Hecho cuando*: un ADMIN crea usuarios, cada uno entra con su cuenta y los
  permisos se respetan en API y UI; tests.
- `feat/acceso-remoto` — Cloudflare Tunnel + hardening (headers, HTTPS,
  variables de entorno documentadas) para usar la app fuera de casa.
  *Hecho cuando*: la app es accesible por HTTPS desde el móvil sin abrir puertos.
- `feat/pwa-instalable` — Manifest, iconos, service worker básico, navegación
  mobile-first. *Hecho cuando*: se instala en el móvil y funciona offline básica.

**Hito 2 — Dispositivos de la red**

- `feat/dispositivos-crud` — Inventario manual (nombre, IP, MAC, tipo,
  propietario, notas, online/lastSeen). *Hecho cuando*: CRUD completo + tests.
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

**Siguiente:** `feat/usuarios-roles` (Hito 1). Es el habilitador de todo lo demás.


## Notas técnicas

- La red local es `192.168.1.0/24`
- El router principal es `192.168.1.1`
- Usar `nmap` para escaneo de red (requiere instalación en el equipo)
- SQLite es suficiente para el volumen de datos esperado

## Lecciones aprendidas

- **styled-jsx + DOM ajeno a React**: TipTap/ProseMirror crea su DOM fuera del
  árbol React, así que `<style jsx>` le añade un scope que **nunca coincide** y
  las reglas no se aplican. La CSS de editores/similares va en `globals.css`.
- **TipTap v3 no re-renderiza por transacción por defecto**: la toolbar se quedaba
  "congelada". Se usa `shouldRerenderOnTransaction: true` para reflejar el cursor.
- **Zoom Inditex**: los tokens y tipografías viven en `tailwind.config.ts` y
  `globals.css`; mantener ahí el lenguaje visual (radios 0, Bodoni + Jost).

---

*Última actualización: 2026-10-16*
