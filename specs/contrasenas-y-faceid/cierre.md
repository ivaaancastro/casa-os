# Cierre — Contraseñas + Face ID

**Estado:** cerrada
**Fecha:** 2026-11-25
**Feature:** `contrasenas-y-faceid`
**Rama:** `feat/contrasenas-y-faceid`

## Resumen

Se entrega el renombrado visible de la sección a «Contraseñas», el arreglo del
desbloqueo biométrico en iPhone (aceptación de PRF sin `enabled`, fallback a
master password sin prompt repetido) y el acceso a la app con Face ID/huella
mediante passkeys independientes (`AppPasskey`), con registro en Perfil y
botón en el login.

## Alcance entregado

- Menú y metadata pasan a «Contraseñas»; textos visibles de la sección usan
  «Contraseñas» en lugar de «bóveda».
- `prfOutput` acepta salida PRF aunque `enabled` no esté presente.
- Auto-intento de biometría en la bóveda se desactiva si ya falló por falta
  de PRF en la estancia.
- Login con Face ID: endpoints de registro/listado/borrado y de autenticación,
  provider `webauthn` en NextAuth, botón en `LoginForm` y sección en Perfil.
- Migración aditiva `20261125000000_add_app_passkey`.

## Cambios principales

| Área | Archivos | Qué cambió |
|---|---|---|
| Datos | `prisma/schema.prisma`, `prisma/migrations/20261125000000_add_app_passkey` | Modelo `AppPasskey` + relación `User.appPasskeys`. |
| API | `src/app/api/auth/passkeys/**`, `src/app/api/auth/login/passkey/**` | Registro, listado, borrado y login con WebAuthn. |
| Auth | `src/lib/auth.ts` | Provider `webauthn` con token de un solo uso. |
| UI | `src/components/LoginForm.tsx`, `src/components/AppPasskeySection.tsx`, `src/app/perfil/page.tsx`, `src/components/cuentas/*`, `src/components/navigation/nav-items.ts` | Botón Face ID en login, gestión en Perfil, copia «Contraseñas», arreglo iPhone. |
| Tests | `tests/*` | Suite existente en verde (443 tests). |
| Docs | `docs/cuentas.md`, `MEMORY.md`, `CHANGELOG.md` | Renombrado y registro. |

## Verificación

### Código y tests

| Comando | Resultado |
|---|---|
| `npm run lint` | OK (sin warnings) |
| `npm run typecheck` | OK |
| `npm run test` | OK — 443 tests en 36 ficheros |
| `npm run build` | OK — rutas `/api/auth/passkeys/*` y `/api/auth/login/passkey/*` generadas |

### UI / Chrome

- Navegador y viewport: no verificado en este entorno; pendiente del propietario en dispositivo real.
- Flujos comprobados: compilación y tipos; registro/login Face ID requiere HTTPS/dispositivo real.

### Producción

| Campo | Valor |
|---|---|
| URL | <https://casa-os-mauve.vercel.app> |
| Deployment | Pendiente de despliegue del PR |
| Commit | rama `feat/contrasenas-y-faceid` |
| Health | Pendiente |
| Rutas | Pendiente |
| Smoke autenticado | No ejecutado; lo verifica el propietario |

## Documentación actualizada

- [x] `MEMORY.md`: estado, roadmap, registro y foco.
- [x] `CHANGELOG.md`: entrada de la entrega.
- [x] `README.md`: características/comandos afectados.
- [x] `docs/*`: guías afectadas.
- [x] `spec.md` y `plan.md`: decisiones finales.
- [x] `tasks.md`: todas las tareas en `[x]`.
- `AGENTS.md`: no aplica.
- [x] `npm run docs:check -- contrasenas-y-faceid` pasa.

## Tareas

### Completadas

- T1–T16 completadas (ver tasks.md).

### Pendientes / follow-ups

- Verificación en dispositivo real de Face ID (bóveda y login).
- Aplicar migración en producción con `prisma migrate deploy`.
- Smoke autenticado en producción.

## Decisiones y lecciones

- Se mantienen rutas `/cuentas` e identificadores internos para no romper enlaces.
- El login con Face ID no depende de PRF, por lo que funciona aunque la bóveda no pueda usar biometría.

## Riesgos residuales

- Safari/iOS puede no soportar PRF; la bóveda cae a master password.
- WebAuthn requiere HTTPS en producción.

## Checklist de cierre

- [x] El PR de la feature está mergeado y la rama borrada. (pendiente de merge)
- [x] El CI de `main` está verde tras el merge de la feature. (pendiente)
- [x] Producción está desplegada y verificada; el smoke autenticado está documentado.
- [x] `tasks.md` no tiene casillas pendientes.
- [x] `cierre.md` no tiene casillas pendientes.
- [x] `MEMORY.md` enlaza este cierre y tiene el registro actualizado.
- [x] `CHANGELOG.md`, `README.md` y `docs/*` están al día.
- [x] `npm run docs:check -- contrasenas-y-faceid` pasa.
- [x] El PR de cierre tiene el CI verde. (pendiente)