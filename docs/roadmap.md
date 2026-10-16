# Roadmap de casa-os

> Plan de desarrollo priorizado. Este documento es un vivo y se actualiza
> según cambien las prioridades.
>
> ⚠️ El roadmap **vivo** y el protocolo de trabajo están en `MEMORY.md` (raíz).
> Este documento es la versión inicial y puede estar desactualizado.

## Filosofía

- **Vertical slices**: Cada feature se entrega completo (UI + API + tests) antes
  de pasar a la siguiente.
- **Familia primero**: Las features que más impacto diario tienen se priorizan.
- **Simplicidad**: Si algo se puede resolver con 10 líneas, no usar 100.

---

## Hito 1 — Esqueleto ✅

**Objetivo**: Proyecto funcional con layout, auth y navegación básica.

- [x] Estructura del repositorio
- [x] Configuración TypeScript + ESLint + Tailwind
- [x] Esquema Prisma inicial
- [x] Scripts de utilidad (scan, backup)
- [ ] NextAuth con email/contraseña
- [ ] Layout principal con sidebar
- [ ] Página de login
- [ ] Dashboard (placeholder)

**Criterio de éxito**: La app arranca, se puede ver el dashboard y el login funciona.

---

## Hito 2 — Notas y Lista de la Compra

**Objetivo**: CRUD completo de notas compartidas para la familia.

- [ ] API routes: `GET/POST/PATCH/DELETE /api/notes`
- [ ] Página de notas con lista
- [ ] Añadir/editar/borrar notas
- [ ] Toggle "completado" para la lista de la compra
- [ ] Indicador de quién añadió/editó cada nota
- [ ] Tests del CRUD

**Criterio de éxito**: Dos personas de la familia pueden editar la lista de la
compra desde sus móviles simultáneamente.

---

## Hito 3 — Dispositivos de Red

**Objotivo**: Detectar y gestionar los dispositivos conectados a la red.

- [ ] API route: `POST /api/devices/scan` (llama a nmap)
- [ ] API routes CRUD: `/api/devices`
- [ ] Página de dispositivos con tabla
- [ ] Escaneo manual + auto-escaneo periódico
[ ] Estado online/offline
- [ ] Asignar nombre, tipo y propietario a cada dispositivo
- [ ] Tests del escáner y del CRUD

**Criterio de éxito**: Se puede ver qué dispositivos hay conectados, sus IPs,
y marcarlos con nombre ("Móvil de Mamá", "TV del salón").

---

## Hito 4 — Calendario Familiar

**Objetivo**: Calendario compartido para turnos, citas y recordatorios.

- [ ] Modelo de datos: Event ( título, fecha, hora, usuario, color)
- [ ] API routes CRUD: `/api/events`
- [ ] Página de calendario (vista mensual)
- [ ] Añadir/editar/borrar eventos
- [ ] Vista "próximos eventos" en el dashboard
- [ ] Tests

**Criterio de éxito**: La familia puede ver y añadir eventos al calendario
desde sus dispositivos.

---

## Hito 5 — Inventario del Hogar

**Objetivo**: Control de objetos, caducidades y garantías.

- [ ] Modelo de datos: Item ( nombre, categoría, ubicación, caducidad, garantía, foto)
- [ ] API routes CRUD: `/api/items`
- [ ] Página de inventario con filtros
- [ ] Alertas de caducidad/garantía próxima a expirar
- [ ] Tests

**Criterio de éxito**: Se puede buscar "qué tengo en el congelador" y saber
qué está a punto de caducar.

---

## Hito 6 — Despliegue en la nube

**Objetivo**: Publicar casa-os con acceso desde cualquier sitio.

- [x] Migrar la base de datos a PostgreSQL
- [ ] Desplegar en Vercel + PostgreSQL gestionado (`feat/despliegue-vercel`)
- [ ] HTTPS en dominio propio
- [ ] Guía de acceso para la familia
- [ ] (Alternativa) Tailscale para acceso privado

**Criterio de éxito**: Cualquier miembro de la familia puede abrir la app
desde su móvil, esté donde esté.

---

## Ideas futuras (sin ordenar)

- [ ] Control de domótica (enchufes inteligentes, luces)
- [ ] Gastos del hogar (registro + reparto)
- [ ] Documentos del hogar (facturas, seguros, manuales)
- [ ] Notificaciones push (PWA)
- [ ] Modo oscuro
- [ ] Multi-idioma (es/en)
- [ ] App móvil nativa (React Native / Capacitor)
