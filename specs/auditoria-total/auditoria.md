# Auditoría total — casa-os

**Fecha:** 2026-11-26
**Auditor:** agente (rol auditor senior)
**Rama base:** `main` @ `369fa0f` (sin PRs abiertos)
**Entorno auditado:** código fuente + baseline local (`npm run lint/typecheck/test/build`) + `npm audit`
**Viewport de referencia:** 390×844 (móvil) y escritorio 1440 px
**Documentos previos:** `specs/auditoria-senior/auditoria.md` (2026-11-24), `specs/cierre-global/auditoria-docs.md`

> **Objetivo especial del usuario:** la app debe quedar **muy simple y fácil de usar**,
> con **mucho menos texto y tecnicismos** para los usuarios que **no son admin**
> (padres/mayores). La auditoría prioriza esa simplificación junto con seguridad,
> rendimiento y calidad de código.

---

## 1. Resumen ejecutivo

casa-os es un producto **funcional y bien construido**: 443 tests en verde, lint y
typecheck limpios, build OK, base de seguridad sólida (zero-knowledge en Cuentas,
2FA, sessionVersion, CSP, headers). No hay bugs bloqueantes ni vulnerabilidades
críticas explotables en el runtime actual.

La deuda principal es de **cuatro tipos**:

1. **Simplificación para no-admin** (el mayor impacto para el usuario final):
   jerga técnica en pantalla (npm/Vercel/PRF/blobs/verificador), gramática
   (“La contraseñas”), navegación móvil que esconde secciones dentro de Perfil,
   permisos no explicados en lenguaje llano, confirmaciones inconsistentes,
   zoom bloqueado.
2. **Seguridad operativa**: rate limit de login en memoria (inútil en serverless),
   sanitización de notas solo en cliente, recovery codes con SHA-256 rápido,
   cookie de passkey con path incorrecto, 19 vulnerabilidades de dependencias.
3. **Rendimiento**: bundle de `/notas` 255 kB y `/cuentas` 298 kB, queries sin
   paginación (`notes`, `devices`, `events`), N+1 en el dispatch de recordatorios,
   índices FK ausentes.
4. **Consistencia visual**: mezcla de dos lenguajes (Apple tokens vs editorial
   Inditex) en radios, botones y tipografías; fuentes Jost/Bodoni referenciadas
   pero no cargadas.

**Veredicto:** no se requiere reescribir nada. Con 4–6 semanas de trabajo
estructurado por fases (ver §7) se puede dejar la app **simple, segura y rápida**
para toda la familia, con foco en **móvil (Android + iOS)**.

---

## 2. Alcance y metodología

- **Código:** `src/` (app, components, lib, types), `prisma/schema.prisma`,
  `next.config.js`, `tailwind.config.ts`, scripts.
- **Calidad:** `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`,
  `npm audit`.
- **Subagentes especializados:** seguridad, UI/UX y diseño, rendimiento y calidad
  de código (resultados consolidados aquí).
- **No verificado:** dispositivo físico (Face ID/safe-area), dark mode (no
  implementado), E2E en producción, smoke autenticado (pendiente del propietario).

### 2.1 Enfoque móvil (Android + iOS) — prioridad del producto

El uso real es **principalmente en móvil** (Android e iOS). Toda corrección debe
validarse en móvil real, no solo en Chrome DevTools. Puntos específicos:

- **Instalación PWA:** en iOS el push solo funciona con la app instalada (Añadir
  a pantalla de inicio). El flujo de instalación y la guía deben ser impecables y
  en lenguaje llano.
- **Safe-area:** notch, home indicator y barras del sistema en iOS/Android;
  verificar que las hojas inferiores, tab bar y FABs no queden tapados.
- **Biometría:** Face ID (iOS) / huella (Android) como entrada principal a
  `/cuentas`; debe ser fiable y con fallback claro a master password.
- **Red móvil:** bundles de 255–298 kB son pesados en 4G; priorizar code-splitting
  y carga diferida.
- **Uso con una mano:** tab bar inferior, FAB accesible, objetivos ≥ 44 px;
  evitar controles en la parte superior que requieran estirar el pulgar.
- **Gestos:** swipe para volver, deslizar para acciones (futuro); no romper el
  gesto de retroceso del sistema.
- **Offline:** la página `/offline` debe seguir funcionando sin red (ya
  implementada); verificar que no se cacheen datos privados.
- **Teclado virtual:** los inputs deben subir la vista (scroll) y no quedar
  tapados por el teclado en iOS/Android.
- **Zoom:** permitir zoom (a11y) pero sin romper el layout; probar al 200 %.
- **Orientación:** portrait principal; landscape no debe romper (especialmente
  calendario y tablas).
- **Batería/rendimiento:** evitar re-renders por keystroke y animaciones pesadas
  en dispositivos de gama media.
- **Notificaciones push:** solo en PWA instalada en iOS; mostrar instrucción
  clara si no está instalada.

> **Regla:** cada PR que toque UI debe verificarse en Chrome DevTools con
> viewport 390×844 y, cuando sea posible, en dispositivo real (iOS + Android).

### Baseline (2026-11-26)

| Métrica | Resultado |
|---|---|
| Lint | ✅ 0 warnings/errors |
| Typecheck | ✅ limpio (strict) |
| Tests | ✅ 443/443 (36 archivos) |
| Build | ✅ OK |
| Bundle `/notas` (first load) | 255 kB (ruta 167 kB) |
| Bundle `/cuentas` (first load) | 298 kB (ruta 21.3 kB) |
| Shared first load | 87.3 kB |
| `npm audit` | 19 vulnerabilidades (3 críticas, 6 altas, 10 moderadas) |

---

## 3. Fortalezas (conservar)

- **Autenticación:** NextAuth JWT + `sessionVersion` en BD; rate limit por
  email/usuario; 2FA TOTP con recuperación y reset por admin; passkey WebAuthn PRF.
- **Bóveda zero-knowledge:** cifrado en cliente (Argon2id + XChaCha20-Poly1305 +
  X25519), servidor solo ciphertext; grant ligado a sesión y `sessionVersion`;
  auto-bloqueo 15 min.
- **Mobile-first real:** un solo árbol por breakpoint (`useIsMobile`), FABs
  portalados, objetivos ≥ 44 px, safe-area.
- **Accesibilidad base:** foco visible azul 2 px, `prefers-reduced-motion`,
  `prefers-reduced-transparency`, `prefers-contrast: more`.
- **Calidad de ingeniería:** TS strict sin `any`, 443 tests, CI verde, CSP y
  headers de seguridad, `poweredByHeader: false`.
- **Seguridad de datos:** Prisma parametrizado (sin SQL injection salvo scripts
  admin), ownership checks en notes/events, admin guards.

---

## 4. Hallazgos por área

### 4.1 Seguridad

#### P0 (crítico — corregir antes de cualquier otra cosa)

_Ninguno explotable en runtime actual._ El producto es seguro para uso familiar.

#### P1 (alto)

| # | Hallazgo | Archivo | Impacto |
|---|---|---|---|
| S1 | Rate limit de login en memoria (`buckets` Map) se reinicia por instancia serverless; el bloqueo por email es eludible distribuyendo peticiones. | `src/lib/rate-limit.ts` | Medio-Alto |
| S2 | Recovery codes hasheados con SHA-256 rápido (~40 bits de entropía); fuerza bruta offline si la BD se filtra. | `src/lib/two-factor-recovery.ts:hashRecoveryCode` | Medio |
| S3 | Sanitización de notas solo en cliente; el servidor devuelve `''` y la API no sanea. Un cliente modificado puede persistir HTML no saneado. | `src/lib/utils/sanitize.ts:38-41`, `src/app/api/notes/route.ts`, `src/app/api/notes/[id]/route.ts` | Medio |
| S4 | Cookie de challenge de passkey con `path: '/api/cuentas'`, pero las rutas de login con passkey viven en `/api/auth/login/passkey` → la cookie nunca se envía y el login biométrico falla. | `src/lib/vault/webauthn.ts` (setChallengeCookie), `src/app/api/auth/login/passkey/*` | Alto (funcional) |
| S5 | 19 vulnerabilidades de dependencias (3 críticas, 6 altas): `next`, `postcss`, `zod`, `tinypool`. | `package.json`, `package-lock.json` | Alto (supply chain) |

#### P2 (medio)

| # | Hallazgo | Archivo |
|---|---|---|
| S6 | Enumeración de usuarios por timing en `authorize` (falta bcrypt cuando el usuario no existe). | `src/lib/auth.ts` |
| S7 | Token de login con passkey reutilizable dentro de 60 s (no single-use). | `src/app/api/auth/login/passkey/route.ts` |
| S8 | Sin rate limit en endpoints de passkey (login/options). | `src/app/api/auth/login/passkey/*`, `src/app/api/auth/passkeys/*` |
| S9 | `scripts/backup-db.ts` interpola `DATABASE_URL` en shell → inyección de comandos (solo admin/local). | `scripts/backup-db.ts` |
| S10 | CSP con `'unsafe-inline'` en `script-src` (necesario para Next, pero debilita XSS). | `next.config.js` |
| S11 | Enumeración menor: `passkey/options` revela si un email tiene passkeys vía `allowCredentials`. | `src/app/api/auth/login/passkey/options/route.ts` |
| S12 | Cambios de rol/activación no incrementan `sessionVersion` (funciona por re-lectura en BD, pero inconsistente). | `src/app/api/users/[id]/route.ts` |

#### P3 (bajo / higiene)

- `src/app/api/notes/[id]/route.ts` usa `error.name === 'ZodError'` en vez de `instanceof ZodError`.
- `src/lib/auth-events.ts` usa fallback determinista `'casa-os-ip-hash'` si falta env.
- Passkey login token firmado con `NEXTAUTH_SECRET` (HMAC) — correcto, pero no hay rotación de secreto documentada.

---

### 4.2 Rendimiento y calidad de código

#### P1 (alto impacto)

| # | Hallazgo | Archivo | Impacto |
|---|---|---|---|
| R1 | Bundle `/notas` 255 kB por TipTap importado estáticamente (starter-kit + table + list + color + text-style + …). | `src/components/notes/NoteEditor.tsx:5-13` | Alto (móvil) |
| R2 | Bundle `/cuentas` 298 kB por `libsodium-wrappers-sumo`. Verificar si basta la build estándar (sumo solo para `crypto_pwhash` con límites altos). | `src/lib/vault/crypto.ts:11`, `recovery-code.ts:7` | Alto (móvil) |
| R3 | N+1 en dispatch: `pushSubscription.findMany` dentro del bucle de eventos. | `src/app/api/reminders/dispatch/route.ts:86` | Alto (cron) |
| R4 | Queries sin paginación: notas, dispositivos, eventos, usuarios, cuentas. | `src/app/notas/page.tsx:16`, `src/app/devices/page.tsx:18`, `src/app/api/notes/route.ts:21`, `src/app/api/devices/route.ts:18`, `src/app/api/events/route.ts:27-42`, `src/app/api/users/route.ts:13`, `src/app/api/cuentas/accounts/route.ts:31` | Medio-Alto |
| R5 | Dashboard carga **todos** los dispositivos solo para contar online y último `lastSeen`. | `src/app/page.tsx:41-43` | Medio |

#### P2 (medio)

| # | Hallazgo | Archivo |
|---|---|---|
| R6 | Eventos GET devuelve todos si no hay rango `from/to`. | `src/app/api/events/route.ts:27-42` |
| R7 | Auditoría escribe en bucle (`logVaultEvent` por destinatario). | `src/app/api/cuentas/accounts/[id]/keys/route.ts:112-129` |
| R8 | Recovery upsert en bucle dentro de transacción. | `src/app/api/cuentas/recovery/route.ts:137-154` |
| R9 | Status de cuentas: llamadas DB secuenciales independientes. | `src/app/api/cuentas/status/route.ts:40-56` |
| R10 | Índices FK ausentes: `Note.authorId/type/createdAt`, `Device.ownerId`, `Event.ownerId/createdById/reminderMinutes`, `Account.userId`, `Session.userId`. | `prisma/schema.prisma` |
| R11 | `useIsMobile` inicializa en `false` (escritorio) y luego cambia → doble montaje de árboles pesados en móvil. | `src/components/mobile/useIsMobile.ts:18` |
| R12 | `NoteEditor` con `shouldRerenderOnTransaction: true` re-renderiza toolbar en cada keystroke. | `src/components/notes/NoteEditor.tsx:136` |
| R13 | `NotesLayout` construye `sharedProps` cada render (nueva referencia). | `src/components/notes/NotesLayout.tsx` |
| R14 | Rate limiter en memoria (per-instance) en serverless. | `src/lib/rate-limit.ts` (compartido con S1) |
| R15 | Sin cobertura de tests en API/DB/componentes; `vitest.config.ts` sin provider de coverage. | `vitest.config.ts` |
| R16 | 2 tests de auth fallan por timeout de bcrypt (coste 12 vs 5 s por defecto). | `tests/auth.test.ts`, `vitest.config.ts` |
| R17 | `force-dynamic` en todas las páginas, sin revalidate/cache. | todas las pages |
| R18 | Sin SWR/React Query; fetches manuales sin dedup. | `CalendarApp`, `VaultWorkspace` |
| R19 | Heavy dialogs siempre en el bundle de la página. | `AccountDialog`, `ShareDialog`, `VaultSettings`, `EventPanel` |

#### P3 (bajo)

- `src/lib/prisma.ts` sin tuning de pool para serverless.
- bcrypt coste 12 (~cientos de ms) en endpoints de contraseña; documentar presupuesto de latencia.
- `Event` filter usa `OR` con `end: null`; índice en `start` cubre.

---

### 4.3 UX/UI, accesibilidad y simplicidad (foco: no-admin)

#### Accesibilidad (WCAG)

| # | Hallazgo | Archivo | Severidad |
|---|---|---|---|
| A1 | Zoom bloqueado: `maximumScale: 1`, `userScalable: false`. Falla WCAG 1.4.4. **Grave para mayores.** | `src/app/layout.tsx:32-39` | Crítica (a11y) |
| A2 | Contraste insuficiente: `text-canvas/60` sobre `bg-accent` (#007AFF) en contador de carpetas. | `src/components/notes/FolderChips.tsx:31-38` | Media |
| A3 | Fechas fuera de mes con `text-ash/70` (contraste bajo). | `MonthView.tsx:76`, `MonthViewMobile.tsx:76` | Baja |
| A4 | Modales/hojas sin focus trap (foco escapa al fondo). | `cuentas/ui.tsx` (Modal), `EventPanel.tsx`, `BottomSheet.tsx` | Media |
| A5 | Calendario sin navegación por flechas entre días (solo Tab). | `MonthView*.tsx` | Baja |
| A6 | Etiquetas de 11 px en tab bar inferior. | `BottomTabBar.tsx:59` | Baja |
| A7 | `DeviceMobileView` muestra línea informativa sin `role="status"`. | `DeviceMobileView.tsx:20-23` | Baja |
| A8 | `window.confirm`/`window.prompt` (family reset, link URL) no son mobile-friendly ni accesibles. | `FamilyManager.tsx:101`, `Toolbar.tsx:110-119` | Media |

#### Jerga técnica expuesta a no-admin

| # | Texto técnico | Archivo | Acción |
|---|---|---|---|
| U1 | `npm run scan -- --out scan-latest.json`, “no en Vercel”, AirDrop/Drive/email. | `ScanImportPanel.tsx:9` | Reescribir en lenguaje llano o mover a ayuda admin-only. |
| U2 | “Contraseñas zero-knowledge del hogar” (metadata). | `src/app/cuentas/page.tsx:11` | Cambiar a “Tus contraseñas guardadas de forma segura”. |
| U3 | “PRF”, “blobs cifrados”, “verificador”. | `VaultSettings.tsx:522-525`, `VaultOnboarding.tsx:337-339,368`, `VaultUnlock.tsx:273` | Ocultar detalles; mostrar solo resultado (“Tu dispositivo puede desbloquear sin contraseña”). |
| U4 | “Sin escaneos aplicados”, “Estado desactualizado, sube un escaneo nuevo”. | `devices/page.tsx:82-83` | “Todavía no se ha revisado la red”, “Hace tiempo que no se revisa”. |
| U5 | “Los avisos se activan en la versión publicada. En desarrollo el service worker no está registrado.” | `ReminderPanel.tsx:470-474` | Mostrar solo en dev; en prod, mensaje neutro. |
| U6 | “Familia” y roles ADMIN/FAMILY sin explicación de qué puede hacer cada uno. | `FamilyManager.tsx` | Añadir texto llano: “Puede ver todo y añadir notas/eventos” vs “Puede administrar la app”. |

#### Gramática y naming

| # | Problema | Archivo |
|---|---|---|
| U7 | “La contraseñas” (artículo femenino + sustantivo plural) repetido. | `VaultApp.tsx` (múltiples), `VaultWorkspace.tsx:137,243` |
| U8 | Mezcla “Contraseñas” (nav) vs “Tus cuentas” (workspace heading) vs “Contraseñas zero-knowledge” (metadata). | `nav-items.ts`, `VaultWorkspace.tsx`, `cuentas/page.tsx` |
| U9 | “Avisos” vs “Recordatorio(s)” inconsistente. | `ReminderPanel`, `EventPanel` |

#### Navegación y descubribilidad (móvil)

| # | Problema | Archivo |
|---|---|---|
| U10 | Dashboard, Dispositivos y Familia solo accesibles desde “Más” dentro de Perfil; un padre que no abre Perfil no las encuentra. | `nav-items.ts`, `MoreDrawer.tsx`, `PerfilPage.tsx:31` |
| U11 | Botón “Más” pequeño, sin icono ni etiqueta clara. | `MoreDrawer.tsx` |
| U12 | Acciones rápidas del dashboard (“Dispositivos”, “Familia”) para todos los roles, aunque FAMILY solo lee. | `src/app/page.tsx:53-59` |

#### Permisos en UI

| # | Problema | Archivo |
|---|---|---|
| U13 | Botón de borrar nota siempre visible; fallo silencioso en 403 para no autores (no se muestra error). | `NoteEditor.tsx:319-334`, `handleDelete` |
| U14 | `DeviceMobileView` muestra línea pasiva en vez de estado vacío/disabled coherente con desktop. | `DeviceMobileView.tsx:20-23` |
| U15 | Confirmaciones destructivas inconsistentes: inline (devices), `window.confirm` (family), “BORRAR” (vault). | `DeviceActionSheet`, `FamilyManager`, `VaultSettings` |

#### Formularios

| # | Problema | Archivo |
|---|---|---|
| U16 | IP sin validación de formato; MAC sin normalización. | `DeviceForm.tsx` |
| U17 | Portapapeles se limpia a los 60 s sin aviso/control. | `AccountDialog.tsx:93-97` |
| U18 | `window.prompt` para URL de enlace (no mobile-friendly). | `Toolbar.tsx:110-119` |

#### Estados vacíos / carga / error

- Generalmente buenos y localizados. Excepciones: borrado de nota silencioso (U13), `VaultWorkspace` loading con texto técnico aceptable, `ReminderPanel` con texto dev (U5).

---

### 4.4 Consistencia visual (Apple vs Inditex)

| # | Hallazgo | Archivo |
|---|---|---|
| V1 | Dos lenguajes coexisten: Apple tokens (radios, paleta iOS) vs editorial (micro-labels mayúsculas, bordes rectos, monócromo) en cuentas/dispositivos/familia/calendario. | `tailwind.config.ts`, `globals.css`, componentes |
| V2 | Fuentes Jost/Bodoni referenciadas en `PageHeader.tsx` y `Toolbar.tsx` pero **no cargadas** (sin `@font-face`/`next/font`) → fallback silencioso. | `PageHeader.tsx:10-11`, `Toolbar.tsx:13-14` |
| V3 | `Button` de cuentas sin radio; `.btn` con `rounded-xl`; `.card` con `rounded-2xl`. | `cuentas/ui.tsx`, `globals.css` |
| V4 | Tipografía cambia `font-ui`/`font-display` aunque ambas resuelven a SF Pro; diferencia solo en tracking. | tailwind config |
| V5 | Wordmark repetido (sidebar + dashboard + login) y mezcla `casa·os`/`casa-os`. | `Sidebar`, `page.tsx`, `login` |
| V6 | Sin dark mode (`colorScheme: 'light'`); tokens semánticos preparados pero no activados. | `layout.tsx:38`, `globals.css` |

---

### 4.5 Dependencias (npm audit)

| Paquete | Severidad | Nota |
|---|---|---|
| `next` (transitivo `postcss`) | critical/high | RCE en optimización de imágenes; la app no usa `next/image` → no explotable directamente. |
| `postcss` | high | XSS/path traversal en stringify/sourceMap. |
| `zod` < 4.6.6 | high | Exhaustión de memoria en colecciones grandes. |
| `tinypool` | critical | RCE por prototype pollution (solo dev/vitest). |
| `postcss-selector-parser` | moderate | Complejidad cuadrática. |
| Otros | moderate | 10 moderadas. |

Fix: `npm audit fix` (no breaking) para los no-breaking; PR dedicado con `--force` para zod 4 / next 16 / vitest 5 (breaking).

---

## 5. Roadmap de correcciones (priorizado)

### Fase 0 — Quick wins de accesibilidad y copy (1–2 días)
**Objetivo:** que la app sea usable por mayores sin bloqueos evidentes.

- [ ] **A1** Eliminar bloqueo de zoom (`maximumScale: 1`, `userScalable: false`) en `src/app/layout.tsx`. (Crítico a11y)
- [ ] **U7** Corregir “La contraseñas” → “Las contraseñas”/“Tu contraseña” en `VaultApp.tsx` y `VaultWorkspace.tsx`.
- [ ] **U8** Unificar nombre del producto: “Contraseñas” en nav, workspace heading y metadata.
- [ ] **U2** Metadata de cuentas: “Tus contraseñas guardadas de forma segura”.
- [ ] **U4** Reescribir copy de dispositivos (“Todavía no se ha revisado la red”, etc.).
- [ ] **U5** Ocultar texto dev de `ReminderPanel` en producción (solo dev).
- [ ] **U9** Unificar vocabulario “Avisos”/“Recordatorios” (elegir uno).
- [ ] **V5** Unificar wordmark (`casa·os` vs `casa-os`) y mostrarlo una sola vez por pantalla.
- [ ] **A2** Mejorar contraste del contador en `FolderChips`.
- [ ] **A7** Añadir `role="status"` a la línea informativa de `DeviceMobileView`.

**Verificación:** lint + typecheck + test + build; revisión visual con Chrome MCP en
móvil (390×844) en iOS y Android; probar zoom al 200 % y teclado virtual.

### Fase 1 — Seguridad operativa (2–3 días)
**Objetivo:** cerrar las brechas de seguridad reales.

- [ ] **S4** Corregir path de la cookie de challenge de passkey a `/` en `src/lib/vault/webauthn.ts`. (Alto, funcional)
- [ ] **S1** Sustituir rate limit en memoria por contador en BD (o reutilizar `isLoginRateLimited`) para la clave por email.
- [ ] **S3** Añadir sanitización server-side de notas (isomorphic DOMPurify o `sanitize-html`) en `POST/PATCH /api/notes`; mantener cliente como UX.
- [ ] **S2** Hashear recovery codes con bcrypt/argon2 (coste moderado) en vez de SHA-256.
- [ ] **S6** Igualar timing en `authorize` (ejecutar bcrypt sobre un hash dummy si el usuario no existe).
- [ ] **S7/S8** Token de passkey single-use (jti en BD o cache) + rate limit en endpoints passkey.
- [ ] **S9** Sanitizar/validar `DATABASE_URL` en `backup-db.ts` (usar `execFile`/validación).
- [ ] **S12** Incrementar `sessionVersion` al cambiar rol/activación en `users/[id]`.
- [ ] **S5** Aplicar `npm audit fix` (no breaking) y abrir PR dedicado para zod 4 / next / vitest (breaking).
- [ ] **S10** Documentar CSP; evaluar nonce para scripts (futuro, no bloqueante).

**Verificación:** tests de seguridad nuevos (rate limit, sanitización, recovery); `npm audit` sin critical/high en prod deps.

### Fase 2 — Rendimiento (3–5 días)
**Objetivo:** reducir bundle y latencia en móvil.

- [ ] **R1** Cargar TipTap con `next/dynamic` (ssr: false) en `NoteEditor`; separar extensiones no críticas.
- [ ] **R2** Evaluar `libsodium-wrappers` (no sumo) si no se usan APIs sumo-only; cargar crypto con dynamic import al desbloquear.
- [ ] **R19** Cargar dialogs pesados (`AccountDialog`, `ShareDialog`, `VaultSettings`, `EventPanel`) con `next/dynamic`.
- [ ] **R3** Prefetch de suscripciones en dispatch (una query + join en memoria).
- [ ] **R4/R6** Añadir paginación (`take`/cursor) a notes, devices, events; default de rango en events GET (últimos 30 días + próximos 90).
- [ ] **R5** Dashboard: usar `_count` y `aggregate max(lastSeen)` en vez de cargar todos los devices.
- [ ] **R7/R8/R9** Batch de audit writes y status queries.
- [ ] **R10** Migración con índices FK/composite (Note, Device, Event, Account, Session).
- [ ] **R11** Inicializar `useIsMobile` de forma SSR-safe (placeholder hasta hidratar) para evitar doble montaje.
- [ ] **R12/R13** Memoizar toolbar (React.memo) y `sharedProps` (useMemo).
- [ ] **R15/R16** Subir `testTimeout` (o bajar coste en tests); añadir `@vitest/coverage-v8` con umbral para `src/lib`.
- [ ] **R17/R18** Evaluar revalidate/tagged cache en lists; SWR solo si se justifica (no over-engineer).

**Verificación:** build + Lighthouse (first load < 200 kB en /notas y /cuentas); tests.

### Fase 3 — Simplificación para no-admin (3–5 días) ⭐ prioridad del usuario
**Objetivo:** que un padre/madre use la app sin ayuda y sin leer tecnicismos.

- [ ] **U10/U11** Hacer descubribles Dashboard/Dispositivos/Familia en móvil: añadir un botón “Más” persistente en la barra inferior o en la cabecera, con icono y etiqueta clara (no solo dentro de Perfil).
- [ ] **U1/U3/U5/U6** Eliminar jerga: npm/Vercel/PRF/blobs/verificador; reescribir en lenguaje llano o mover a ayuda admin-only.
- [ ] **U12** Acciones rápidas del dashboard condicionadas por rol (FAMILY no ve “Dispositivos/Familia” como acción primaria, o las ve como “Ver”).
- [ ] **U13** Ocultar/deshabilitar “Borrar” en notas para no autores y mostrar “No tienes permiso para borrar esta nota” en vez de fallo silencioso.
- [ ] **U14** Unificar estado vacío/disabled de dispositivos entre móvil y escritorio.
- [ ] **U15** Estandarizar confirmaciones destructivas: un solo patrón accesible (hoja inferior con “Cancelar”/“Eliminar”, foco, Escape).
- [ ] **U16/U17/U18** Validar IP/MAC en `DeviceForm`; avisar antes de limpiar portapapeles; reemplazar `window.prompt` por input inline para enlaces.
- [ ] **U1** Reescribir `ScanImportPanel` para admin con pasos en lenguaje llano (“1. Abre el ordenador de casa… 2. Copia el comando… 3. Pega el resultado aquí”).
- [ ] **U6** Explicar roles en Familia en lenguaje llano.
- [ ] **A8** Reemplazar `window.confirm`/`window.prompt` por componentes accesibles.

**Verificación:** prueba con usuarios reales (padres) en móvil (iOS + Android) +
E2E de navegación; comprobar uso con una mano y teclado virtual.

### Fase 4 — Consistencia visual Apple (4–6 días)
**Objetivo:** un único lenguaje visual, cálido y legible.

- [ ] **V1** Decidir y aplicar un solo lenguaje: Apple HIG (radios, paleta, espaciado) en todas las secciones; eliminar micro-labels mayúsculas decorativas (salvo convención iOS Settings).
- [ ] **V2** Cargar fuentes o eliminar referencias a Jost/Bodoni; usar solo SF Pro del sistema (ya configurado).
- [ ] **V3** Estandarizar radios y botones (`.btn` redondeado en todas partes; quitar bordes rectos en cuentas/dispositivos).
- [ ] **V4** Unificar tipografía móvil/escritorio (Jost en móvil ya es SF Pro; quitar `font-display` en headings móviles).
- [ ] **V6** Preparar dark mode: tokens semánticos + `prefers-color-scheme` (entregar claro en Fase 4, oscuro en follow-up).
- [ ] **A4/A5/A6** Focus trap en modales/hojas, navegación por flechas en calendario, tamaño mínimo de etiquetas.
- [ ] **M1** Verificar safe-area en iOS/Android: hojas inferiores, tab bar y FABs no tapados por notch/home indicator.
- [ ] **M2** Verificar que el teclado virtual no tape inputs en iOS/Android (scroll automático).
- [ ] **M3** Verificar gesto de retroceso del sistema no se rompe.
- [ ] **M4** Verificar instalación PWA en iOS (Añadir a pantalla de inicio) y guía de push.
- [ ] **A3** Mejorar contraste de fechas fuera de mes.

**Verificación:** auditoría visual con Chrome MCP en móvil y escritorio; Lighthouse ≥ 95.

### Fase 5 — Dependencias y tests (continuo)
- [ ] **S5** PR dedicado para actualizar `zod` (4.x), `next` (16.x), `vitest` (5.x) con sus breaking changes.
- [ ] **R15** Cobertura con `@vitest/coverage-v8` y umbral en `src/lib`.
- [ ] Tests de API (notes, events, devices) y componentes críticos (NoteEditor, VaultUnlock).
- [ ] E2E en producción (smoke autenticado) por parte del propietario.

---

## 6. Accesibilidad — checklist WCAG

- [ ] **1.4.4 Resize text:** eliminar zoom lock (A1).
- [ ] **1.4.3 Contraste:** revisar `text-canvas/60` sobre accent y `text-ash/70` (A2, A3).
- [ ] **2.1.1 Teclado:** focus trap en modales/hojas; navegación por flechas en calendario (A4, A5).
- [ ] **2.4.3 Orden de foco:** verificar en calendario y editor TipTap.
- [ ] **4.1.2 Nombre, rol, valor:** `role="status"` en mensajes informativos (A7).
- [ ] **2.5.5 Tamaño del objetivo:** ≥ 44 px (ya cumplido en móvil; revisar escritorio 40 px en `date-nav`).
- [ ] **1.3.1 Info y relaciones:** jerarquía de headings (h1 → h2, sin saltos) — ya corregido en dashboard; revisar otras páginas.
- [ ] **3.3.1 Identificación de errores:** mostrar errores en borrado de notas (U13).
- [ ] **3.2.2 Al recibir entradas:** sin cambios inesperados.

---

## 7. Límites de evidencia

- No se probó en dispositivo físico (Face ID, safe-area real, vibración).
- Dark mode no implementado.
- No se ejecutaron E2E de Playwright en esta sesión (conflicto de puerto con `next build` sobre `.next`).
- `npm audit` refleja el árbol actual; las críticas de `tinypool` son dev-only.
- El smoke autenticado en producción sigue pendiente del propietario (no se inventó evidencia).
- Algunos hallazgos (bundle size) son estimaciones basadas en el build; medir con Lighthouse real tras los cambios.

---

## 8. Checklist accionable (orden de ejecución)

1. Crear rama `fix/accesibilidad-quick-wins` → Fase 0 → PR → merge → cierre docs.
2. Crear rama `fix/seguridad-operativa` → Fase 1 → PR → merge → cierre docs.
3. Crear rama `perf/bundle-y-queries` → Fase 2 → PR → merge → cierre docs.
4. Crear rama `feat/simplificacion-no-admin` → Fase 3 → PR → merge → cierre docs.
5. Crear rama `feat/consistencia-visual-apple` → Fase 4 → PR → merge → cierre docs.
6. Fase 5 de forma continua (deps + tests).

**Regla de bloqueo:** una feature activa a la vez; no abrir la siguiente hasta mergear
el cierre documental de la anterior (AGENTS.md).

---

## 9. Conclusión

casa-os no tiene bugs bloqueantes. Su deuda principal es de **producto y presentación
para usuarios no técnicos**, más **seguridad operativa** y **rendimiento en móvil**.
La migración a un único lenguaje Apple, la eliminación de jerga y la simplificación
de la navegación para mayores son los cambios de mayor impacto para la familia.

Se recomienda empezar por la **Fase 0 (accesibilidad + copy)** porque es de bajo
riesgo, alto impacto y desbloquea el uso por parte de los padres inmediatamente.
La seguridad operativa (Fase 1) debe ir a continuación por su carácter preventivo.
