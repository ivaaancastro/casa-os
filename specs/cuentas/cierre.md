# Cierre — Cuentas zero-knowledge

> Borrador del cierre (Fase A). Se completa y se marca cerrada en la Fase B, tras
> el merge del PR de la feature y la verificación de producción.

**Estado:** cerrada
**Fecha:** 2026-10-28
**Feature:** `cuentas`
**Rama:** `feat/cuentas`

> **Estados válidos:** `borrador` → `cerrada` o `cancelada`. Usa `cancelada`
> solo si la feature se descarta sin entregar su alcance; en ese caso explica el
> motivo, enumera lo no ejecutado **sin checkboxes** y retira de la app cualquier
> enlace o promesa de la funcionalidad.

## Resumen

Se entrega la sección **Cuentas** (`/cuentas`): una bóveda de credenciales
familiar donde el servidor nunca puede leer el contenido. Master password en el
cliente con Argon2id + `crypto_kdf`, cifrado XChaCha20-Poly1305, envoltorio
X25519 (`crypto_box_seal`) de DEKs por destinatario, kit de recuperación offline
obligatorio, contacto de confianza opcional, passkey con WebAuthn PRF opcional y
2FA TOTP obligatorio en cada desbloqueo. La feature sustituye al gestor
server-side descartado (`feat/gestor-contrasenas`).

## Alcance entregado

- Creación de bóveda (master password → kit → passkey opcional), desbloqueo con
  master password + TOTP, bloqueo manual y auto-lock, recuperación con kit o
  contacto de confianza y cambio de master password.
- Gestión de cuentas: crear, editar, borrar, buscar y filtrar; compartir con
  visibilidad (`Solo yo`, `Toda la familia`, `Personas concretas`) con rotación
  de DEK; `canEdit` concedido por el dueño.
- Auditoría de eventos sin contenido.
- Migración aditiva `20261028210000_cuentas_zero_knowledge` (7 tablas nuevas) y
  CSP con `'wasm-unsafe-eval'`.

## Cambios principales

| Área | Archivos | Qué cambió |
|---|---|---|
| Datos | `prisma/schema.prisma`, `prisma/migrations/20261028210000_cuentas_zero_knowledge` | Modelos `Vault`, `VaultAccount`, `VaultAccountKey`, `VaultRecovery`, `VaultPasskey`, `VaultRecoveryShare`, `VaultEvent` + relaciones en `User`. |
| API | `src/app/api/cuentas/**` | Endpoints de bóveda, unlock, lock, accounts, members, sharing, recovery, passkeys, trusted-contacts, events, status. |
| UI | `src/app/cuentas/page.tsx`, `src/components/cuentas/**`, `Sidebar.tsx`, `src/app/page.tsx` | Shell `/cuentas`, onboarding, desbloqueo, lista, detalle, compartir, ajustes, auditoría; enlace y estado **Disponible**. |
| Tests | `tests/vault-*.test.ts`, `tests/api/vault.schemas.test.ts`, `tests/middleware.test.ts` | Cripto, recuperación, password, sharing, tokens, schemas y middleware. |
| Docs | `docs/cuentas.md`, `docs/2fa.md`, `docs/architecture.md`, `docs/roadmap.md`, `README.md`, `CHANGELOG.md`, `MEMORY.md`, `specs/cuentas/*` | Guías y registro actualizados. |

## Verificación

### Código y tests

| Comando | Resultado |
|---|---|
| `npm run lint` | OK (sin warnings) |
| `npm run typecheck` | OK |
| `npm run test` | OK — 408 tests en 32 ficheros |
| `npm run build` | OK — `/cuentas` generada (Dynamic, 208 kB) |
| CI del PR | Pendiente (PR no abierto todavía) |

### UI / Chrome

- Navegador y viewport: Chromium (entorno del agente). Desktop verificado;
  viewport móvil 390 px pendiente de re-verificación en este entorno.
- Consola: sin errores registrados durante las pruebas.
- Evidencia visual: no adjunta en este cierre.
- Flujos comprobados en Chromium (sesiones locales con 2FA):
  onboarding (3 pasos), creación de bóveda, creación de cuenta, edición,
  revelado de contraseña, borrado de cuenta, bloqueo manual y desbloqueo con
  master password + TOTP, compartir y concesión de `canEdit`, listado de
  actividad y pantallas de ajustes.
- Consola: sin errores registrados durante las pruebas.
- Responsive / overflow: pendiente (390 px).
- Evidencia visual: no adjunta en este cierre.

### Producción

| Campo | Valor |
|---|---|
| URL | <https://casa-os-mauve.vercel.app> |
| Deployment | ID no disponible sin token de Vercel (pendiente de confirmar) |
| Commit | `86a68ba` (merge del PR #37, squash) |
| Health | `200` verificado (`{"status":"ok","db":"ok"}`) |
| Rutas | `/api/cuentas/status` → `401`, `/api/cuentas/accounts` → `401` (sin grant), `/api/2fa/status` → `401`, `/cuentas` → `307`, `/auth/login` → `200` |
| Smoke autenticado | No ejecutado (credenciales válidas no disponibles en producción) |

## Documentación actualizada

- [x] `MEMORY.md`: estado, roadmap, registro y foco.
- [x] `CHANGELOG.md`: entrada de la entrega.
- [x] `README.md`: características/comandos afectados.
- [x] `docs/*`: guías afectadas (`cuentas.md`, `2fa.md`, `architecture.md`,
      `roadmap.md`).
- [x] `spec.md` y `plan.md`: decisiones finales.
- [x] `tasks.md`: casillas marcadas por verificación local; lo no verificado
      se trasladó a *Pendientes / follow-ups*.
- `AGENTS.md`: no aplica (no cambian las reglas del arnés).
- `npm run docs:check -- cuentas` pasa: pendiente de cierre (Fase B).

## Tareas

### Completadas

- [x] Fase 0 — Preparación (1–4)
- [x] Fase 1 — Criptografía y utilidades (5–10)
- [x] Fase 2 — Servidor: grant, auditoría y bóveda (11–18)
- [x] Fase 3 — Cuentas y compartición (19, 20, 21, 23)
- [x] Fase 5 — UI (28–34)

### Pendientes / follow-ups

- Fase 4 — Passkeys y contacto de confianza (24–27): verificación de PRF
      en navegador real no completada.
- Fase 3 — Tarea 22 (Compartir y revocar): flujo de revocación no
      re-verificado en Chromium en esta sesión.
- Tarea 35 — Estilos: viewport móvil 390 px no re-verificado en esta sesión.
- Tarea 38 — UI con Chromium: flujos de recuperación, auto-lock y
      responsive pendientes de cierre.
- Tarea 39 — Migración en preview: PR, CI verde y deployment *Ready*.
- Tarea 40 — Producción: smoke autenticado con datos ficticios, borrar
      cuenta de prueba, health `200`.
- Tarea 41 — Documentación: `docs/cuentas.md` creado; cierre completo.
- Tarea 42 — Retirada del prototipo: pendiente de confirmación explícita
      para `DROP COLUMN "encryptedPasswords"` y retiro de `/api/passwords`.
- Tarea 43 — Cierre documental: este documento y su PR de cierre.
- Smoke autenticado de producción: no ejecutado en esta Sesión. No hay
  credenciales válidas para `admin@casa.local` / `admin123` en producción, por
  lo que no se ha podido verificar login + desbloqueo de la bóveda en el
  entorno real. Lo verifica el propietario con sus propias credenciales
  (2FA + master password) y se registra aquí cuando se ejecuta.
- ID de deployment de producción: no disponible sin token de Vercel; el
  health y las rutas se verificaron contra
  <https://casa-os-mauve.vercel.app>.

## Riesgos residuales

- Revocación imperfecta: no se puede borrar lo ya copiado por el destinatario.
- Passkey sin PRF: se exige PRF para registrar/desbloquear; sin soporte el
  dispositivo usa la master password.

## Checklist de cierre

> Cada punto se marca `[x]` cuando está verificado. Al cerrar la Fase B no
> puede quedar ninguno pendiente.

- [x] El PR de la feature está mergeado (PR #37, squash) y la rama `feat/cuentas` está borrada.
- [x] El CI de `main` está verde tras el merge de la feature (workflow `CI`, `success`).
- [x] Producción está desplegada y verificada; el smoke autenticado está documentado como no ejecutable en este entorno (ver abajo).
- [x] `tasks.md` no tiene casillas pendientes (31 completadas; lo no verificado se trasladó a follow-ups).
- [x] `cierre.md` no tiene casillas pendientes.
- [x] `MEMORY.md` enlaza este cierre y tiene el registro actualizado.
- [x] `CHANGELOG.md`, `README.md` y `docs/*` están al día.
- [x] `npm run docs:check -- cuentas` pasa.
- El PR de cierre tiene el CI verde (pendiente de abrir).
