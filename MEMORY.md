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
| 2026-10-20 | **Cierre documental obligatorio por feature** | Evitar documentación desactualizada y dejar un registro verificable de cada entrega |
| 2026-10-20 | **Escaneo local + importación JSON** | `nmap` no corre en Vercel; evita tokens e historial de escaneos |
| 2026-10-22 | **Calendario compartido con permisos por creador** | Toda la familia crea planes; editar/borrar queda en el creador o ADMIN |
| 2026-10-22 | **Recordatorio almacenado, sin envío** | El calendario guarda la preferencia; los avisos van en `feat/recordatorios` |
| 2026-10-26 | **Web Push + GitHub Actions cada 5 min** | Vercel Hobby no permite cron sub-diario; el workflow usa `CRON_SECRET` |
| 2026-10-26 | **Todo el día a las 09:00 de `HOUSE_TIMEZONE`** | Evita avisos a medianoche UTC y respeta el DST |
| 2026-10-26 | **Deduplicación `[eventId, subscriptionId, scheduledFor]`** | Evita duplicados con reintentos o cron solapado |
| 2026-10-27 | **2FA TOTP obligatorio para `cuentas`, opcional en el resto** | Protege la bóveda sin bloquear notas/calendario a quien no lo active |
| 2026-10-27 | **`sessionVersion` en el JWT** | Un cambio de contraseña o 2FA invalida las sesiones anteriores sin tabla de sesiones |
| 2026-10-28 | **Gestor de contraseñas server-side descartado** | El servidor podía descifrar todo: no es zero-knowledge y no sirve para credenciales reales |
| 2026-10-28 | **Cuentas zero-knowledge en `/cuentas`** | Master password + passkey opcional (WebAuthn PRF); el servidor solo guarda ciphertext |
| 2026-10-28 | **Reparación de migración histórica en `vercel-build`** | Desbloquea Neon (`P3009`) de forma idempotente y limitada a una lista cerrada |

## Preferencias del usuario

- **Idioma del proyecto**: Español (código en español, comentarios en español)
- **Estilo de código**: Directo, sin over-engineering
- **Commits**: Conventional Commits en español
- **Diseño**: Simple, funcional, mobile-first

## Protocolo de trabajo (regla de oro)

**Una sola feature activa a la vez.** Antes de empezar algo nuevo: `gh pr list`
debe estar vacío. No se abre una feature nueva hasta mergear (squash) el cierre
documental de la anterior.

Flujo por feature (SDD + cierre):

1. `git checkout main && git pull` → `git checkout -b feat/<nombre>` (o `fix/<nombre>`).
2. `specs/<nombre>/`: `plan.md` → `spec.md` → **aprobación del usuario** → `tasks.md`.
3. Implementar en orden, con test cuando aplique.
4. **Verificación obligatoria**: `npm run lint && npm run typecheck && npm run test && npm run build`.
5. Verificación de UI con Chrome MCP si toca interfaz.
6. Commit(s) convencionales en español → push → PR → **CI en verde**.
7. Squash merge → borrar rama de feature → verificar CI de `main`.
8. **Cierre documental obligatorio**: rama `docs/cierre-<nombre>` → completar
   `specs/<nombre>/cierre.md`, marcar `MEMORY.md` (Hecho + Registro de features
   + foco), actualizar `CHANGELOG.md`/`README.md`/`docs/*`, ejecutar
   `npm run docs:check -- <nombre>`, PR, CI verde, squash merge, borrar rama y
   CI de `main` verde. **Solo entonces** se abre la siguiente feature.

Reglas de código: nunca a `main`; ramas `feat/*`/`fix/*` para código y `docs/*`
para documentación; validación con Zod; estética editorial Inditex; mobile-first;
sin over-engineering.

## Cierre de feature (obligatorio)

El merge del código **no** cierra una feature. La definición completa está en
`AGENTS.md` (Paso 8 y DoD) y la guía operativa en
[`docs/cierre-feature.md`](docs/cierre-feature.md).

- **Registro por feature:** `specs/<nombre>/cierre.md` (plantilla:
  `specs/_template/cierre.md`). Incluye PR, commit, deployment, verificación,
  documentación actualizada, tareas completadas y follow-ups.
- **Tareas:** `tasks.md` con checkboxes; al cerrar no puede quedar ninguna
  pendiente (se marca o se mueve a *Pendientes / follow-ups*).
- **Comprobación:** `npm run docs:check -- <nombre>` valida que existen
  `plan/spec/tasks/cierre`, que no hay casillas pendientes y que el cierre está
  enlazado desde `MEMORY.md`.
- **Bloqueo:** si producción falla o falta una verificación, la feature no se
  marca como Hecho; se registra el fallo y se abre un `fix/*`.

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
- **Producción**: deployment `AN59fx6pKkakZqNB5qeQ3v1h1Q4U` (commit `3e38e80`)
  *Ready · Current*; health `200`, cabeceras, rutas protegidas y smoke
  autenticado confirmado por Iván.
- **Cierre:** [`specs/dispositivos-crud/cierre.md`](specs/dispositivos-crud/cierre.md).

### ✅ Hecho (v0.7 — escaneo de red)

- **Escaneo de red** (`feat/escaneo-red`): escáner local con nmap, JSON
  versionado y panel en `/devices` para previsualizar e importar solo equipos
  nuevos. Deduplicación por IP/MAC, estados `new`/`existing`/`conflict`/
  `duplicate`/`invalid`, `dryRun` por defecto y `createMany` con
  `skipDuplicates`. No hay cambios de esquema ni se toca `online`/`lastSeen`.
- **Producción**: PRs #18 (feature), #19 y #20 (pulido); commit final
  `5835fd2`; health `200`, cabeceras correctas y `POST /api/devices/import` sin
  sesión → `401` JSON, lo que confirma el código nuevo. Smoke autenticado ADMIN
  confirmado por el agente con la cuenta temporal: panel, preview de fixture y
  móvil 390 px sin overflow. FAMILY se verificó en local; no hubo credencial
  FAMILY de producción.
- **Documentación**: `docs/escaneo-red.md`; API `POST /api/devices/import`;
  tarea 14 completada y cuenta temporal desactivada.
- **Cierre:** [`specs/escaneo-red/cierre.md`](specs/escaneo-red/cierre.md).

### ✅ Hecho (v0.8 — estado de dispositivos)

- **Estado de dispositivos** (`feat/dispositivos-estado`): al aplicar un
  escaneo se actualizan `online` y `lastSeen`; los equipos de la red que ya se
  habían visto y no aparecen se marcan ausentes. Guardia contra escaneos
  anteriores a `lastSeen`, previsualización de altas/bajas y frescura en la
  lista. Sin migración ni historial.
- **Producción**: PR #22 (squash merge `34fee9f`), CI de `main` verde (run
  `39818616853`), health `200` y alias actualizado. Smoke autenticado ADMIN:
  lista con estado y aviso de frescura, preview de fixture y descarte sin
  escritura. Verificado a 390 px sin overflow.
- **Cierre:** [`specs/dispositivos-estado/cierre.md`](specs/dispositivos-estado/cierre.md).

### ✅ Hecho (v0.9 — calendario)

- **Calendario familiar** (`feat/calendario`): vistas de mes (rejilla de 42
  celdas, lunes primero) y semana, CRUD de eventos con hora o de todo el día,
  responsable opcional, recordatorio almacenado y agenda móvil. API autenticada
  con permisos creador/ADMIN y migración aditiva `add_calendar_events`. Los
  avisos de recordatorio se desarrollan en `feat/recordatorios` (v0.10, en
  cierre).
- **Producción**: PR #24 (squash merge `94a4d40`), CI de `main` verde (run
  `39828836139`) y Vercel commit status success (deployment
  `CYckvdS6Bf8bMXKz1HkRH223bdEn`). Health `200` (`db: ok`). Smoke autenticado
  ADMIN en `/calendario`: alta de evento de todo el día, edición de título y
  recordatorio, detalle y borrado; `GET /api/events` final con 0 eventos. Sin
  sesión, `/calendario` → 307 y `/api/events` → 401 JSON.
- **Cierre:** [`specs/calendario/cierre.md`](specs/calendario/cierre.md).

### ✅ Hecho (v0.10 — recordatorios)

- **Recordatorios Web Push** (`feat/recordatorios`): avisos de eventos con hora
  y de todo el día, suscripciones por dispositivo, prueba, panel **Avisos**,
  enlace profundo al calendario y cron de GitHub Actions cada 5 minutos. Modelos
  `PushSubscription` y `ReminderDelivery`, migración aditiva
  `add_push_reminders`, rutas `/api/push/*` y `/api/reminders/*`, tests y guía
  `docs/recordatorios.md`.
- **Producción**: PR #26 (commit `76f0683`) y PR #27 de documentación (commit
  `bfb7477`). Deployment de verificación
  `dpl_GLUPgBsHBLV6k7MXAP11mikGiVKr` (*Ready*), health `200`; el merge del
  cierre generó después un deployment docs-only sin cambios funcionales. VAPID,
  `CRON_SECRET`, `HOUSE_TIMEZONE` y `CASA_OS_URL` configurados; workflow
  `Recordatorios` activo cada 5 minutos.
- **Verificación real**: suscripción FCM en Chrome, aviso de prueba `sent:1` y
  recordatorio de un evento recibido en el service worker. El run
  `40325963795` envió `1` aviso; `40325997147` lo omitió por deduplicación
  (`skipped:1`). Suscripciones y eventos de prueba eliminados.
- **Cuenta temporal**: `admin-temporal` (`agente.pruebas@casa.local`) existe,
  pero ya estaba inactiva en `/familia` (`INACTIVO`); no se modificó.
- **Cierre:** [`specs/recordatorios/cierre.md`](specs/recordatorios/cierre.md).

### ✅ Hecho (v0.11 — 2FA)

- **Autenticación en dos pasos** (`feat/2fa`): TOTP de 6 dígitos (30 s, ventana
  ±1) compatible con apps estándar, 10 códigos de recuperación de un solo uso,
  desactivación y regeneración con contraseña + segundo factor, reset por ADMIN
  desde `/familia` y script de emergencia `npm run 2fa:reset -- <email>`.
- **Seguridad**: secreto TOTP cifrado con AES-256-GCM; `sessionVersion` en el
  JWT invalidado al cambiar contraseña o 2FA; rate limit de 5 fallos/15 min;
  `AuthEvent` con hash de IP y sin secretos.
- **UI**: tarjeta **Seguridad** en `/perfil` con QR, clave manual, códigos y
  eventos; campo opcional en el login; acción de reset en `/familia`.
- **Integración**: commits `8a6498b`, `307857c`, `c5ed603` y `e4e5730`; el PR
  #30 (`562c9b0`) solo añadió el marcador `.close-2fa.txt`, ya retirado.
- **Producción**: deployment `dpl_HJXPZgEHzYZeXAQuk2R1CKqR6MfD` (commit
  `562c9b0`, *Ready · Current*), health `200` y `/api/2fa/status` sin sesión →
  `401`. El smoke autenticado de producción no se repitió por falta de
  credenciales del agente; se verificó completo en local (activación, TOTP,
  códigos, login y desactivación).
- **Cierre:** [`specs/2fa/cierre.md`](specs/2fa/cierre.md). Guía:
  [`docs/2fa.md`](docs/2fa.md).

### 🗑️ Descartado (v0.11b — gestor de contraseñas server-side)

- `feat/gestor-contrasenas` (PR #32, `c5d2334`) dejó un **prototipo** con
  `User.encryptedPasswords`, helpers AES-256-GCM y `GET/POST /api/passwords`.
  No tiene UI, no valida con Zod, no tiene `PUT`/`DELETE` ni tests de API, y
  usa `TOTP_ENCRYPTION_KEY` directamente: **el servidor puede descifrar**.
- `feat/gestor-contrasenas-ui` (PR #33, `989ff54`) se **cancela**: solo añadió
  el enlace `/contrasenas` al sidebar y documentación de una UI que nunca
  existió. El enlace se retiró el 2026-10-28.
- El código se conserva por historial, documentado como no apto para uso real.
  Se retirará al cerrar **Cuentas**. Cierres:
  [`specs/gestor-contrasenas/cierre.md`](specs/gestor-contrasenas/cierre.md),
  [`specs/gestor-contrasenas-ui/cierre.md`](specs/gestor-contrasenas-ui/cierre.md).

### 🚧 Bloqueo y reparación de producción (2026-10-28)

- Los deployments posteriores a `562c9b0` fallaban con `P3009`: la migración
  histórica `2026102820_add_password_entry` (PR #31, revertido en `90b3fbe`)
  quedó marcada como fallida en Neon y su carpeta ya no existe en el repo.
- `scripts/repair-known-migrations.mjs` la marca como `rolled-back` antes de
  `prisma migrate deploy`, solo si sigue fallida y solo para esa migración
  conocida. Se ejecuta desde `vercel-build`.
- La reparación se valida en local sobre una base temporal antes de mergear.
  Tras el merge se verifica que el deployment queda *Ready* y que se aplica
  `20261028200000_add_encrypted_passwords_to_user`.

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
  propietario, notas, online/lastSeen). **Hecho y verificado en producción**:
  CRUD completo, IP/MAC únicas, permisos ADMIN/FAMILY, tests y verificación
  móvil. Cierre: [`specs/dispositivos-crud/cierre.md`](specs/dispositivos-crud/cierre.md).
- `feat/escaneo-red` — Ejecutar el escáner, mostrar descubiertos e importarlos al
  inventario (deduplicar por MAC/IP). **Hecho y verificado en producción**:
  escaneo local + JSON, preview e importación de nuevos; smoke ADMIN con fixture
  y móvil 390 px. Guía: [`docs/escaneo-red.md`](docs/escaneo-red.md). Cierre:
  [`specs/escaneo-red/cierre.md`](specs/escaneo-red/cierre.md).
- `feat/dispositivos-estado` — Estado online/offline, "última vez visto" y
  alertas básicas de altas/bajas. ✅ **Hecho (v0.8)**: estado aplicado al
  importar el escaneo, guardia de fechas, proyección y frescura en la lista.
  *Cumplido*: la lista refleja el estado real del último escaneo.

**Hito 3 — Organización del hogar**

- `feat/calendario` — Eventos familiares (título, fecha, hora, quién, todo el
  día, recordatorio). ✅ **Hecho (v0.9)**: vista mes/semana, CRUD, permisos,
  recordatorio almacenado y tests; verificado en producción con smoke ADMIN.
  Cierre: [`specs/calendario/cierre.md`](specs/calendario/cierre.md).
- `feat/recordatorios` — Notificaciones/tareas programadas ligadas al calendario
  y a las notas TODO. ✅ **Hecho (v0.10)**: Web Push, panel **Avisos**, prueba,
  deduplicación y scheduler de GitHub Actions; aviso real verificado en
  producción. Cierre:
  [`specs/recordatorios/cierre.md`](specs/recordatorios/cierre.md).

**Hito 4 — Seguridad**

- `feat/2fa` — Segundo factor TOTP, códigos de recuperación, reset por ADMIN y
  script de emergencia. ✅ **Hecho (v0.11)**: desplegado en producción
  (`562c9b0`); smoke autenticado de producción pendiente de confirmación del
  usuario. Cierre: [`specs/2fa/cierre.md`](specs/2fa/cierre.md).
- `feat/gestor-contrasenas` / `feat/gestor-contrasenas-ui` — ❌ **Descartado**:
  prototipo server-side sin UI que no cumple zero-knowledge. Sustituido por
  `feat/cuentas`.
- `feat/cuentas` — **Bóveda zero-knowledge** en `/cuentas`: master password +
  passkey opcional (WebAuthn PRF), 2FA obligatorio, visibilidad por cuenta
  (`Solo yo`, `Toda la familia`, `Personas concretas`). *Hecho cuando*: crear,
  desbloquear y compartir cuentas sin que el servidor pueda leer el contenido, y
  el smoke autenticado en producción esté verificado. Requiere `plan.md` y
  `spec.md` aprobados antes de implementar.

**Hito 5 — Automatización**

- `feat/domotica` — Integración (p. ej. Home Assistant) para luces/enchufes.
  *Hecho cuando*: listar y accionar dispositivos desde casa-os.

### 📋 Backlog / ideas (sin fecha)

- Buscador global (notas, dispositivos, inventario, documentos).
- Papelera/archivo y exportación de datos (backup/restore ya existe por script).
- Roles granulares y auditoría de cambios.
- App móvil nativa (React Native) si la PWA se queda corta.

### 👉 Foco actual

**En producción:** <https://casa-os-mauve.vercel.app> (Vercel + Neon). El
deployment activo es `dpl_HJXPZgEHzYZeXAQuk2R1CKqR6MfD` (commit `562c9b0`),
*Ready · Current*. Los deployments posteriores fallan por `P3009` hasta que se
mergee la reparación de `fix/estado-real-produccion`.

**Última feature cerrada:** `feat/2fa` (TOTP, códigos de recuperación, reset por
ADMIN y script de emergencia), commits `8a6498b`, `307857c`, `c5ed603` y
`e4e5730`, PR de cierre #30 (`562c9b0`). Cierre:
[`specs/2fa/cierre.md`](specs/2fa/cierre.md).

**En curso:** `fix/estado-real-produccion` — corrección del estado del repo y de
la documentación, retirada del enlace roto `/contrasenas` y reparación
idempotente de la migración fallida de Neon. Incluye el cierre documental
corregido de 2FA, del prototipo de contraseñas y de la UI cancelada.

**Descartado:** `feat/gestor-contrasenas` (prototipo server-side, PR #32) y
`feat/gestor-contrasenas-ui` (solo enlace de sidebar, PR #33). No se marcan como
hechos: no cumplen zero-knowledge y la UI nunca existió.

**Siguiente:** `feat/cuentas` — bóveda zero-knowledge en `/cuentas`. Requiere
escribir `specs/cuentas/plan.md` y `spec.md`, y esperar la aprobación del
usuario. No se abre hasta que el cierre de la corrección esté mergeado y el CI
de `main` esté verde.

## Registro de features

> Registro de entregas y cierres. A partir de v0.6 cada feature tiene su
> `specs/<nombre>/cierre.md`; las anteriores se resumen en `CHANGELOG.md` y en
> el roadmap.

| Tipo | Entrega | PR | Commit | Producción | Cierre |
|---|---|---|---|---|---|
| feat | Notas + editor premium | #9 | `8c18cc4` | Sí | — (previo al protocolo) |
| docs | Roadmap y protocolo | #10 | `6a2e394` | — | — |
| feat | Usuarios, roles y perfil | #11 | `9459187` | Sí | — (previo al protocolo) |
| feat | PostgreSQL | #12 | `f6062f0` | Sí | — (previo al protocolo) |
| feat | Despliegue en Vercel | #13 | `b156d3c` | Sí | — (previo al protocolo) |
| docs | Registro de producción | #14 | `1f85a9b` | — | — |
| feat | PWA instalable | #15 | `ab34d39` | Sí | — (previo al protocolo) |
| feat | Dispositivos (CRUD) | #16 | `3e38e80` | `AN59fx6pKkakZqNB5qeQ3v1h1Q4U` | [`cierre`](specs/dispositivos-crud/cierre.md) |
| docs | Protocolo de cierre + cierre de dispositivos | #17 | `e15c34a` | — | [`guía`](docs/cierre-feature.md) |
| feat | Escaneo de red (local + importación) | #18, #19, #20 | `5835fd2` | Sí (smoke ADMIN) | [`cierre`](specs/escaneo-red/cierre.md) |
| feat | Estado de dispositivos (online/ausente) | #22 | `34fee9f` | Sí (smoke ADMIN) | [`cierre`](specs/dispositivos-estado/cierre.md) |
| feat | Calendario familiar (mes/semana, CRUD, recordatorio) | #24 | `94a4d40` | Sí (smoke ADMIN) | [`cierre`](specs/calendario/cierre.md) |
| feat | Recordatorios Web Push (panel + scheduler) | #26, #27, #28 | `76f0683` / `bfb7477` | `dpl_GLUPgBsHBLV6k7MXAP11mikGiVKr` (push real) | [`cierre`](specs/recordatorios/cierre.md) |
| feat | 2FA TOTP (recuperación, reset ADMIN, emergencia) | #30 (cierre) | `8a6498b`…`e4e5730` | `dpl_HJXPZgEHzYZeXAQuk2R1CKqR6MfD` (parcial) | [`cierre`](specs/2fa/cierre.md) |
| feat | Gestor contraseñas (prototipo server-side, sin UI) | #32 | `c5d2334` | No (P3009); descartado | [`cierre`](specs/gestor-contrasenas/cierre.md) |
| feat | Gestor contraseñas UI (solo enlace sidebar) | #33 | `989ff54` | No (P3009); cancelada | [`cierre`](specs/gestor-contrasenas-ui/cierre.md) |
| fix | Estado real, docs y reparación de migración | — | — | Pendiente de merge | — |

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
- **Escaneo de red**: `nmap` solo en local. `npm run scan -- --out
  scan-latest.json`, subida en `/devices` y `POST /api/devices/import` con
  `dryRun` por defecto `true`; solo ADMIN y solo crea filas `new` (el estado se
  aplica desde v0.8). La ruta se excluye del middleware para devolver `401`
  JSON. Guía: `docs/escaneo-red.md`. `nmap` no está instalado en el entorno del
  agente; el CLI se verificó con un binario simulado.
- **Estado de dispositivos**: se aplica al importar el escaneo (no hay cron ni
  `nmap` en Vercel). La UI envía todas las filas + `importIps`; la API pone
  `online`/`lastSeen` a los vistos, crea los nuevos ya en línea y marca
  ausentes solo dentro del `cidr`, con `lastSeen` previo y sin conflicto. Un
  `scannedAt` anterior al `lastSeen` se ignora (`stale`). Sin migración ni
  historial; la frescura se deriva de `lastSeen`.
- **Documentación**: `MEMORY.md` es la fuente viva del roadmap y el estado;
  `docs/roadmap.md` es un índice histórico (no duplicar roadmaps). Cada feature
  cerrada tiene `specs/<nombre>/cierre.md`; el protocolo está en
  `docs/cierre-feature.md` y se valida con `npm run docs:check -- <nombre>`.
- **Calendario**: eventos con hora en UTC; eventos de todo el día guardados a
  medianoche UTC y pintados por su clave `YYYY-MM-DD` para no desplazarse de
  día. `Event.reminderMinutes` admite `null`, `0`, `10`, `30`, `60` y `1440`.
  La API de eventos se excluye del middleware para devolver `401` JSON y cada
  handler aplica `requireUser`.
- **Recordatorios**: Web Push con `web-push`; `PushSubscription` guarda
  endpoint/claves por dispositivo y `ReminderDelivery` deduplica por
  `[eventId, subscriptionId, scheduledFor]`. Los eventos con hora usan
  `start - reminderMinutes`; los de todo el día, 09:00 de `HOUSE_TIMEZONE`
  (por defecto `Europe/Madrid`). Ventana de 15 min y workflow de GitHub Actions
  cada 5 min (`CASA_OS_URL` + `CRON_SECRET`). El dispatch exige
  `Authorization: Bearer`; sin secreto configurado devuelve `503`. La UI de
  activación solo funciona en build de producción porque el SW no se registra
  en desarrollo. En producción está configurado con VAPID/`CRON_SECRET`/
  `HOUSE_TIMEZONE`, workflow activo y deployment
  `dpl_GLUPgBsHBLV6k7MXAP11mikGiVKr`; prueba real `sent:1` y deduplicación
  `skipped:1`.
- **2FA**: TOTP con `otplib` y ventana ±1; secreto cifrado con AES-256-GCM
  usando `TOTP_ENCRYPTION_KEY` (32 bytes base64). `sessionVersion` viaja en el
  JWT y se comprueba en `requireUser`; se incrementa al cambiar contraseña o
  2FA. Rate limit 5/15 min por email o usuario. Los códigos de recuperación se
  guardan hasheados y se consumen una sola vez. Reset por ADMIN solo si el
  admin tiene 2FA y nunca sobre sí mismo. `npm run 2fa:reset -- <email>` para
  emergencias con acceso a la base de datos. Guía: `docs/2fa.md`.
- **Migraciones fallidas en producción**: `prisma migrate deploy` aborta con
  `P3009` si una migración quedó a medias. Si la carpeta ya no existe, se
  resuelve con `prisma migrate resolve --rolled-back <nombre>`. En casa-os lo
  hace `scripts/repair-known-migrations.mjs` desde `vercel-build`, limitado a
  la migración histórica `2026102820_add_password_entry`; cualquier fallo nuevo
  detiene el build. No añadir migraciones a esa lista sin investigar la causa.
- **`docs:check` no valida implementación**: solo comprueba que existan
  `plan/spec/tasks/cierre`, que no haya casillas pendientes y que el cierre esté
  enlazado desde `MEMORY.md`. Un cierre puede pasar y describir archivos que no
  existen; hay que contrastarlos con `git ls-files`.
- **Tests**: `npm run test` ejecuta una pasada (`vitest run`); para watch,
  `npm run test:watch`. La CI usa la misma pasada.

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
- **Push solo en producción**: el SW se registra únicamente con
  `NODE_ENV=production`; en `npm run dev` el panel debe mostrar que los avisos
  no están disponibles. La prueba real de suscripción/push se hace con
  `npm run build && npm start` o en Vercel.
- **iOS necesita PWA instalada**: Safari no entrega push a una pestaña normal.
  El panel muestra la instrucción de **Añadir a pantalla de inicio** y no intenta
  suscribir en ese estado.
- **Vercel Hobby no permite cron sub-diario**: el scheduler va en GitHub Actions.
  El workflow puede retrasarse y se desactiva tras 60 días sin actividad; hay
  que documentarlo y permitir `workflow_dispatch`.
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
- **Cierre de feature**: la verificación de producción ocurre **después** del
  merge, así que no puede completarse en el PR de código. El cierre va en un PR
  `docs/cierre-<nombre>` posterior; el merge del código no es el final.
- **Escaneo local sin servidor**: `nmap` no puede correr en Vercel ni ver la red
  de casa. El escaneo se hace en el equipo del usuario y la app importa JSON;
  así no hacen falta tokens de servicio ni una tabla de historial.
- **`dryRun` seguro por defecto**: la API de importación solo escribe con
  `dryRun: false`; una petición ambigua previsualiza. La UI reenvía solo las
  filas `new` seleccionadas.
- **APIs que deben devolver JSON**: el middleware de NextAuth redirige a login
  por defecto. Para que un endpoint devuelva `401`/`403` JSON hay que excluirlo
  del matcher y confiar en el guard de la ruta (`requireAdmin`).
- **`npm run --silent` para pipes**: la cabecera de npm contamina el stdout;
  `npm run scan -- --json` sirve para leer, pero para `> archivo.json` conviene
  `npm run --silent scan -- --json`.
- **Evidencia honesta**: si el agente no puede autenticarse en producción, lo
  verifica el usuario y se registra así en `cierre.md`; no se presenta como
  verificación automática.
- **Baja lógica ≠ borrado**: la app no tiene `DELETE /api/users` y bloquea la
  autodesactivación. Una cuenta temporal de producción debe desactivarla otro
  ADMIN (o borrarse desde la base de datos); no se puede limpiar desde su propia
  sesión.
- **Estado sin tiempo real**: en serverless no hay forma de sondear la red de
  casa. El estado es tan reciente como el último escaneo aplicado; la UI debe
  decirlo y avisar si tiene más de 24 h.
- **Ausencias conservadoras**: marcar offline sin CIDR, sin `lastSeen` o con
  filas en conflicto produce falsos positivos. Se limita al CIDR, a equipos ya
  vistos y se protege cualquier equipo con una fila ambigua.
- **Escaneo viejo**: comparar `scannedAt` con el `lastSeen` de cada equipo
  (no solo con la fecha global) evita que un JSON antiguo revierta el estado.
- **`position: fixed` y ancestros transformados**: un `transform` (aunque venga
  de una animación con `fill-mode: both`) crea un containing block y rompe el
  panel a pantalla completa. La solución fue renderizarlo con un portal a
  `document.body`; se comprobó a 390 px.
- **Todo el día sin saltos de día**: no convertir a medianoche local; guardar la
  fecha UTC y comparar claves `YYYY-MM-DD` evita que el evento cambie de día
  según la zona horaria.
- **Recordatorio ≠ notificación**: guardar `reminderMinutes` no programa nada.
  La UI debe decirlo para no prometer avisos que aún no existen.
- **Push real ≠ `sent:1`**: que FCM acepte el envío no demuestra que el
  service worker lo reciba. Hay que comprobar la recepción en el navegador y,
  si se usa CDP, mantener el permiso concedido y la sesión abierta durante la
  prueba. Con el permiso revocado Chrome puede desregistrar la suscripción.
- **Aislamiento de fallos en el dispatch**: una suscripción antigua que devuelve
  `410`/`404` se desactiva sin impedir el envío a las demás. La respuesta debe
  reflejar `sent`, `failed`, `skipped` y `deactivated` por separado.
- **Deduplicación verificable**: ejecutar el workflow dos veces seguidas y
  comprobar `sent:1` y luego `skipped:1` es la prueba mínima de que no se
  duplican avisos. El estado vive en `ReminderDelivery`, no en memoria.

- **Servidor con la clave ≠ zero-knowledge**: cifrar con AES-256-GCM en el
  servidor usando `TOTP_ENCRYPTION_KEY` protege la base de datos ante una fuga
  de backup, pero no ante el propio servidor. Para credenciales reales el
  cifrado debe ocurrir en el cliente con una master password que el servidor
  nunca vea (Cuentas).
- **Un enlace sin página es peor que no tener enlace**: el PR #33 añadió
  «Contraseñas» al sidebar y el build no generaba `/contrasenas`. Antes de
  cerrar una UI, comprobar que la ruta existe en `src/app` y que el build la
  lista.
- **Marcador de cierre ≠ feature cerrada**: `.close-2fa.txt` fue un PR vacío que
  no aportó verificación. El cierre real exige `cierre.md`, `tasks.md`,
  `MEMORY.md`, `CHANGELOG.md`, docs y producción comprobada.
- **Commits directos a una feature**: 2FA se integró en `main` con cuatro
  commits sin PR de implementación. El historial queda menos trazable; el
  cierre debe identificar los commits exactos y no inventar un PR.
- **Migración revertida en el repo pero viva en la base de datos**: revertir el
  código (`90b3fbe`) eliminó la carpeta de migración, pero Neon conservó el
  registro fallido. Producción quedó atascada cinco deployments. Hay que
  comprobar `_prisma_migrations` en la base real, no solo el repo.

---

*Última actualización: 2026-10-28*
