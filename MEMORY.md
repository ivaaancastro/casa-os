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

## Roadmap — casa-os móvil (PWA, iOS + Android)

> **Enfoque:** app móvil para uso personal/familiar en casa. Tres pilares:
> notas, gestor de contraseñas y calendario. Navegación con una mano,
> FaceID/huella como entrada principal, notificaciones push de recordatorios.
> No se publica en tiendas; se instala como PWA desde "Añadir a pantalla de
> inicio".

### Estado actual de la base (ya construido y en producción)

- Auth con NextAuth (credenciales email/contraseña, roles ADMIN/FAMILY, middleware, JWT).
- PostgreSQL (Neon) en Vercel, despliegue en <https://casa-os-mauve.vercel.app>.
- PWA instalable: manifest, iconos, service worker, página offline.
- Notas con editor enriquecido tipo Apple Notas.
- Calendario familiar (mes/semana, CRUD, recordatorio almacenado).
- Recordatorios Web Push (panel Avisos, deduplicación, scheduler GitHub Actions).
- 2FA TOTP, códigos de recuperación, reset por ADMIN.
- Cuentas zero-knowledge en `/cuentas` (master password, passkey WebAuthn, kit de recuperación, sharing).
- Dispositivos y escaneo de red (CRUD, importación JSON, estado online/ausente).
- Usuarios y roles, baja lógica, perfil propio.

### 🎯 Roadmap por fases (en orden)

> Cada fase = una rama + su carpeta en `specs/`. Se trabaja **una a una**.
> El cierre documental es obligatorio antes de pasar a la siguiente.

**Fase 0 — Cierre y limpieza** ✅ (completada 2026-11-19)

- Cierre documental de `feat/cuentas`: PR #42 (`docs/cierre-cuentas`) mergeado por squash, `npm run docs:check -- cuentas` en verde y CI de `main` verde.
- `main` al día y sin PRs abiertos. El smoke autenticado en producción sigue registrado como pendiente del propietario en `specs/cuentas/cierre.md` (no se inventó evidencia).
- Ramas de PRs ya mergeados/cerrados borradas en local y remoto (19 nov 2026); solo queda `main`.

**Fase 1 — Fundación móvil + navegación nativa-sentido** ✅ (completada 2026-11-19)

- Tab bar inferior con 4 pestañas (Notas, Cuentas, Calendario, Perfil) y menú
  «Más» en Perfil; sidebar solo en escritorio. Aviso de instalación PWA compacto.
- Cabeceras Jost 21 px en móvil; Bodoni solo en el wordmark y en `md:`. Se
  descartó `#C41E3A` como acento: el rojo (`#8E2222`) sigue siendo solo estado.
- Spec aprobada, 4 E2E con Playwright, auditoría visual y cierre documental en
  `specs/fundacion-movil/`. Falta la prueba en dispositivo real (follow-up).

**Fase 2 — Gestor de contraseñas (Cuentas) móvil** ✅ (completada 2026-11-19)

- Desbloqueo **una vez por estancia en la app**: sesión en un provider del layout
  raíz; sigue abierta al cambiar de pestaña y se bloquea al salir/background,
  manualmente o a los **15 min** de inactividad (`memzero` + limpieza de grant).
- Biometría primero (passkey WebAuthn PRF con auto-intento) y master password
  como respaldo con 2FA. Decisión aprobada: **la passkey ya no pide TOTP**.
- Buscador fijo por nombre/app/página sobre datos descifrados, filtros
  compactos y tarjetas a una columna. ABM y compartir intactos; sin swipe actions.
- 5 E2E con login real, 425 tests unitarios y auditoría visual en
  `specs/cuentas-movil/`. Falta probar Face ID/huella en dispositivo real.

**Fase 3 — Notas (móvil)** ✅ (completada 2026-11-19)

- Entrar en `/notas` muestra la **lista** (título, preview y fecha), con
  buscador fijo local y chips horizontales de carpetas con contadores.
- **FAB** cuadrado de creación rápida; el editor se apila con «← Notas» y el
  volver conserva filtro, búsqueda y scroll sin recargar.
- Toolbar compacta de una fila (negrita, listas, tareas y color) con panel
  «Más formato»; checklist y «completar» con objetivos ≥ 44 px.
- Una sola vista montada por breakpoint; escritorio intacto. Sin cambios en BD,
  migraciones, API ni auth. 6 E2E nuevos y auditoría visual en
  `specs/notas-movil/`. Follow-ups: jerarquía del título en notas nuevas y
  verificación en dispositivo real.

**Fase 4 — Calendario familiar + recordatorios push** ✅ (completada 2026-11-20)

- Breakpoint móvil unificado a **1023 px** (`lg:`): el calendario usaba 767 px
  y dejaba una franja 768–1023 px con comportamiento de escritorio. El hook
  compartido vive en `src/components/mobile/useIsMobile.ts`.
- Vista Mes con celdas táctiles y chips de evento (≤2 + «+N más») y agenda del
  día con chips grandes; semana en tarjetas con «+» de 44 px. Un solo árbol
  montado por breakpoint: `CalendarMobileView` / `CalendarDesktopView`.
- **FAB portado a `body`**: el wrapper con `animate-fade-rise` deja un
  `transform` que rompía `position: fixed` y lo dejaba a 1181 px del viewport.
- `EventPanel` y `ReminderPanel` reutilizan su portal como hoja inferior con
  safe-area, campos apilados, acciones pegajosas y Jost en móvil. Bodoni solo
  en `md:`/escritorio.
- **El Web Push real no se rehízo**: ya está cerrado y verificado en
  `specs/recordatorios` (PR #26-28). Se adapta el panel y se documenta la
  evidencia existente; 7 E2E nuevos y auditoría en `specs/calendario-movil/`.
  Follow-ups: chips truncados en la rejilla, eventos fuera del primer viewport
  y prueba en dispositivo real.

**Fase 5 — Dispositivos y red** ✅ (completada 2026-11-20)

- `/devices` ya era una lista de tarjetas mobile-first, no una tabla: no se
  rehízo. `DeviceLayout` conserva el estado y monta una sola vista por
  breakpoint (`DeviceMobileView` / `DeviceDesktopView`).
- **FAB portalado a `body`** con hoja de dos acciones (Añadir / Importar) y una
  `BottomSheet` compartida por formulario e importación, con safe-area, Escape,
  foco y acciones ≥ 44 px. FAMILY ve la lista en solo lectura.
- «Copiar comando» para el `nmap` que corre en un ordenador de casa; el JSON se
  elige desde el móvil. El flujo `dryRun`/preview/deduplicación no cambió.
- 8 E2E nuevos (ADMIN y FAMILY) y auditoría visual sin hallazgos P0/P1 en
  `specs/dispositivos-movil/`. Follow-ups: espaciado de cabecera, preview largo
  sin virtualizar y prueba en dispositivo real.

**Fase 6 — Cierre y documentación** ✅ (completada 2026-11-20)

- Auditoría de los **15 cierres del protocolo** con `docs:check`: todos en verde
  (`specs/cierre-global/auditoria-docs.md`). No se fabricaron cierres para las
  10 specs anteriores al protocolo.
- Documentos vivos al día: `MEMORY.md`, `docs/roadmap.md`, `CHANGELOG.md` y
  `README.md`. El foco del roadmap está cerrado; lo que queda es backlog.
- Guía `docs/verificacion-movil-real.md` con el checklist por pestaña para
  iOS/Android. **El agente no la ejecutó**: la completa el propietario con sus
  dispositivos; el smoke autenticado en producción sigue pendiente y no se
  ejecutó aquí. Detalle: [`specs/cierre-global/cierre.md`](specs/cierre-global/cierre.md).

### 📋 Backlog (sin fecha)

- Buscador global (notas, dispositivos, documentos).
- Papelera/archivo y exportación de datos.
- Roles granulares y auditoría de cambios.
- OAuth (Google/Apple) como método de login adicional (opcional, posterior a credenciales).

### 👉 Foco actual

**En producción:** <https://casa-os-mauve.vercel.app> (Vercel + Neon). CI de `main` verde.
**En curso:** cierre documental de `seguridad-operativa` (Fase 1 del roadmap de
auditoría total, PR de cierre en curso).
**Siguiente:** rendimiento (Fase 2) tras merge del cierre. Última entrega:
Seguridad operativa (PR #65, mergeado, CI verde).

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
| fix | Estado real, docs y reparación de migración | #34, #35 | `0e8803e` / `67fe675` | `dpl_6mQZz8KvrbyZVrQqq3xh8zoZkzjg` / `dpl_5GFG2iRFRjVzZGXKnfVDK4rRG2Wd` | [`cierre`](specs/estado-real-produccion/cierre.md) |
| feat | Cuentas zero-knowledge (bóveda, master password, passkey PRF, kit, contactos, sharing, auditoría) | #37 | `86a68ba` | <https://casa-os-mauve.vercel.app> (health 200) | [`cierre`](specs/cuentas/cierre.md) |
| docs | Cierre documental de Cuentas (Fase 0) | #42 | `0051f3a` | — | [`cierre`](specs/cuentas/cierre.md) |
| feat | Fase 1 — Fundación móvil (tab bar, menú Más, PWA, cabeceras Jost, E2E) | #45 | `4de6b8b` | <https://casa-os-mauve.vercel.app> (health 200) | [`cierre`](specs/fundacion-movil/cierre.md) |
| feat | Fase 2 — Cuentas móvil (un desbloqueo por estancia, biométría-first, buscador) | #47 | `6b27dca` | <https://casa-os-mauve.vercel.app> (health 200) | [`cierre`](specs/cuentas-movil/cierre.md) |
| feat | Fase 3 — Notas móvil (lista-first, FAB, toolbar compacta, checklist táctil) | #49 | `fb4e0c8` | <https://casa-os-mauve.vercel.app> (health 200) | [`cierre`](specs/notas-movil/cierre.md) |
| feat | Fase 4 — Calendario móvil (chips, agenda, FAB portalado, hojas inferiores, avisos) | #51 | `3e558ea` | <https://casa-os-mauve.vercel.app> (health 200) | [`cierre`](specs/calendario-movil/cierre.md) |
| feat | Fase 5 — Dispositivos móvil (vistas por breakpoint, FAB, hojas, importación táctil) | #53 | `1d3bde1` | <https://casa-os-mauve.vercel.app> (health 200) | [`cierre`](specs/dispositivos-movil/cierre.md) |
| docs | Cierre global del roadmap móvil (Fases 1-6) | #55 | `1c9fc7b` | <https://casa-os-mauve.vercel.app> (health 200) | [`cierre`](specs/cierre-global/cierre.md) |
| feat | Rediseño visual Apple (Inditex→Apple) | — (rama `feat/rediseno-apple`) | — | En rama, pendiente de merge/deploy | [`cierre`](specs/rediseno-apple/cierre.md) |
| feat | Contraseñas + Face ID (renombrado, arreglo iPhone, login biométrico) | — (rama `feat/contrasenas-y-faceid`) | — | En rama, pendiente de merge/deploy | [`cierre`](specs/contrasenas-y-faceid/cierre.md) |
| fix | Accesibilidad y copy quick wins (zoom, gramática, naming, contraste, role=status) | #63 | `b8cabd7` | https://casa-os-mauve.vercel.app (deploy automático) | [`cierre`](specs/accesibilidad-quick-wins/cierre.md) |
| fix | Seguridad operativa (rate limit DB, sanitización server, recovery bcrypt, passkey cookie, audit fix) | #65 | (squash) | https://casa-os-mauve.vercel.app (deploy automático) | [`cierre`](specs/seguridad-operativa/cierre.md) |

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
- **Referencias de diseño**: `specs/rediseno-inditex/referencias-premium.md`
  recoge los patrones premium extraídos de Awwwards (19 nov 2026) para la Fase 1.
  La auditoría de diseño se hace con la skill `design-audit`
  (`.opencode/skills/design-audit/`, adaptada de `product-design/audit`): capturas
  nuevas con Chrome MCP, hallazgos ligados a cada paso y límites de evidencia
  explícitos. No confundir con `design-qa` (comparación contra un mock).
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
  `npm run test:watch`. La CI usa la misma pasada. Los E2E de navegación van
  aparte: `npm run test:e2e` (Playwright, Pixel 7/Chromium) con login real contra
  la BD local sembrada. Vitest excluye `tests/e2e/**`. La suite comparte BD y
  estado de 2FA: `workers: 1` y un `globalSetup` dejan el usuario sin 2FA antes
  de empezar. Si `next build` corre mientras está `next dev`, sobrescribe `.next`
  y el dev server sirve 404: reiniciarlo (o borrar `.next`) antes de repetir E2E.
- **CI y Google Fonts**: el loader de `next/font/google` falló una vez al
  descargar Bodoni Moda en `main` y pasó al rerun. Si se repite, valorar fuentes
  autoalojadas con `next/font/local`.
- **Notas móvil**: `NotesLayout` elige entre `NotesMobileView` y
  `NotesDesktopView` con `useIsMobile()` (`matchMedia`, < 1024 px) para montar un
  solo editor TipTap por breakpoint; con solo CSS `hidden` se montarían dos con
  ids duplicados. `filterNotes()`/`countByFolder()` son puros y están en
  `src/lib/utils/note-filter.ts`; el tipo `Note` en `src/types/note.ts`. El
  toolbar compacto es `Toolbar compact` con botón «Más» (`aria-label="Más
  formato"`). Los E2E usan `ensureNotesForE2E()` con fixtures de id fijo porque
  la BD local puede arrastrar notas de sesiones anteriores.

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
- **Borrador → nota real**: no recargar el editor desde el servidor al
  convertir un borrador: se pierde el cursor y lo escrito. `createdRef` se
  marca **antes** del POST (en desarrollo los effects corren dos veces y
  creaban notas duplicadas) y el guardado con debounce se vuelca al desmontar
  para no perder el último texto al pulsar «Volver».
- **TipTap v3 y el título inicial**: inicializar un borrador con `<h1></h1>`
  vacío y llamar a `focus('start')` en el mismo ciclo provocó
  `RangeError: Applying a mismatched transaction`. Se descartó; unificar la
  jerarquía del título en notas nuevas queda como follow-up.
- **Controles nativos fuera de paleta**: `type="search"` añade una «×» azul del
  navegador que rompe la paleta cerrada. Se usa `type="text"` con un botón
  propio en `ash`.
- **`position: fixed` dentro de `animate-fade-rise`**: la animación deja un
  `transform: matrix(1,0,0,1,0,0)` con `fill-mode: both` y convierte al wrapper
  en bloque contenedor; un FAB con `bottom` quedaba a 1181 px del viewport en
  vez de flotar. Solución: `createPortal(..., document.body)` tras el montaje.
  Aplica a cualquier control flotante dentro del contenido animado.
- **Bodoni se cuela en móvil**: la regla global `h1,h2,h3,h4 → font-display` gana
  sobre la intención de Jost. En componentes móviles hay que poner `font-ui`
  explícitamente; la auditoría lo detectó en el título del mes y en «Próximos
  avisos».
- **Push cerrado ≠ UI móvil cerrada**: la infraestructura de recordatorios ya
  estaba verificada en producción. La Fase 4 solo adaptó el panel: en local con
  `next start` el SW se registra pero aparece «no configurado en el servidor»
  al faltar VAPID locales; no es un fallo y no se inventó evidencia de envío.
- **Roadmap ≠ estado real del código**: la Fase 5 pedía «lista, no tabla», pero
  `/devices` ya era una lista revisada a 390 px. Explorar antes de escribir la
  spec evitó rehacer una feature cerrada; el valor estuvo en vistas, hojas y E2E.
- **Una `BottomSheet` compartida**: acciones, formulario e importación usan el
  mismo portal a `body` con scrim/Escape/foco/safe-area. Reutilizarla evita que
  cada panel vuelva a inventar el cierre y el manejo del teclado.
- **E2E de roles**: los fixtures de devices crean un usuario FAMILY con id/IP
  deterministas y limpian por rango `10.99.0.x`; las IP/MAC son únicas en BD y
  un descuido produce 409 en lugar del estado esperado.

---

*Última actualización: 2026-11-20 (cierre global de las Fases 1-6)*
