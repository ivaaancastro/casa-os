# Cierre — Fase 2: Cuentas móvil

**Estado:** cerrada
**Fecha:** 2026-11-19
**Feature:** `cuentas-movil`
**Rama:** `feat/cuentas-movil` (borrada tras el merge)

## Resumen

Se entrega el ciclo de desbloqueo móvil de `/cuentas`: una sola autenticación
por estancia en la app, biométrica primero y master password como respaldo, con
bóveda abierta al cambiar de pestaña y bloqueo al salir. Se completa con una
búsqueda fija y local y una lista adaptada a 390 px. No cambia el modelo de
datos, el cifrado ni el motor de compartir de Fase 0.

## Alcance entregado

- Sesión de bóveda en un provider del layout raíz: sobrevive a la navegación
  entre pestañas, se bloquea en background/cierre, manualmente o a los 15 min.
- Desbloqueo con passkey WebAuthn PRF (Face ID/huella) con auto-intento al
  entrar; la vía password sigue con 2FA; el TOTP se quitó solo de la passkey.
- Buscador fijo por título, usuario, URL/app, notas y categoría, sin peticiones
  por pulsación; filtros compactos y tarjetas a una columna en móvil.
- ABM y compartir intactos, sin swipe actions (decisión aprobada).
- Tests unitarios del ciclo de sesión y del filtrado, E2E con sesión real y
  auditoría visual con capturas de la sesión.

## Cambios principales

| Área | Archivos | Qué cambió |
|---|---|---|
| Sesión | `VaultSessionProvider.tsx`, `session-lifecycle.ts`, `AppShell.tsx`, `VaultApp.tsx`, `constants.ts` | Provider en layout raíz, `AutoLockController` a 15 min, `memzero`, `visibilitychange`/`pagehide`, limpieza del grant. |
| Desbloqueo | `VaultUnlock.tsx`, `passkey.ts`, `unlock/passkey/route.ts`, `schemas.ts`, `VaultOnboarding.tsx` | Biometría prioritaria con auto-intento, password como fallback, `code` opcional en la passkey, copy actualizado. |
| Lista | `search.ts`, `VaultWorkspace.tsx` | `filterAccounts()` pura y testeable, buscador sticky, filtros en dos columnas, tarjetas móviles. |
| Tests | `vault-session.test.ts`, `vault-search.test.ts`, `tests/e2e/*` | 5 E2E con login real y 2FA, setup determinista de BD, 1 worker para evitar carreras de estado. |
| Docs | `specs/cuentas-movil/*`, `MEMORY.md`, `CHANGELOG.md`, `README.md`, `docs/roadmap.md` | Spec aprobada, 15/15 tareas verificadas, auditoría y registro de la entrega. |

## Verificación

### Código y tests

| Comando | Resultado |
|---|---|
| `npm run lint` | OK (sin warnings) |
| `npm run typecheck` | OK |
| `npm run test` | OK — 425 tests en 34 ficheros |
| `npm run build` | OK — todas las rutas generadas |
| `npm run test:e2e` | OK — 5/5 con login real (Pixel 7 / Chromium) |
| CI del PR #47 | OK — `quality`, `build`, `test` y Vercel en verde (`44594528594`) |
| CI de `main` tras el merge | OK — `44602431620` en verde |

### UI / Chrome

- Navegador y viewport: Chromium (Chrome MCP), 390×844, sesión real contra BD
  local sembrada con bóveda de 2 cuentas y 2FA activo.
- Flujos comprobados: bloqueada → desbloqueo con password + 2FA → lista y
  búsqueda → Notas y vuelta sin reprompt → background y bloqueo con aviso.
- Consola: sin errores durante la sesión de capturas.
- Responsive: `scrollWidth - clientWidth = 0` a 390 px.
- Evidencia: 6 capturas referenciadas en
  [`auditoria.md`](auditoria.md). Tres hallazgos (2 P2 + 1 P3) corregidos y
  reverificados en `f2-06-workspace-final.png`.

### Producción

| Campo | Valor |
|---|---|
| URL | <https://casa-os-mauve.vercel.app> |
| Deployment | `A5tkvGvFNQw78z15QWjf7UL9XT7q` (estado `success` en GitHub status; la API de Vercel no se consultó por falta de token) |
| Commit | `6b27dca` (merge squash del PR #47) |
| Health | `200` — `{"status":"ok","db":"ok"}` verificado tras el merge |
| Rutas | `/auth/login` → `200` |
| Smoke autenticado | No ejecutado en producción: no hay credenciales válidas del propietario en este entorno. Se verificó con login real en local (BD sembrada). Lo confirma el propietario con sus credenciales. |

## Documentación actualizada

- [x] `MEMORY.md`: fase ✅, registro del PR #47, foco en Fase 3, notas E2E.
- [x] `CHANGELOG.md`: entrada de la Fase 2.
- [x] `README.md`: E2E con `globalSetup`/1 worker y requisitos de BD local.
- [x] `docs/roadmap.md`: Fase 2 ✅ y Fase 3 como siguiente.
- [x] `spec.md` y `plan.md`: decisiones aprobadas (passkey sin TOTP, 15 min,
      auto-intento, sin swipe actions).
- [x] `tasks.md`: 15/15 tareas de implementación y verificación completadas.
- [x] `AGENTS.md`: no aplica (no cambian las reglas del arnés).
- [x] `npm run docs:check -- cuentas-movil` pasa.

## Tareas

### Completadas

- Fase 0 — preparación (1).
- Fase 1 — sesión a nivel de app y auto-bloqueo (2–5).
- Fase 2 — desbloqueo biométrico-first (6–8).
- Fase 3 — búsqueda y lista móvil (9–10).
- Fase 4 — E2E, verificaciones, Chrome MCP y auditoría (11–15).
- Fase 5 — PR #47 mergeado, CI verde y cierre documental (16–17).

### Pendientes / follow-ups

- **Biometría en dispositivo real**: Face ID/huella y el auto-intento WebAuthn
  no se pudieron probar en Chromium de escritorio sin autenticador de plataforma
  con PRF. Se verifica en el terminal del propietario antes de dar la app por
  cerrada en móvil real. No se presenta como verificada.
- **Accesibilidad específica**: orden de lectura del aviso de bloqueo, foco tras
  desbloquear y contraste de `ash` a 13 px requieren prueba con teclado/lector.
- **Acceso «Más» fuera de Perfil** (follow-up de Fase 1): se revisa en la Fase 3
  al rediseñar Notas; no se añadió en esta entrega.
- **CI intermitente de `next/font/google`**: ya ocurrió en Fase 1; en esta fase
  no se repitió. Si vuelve a fallar, valorar fuentes autoalojadas con
  `next/font/local` en una feature separada.

## Decisiones y lecciones

- La sesión debe vivir en el layout raíz, no en la página: `VaultApp` se
  desmonta al cambiar de pestaña y con él se iban las claves (Fase 0).
- Quitar el TOTP de la passkey es una decisión de seguridad aprobada: WebAuthn
  con `userVerification: required` ya aporta posesión + verificación de usuario;
  la master password conserva 2FA.
- Auto-intento biométrico es best-effort: si el navegador exige gesto, el botón
  grande sigue siendo suficiente. Nunca se bloquea la vía password.
- Los E2E comparten BD y estado de 2FA: `workers: 1` y un `globalSetup` que
  deja el usuario sin 2FA evitan carreras entre ficheros.
- `next build` mientras corre `next dev` sobrescribe `.next` y causa 404;
  hay que detener el dev server antes de construir o borrar `.next`.

## Riesgos residuales

- Si el PIN del dispositivo es débil, la vía biométrica pierde parte de la
  defensa en profundidad que daba el TOTP (riesgo aceptado y mitigado con el
  auto-bloqueo a 15 min y los eventos de auditoría).
- En `/` (Dashboard) no hay pestaña activa, coherente con la decisión de
  cuatro pestañas de Fase 1.

## Checklist de cierre

- [x] El PR de la feature (#47) está mergeado (squash) y la rama borrada.
- [x] El CI de `main` está verde tras el merge (`44602431620`).
- [x] Producción desplegada y verificada; el smoke autenticado está documentado
      como no ejecutable en este entorno.
- [x] `tasks.md` no tiene casillas pendientes de implementación.
- [x] `cierre.md` no tiene casillas pendientes.
- [x] `MEMORY.md` enlaza este cierre y tiene el registro actualizado.
- [x] `CHANGELOG.md`, `README.md` y `docs/*` están al día.
- [x] `npm run docs:check -- cuentas-movil` pasa.
- [x] El PR de cierre tiene el CI verde (se verifica en el PR antes del merge).
