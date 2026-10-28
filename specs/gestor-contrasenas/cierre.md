# Cierre — Gestor de contraseñas familiar (prototipo)

**Estado:** cerrada como prototipo (no apta para uso real; sustituida por Cuentas zero-knowledge)
**Fecha:** 2026-10-28
**Feature:** `gestor-contrasenas`
**PR:** #32, squash merge `c5d2334`

> **Aviso:** este cierre sustituye al anterior, que afirmaba un despliegue en
> producción que nunca ocurrió. El backend es un prototipo **server-side**: el
> servidor puede descifrar las contraseñas y no cumple el modelo
> zero-knowledge aprobado para `cuentas`. No hay UI y no debe usarse para
> credenciales reales. La siguiente feature, `feat/cuentas`, lo sustituye.

## Resumen

Se añadió un prototipo de gestor de contraseñas con cifrado AES-256-GCM en el
campo `User.encryptedPasswords` y dos endpoints (`GET/POST /api/passwords`). El
alcance real quedó muy por debajo del spec original: no hay UI, no hay
import/export, no hay `PUT`/`DELETE`, no hay validación Zod y el cifrado usa
directamente `TOTP_ENCRYPTION_KEY`, sin contraseña maestra ni PBKDF2.

## Alcance entregado

- Campo aditivo `User.encryptedPasswords` (`TEXT`) y migración
  `20261028200000_add_encrypted_passwords_to_user`.
- Helpers `encryptPasswords` / `decryptPasswords` en `src/lib/crypto.ts`, con
  contexto `casa-os:passwords:v1` y la misma clave que 2FA.
- `GET /api/passwords`: descifra el mapa `{ título: contraseña }` y devuelve solo
  los valores.
- `POST /api/passwords`: crea una entrada por título; ignora `username`,
  `notes` y `category`; devuelve `409` si el título ya existe.
- Sin UI, sin componentes, sin hook, sin import/export y sin tests de API.

Fuera de alcance real: compartir entre miembros, autollenado, auditoría y
cualquier garantía zero-knowledge.

## Cambios principales

| Área | Archivos | Qué cambió |
|---|---|---|
| Datos | `prisma/schema.prisma`, `prisma/migrations/20261028200000_add_encrypted_passwords_to_user` | Campo `encryptedPasswords` |
| Crypto | `src/lib/crypto.ts`, `tests/crypto.test.ts` | Helpers de cifrado/descifrado con la clave TOTP |
| API | `src/app/api/passwords/route.ts` | `GET` y `POST` básicos, sin Zod ni `no-store` |
| UI | — | No se implementó |
| Docs | `specs/gestor-contrasenas/*`, `docs/gestor-contrasenas.md` | Documentación corregida el 2026-10-28 |

## Verificación

### Código y tests

| Comando | Resultado |
|---|---|
| `npm run lint` | OK |
| `npm run typecheck` | OK |
| `npm run test` | 356 tests en verde (los tests de crypto cubren ida/vuelta y payload manipulado) |
| `npm run build` | OK |
| CI del PR #32 | Verde |

No hay tests de la API ni de la UI porque la UI no existe y la API es un
prototipo sin contrato cerrado.

### UI / Chrome

- No aplica: no hay página `/contrasenas`, ni componentes `PasswordList`,
  `PasswordModal`, `PasswordActions` ni hook `usePasswords`.
- El enlace del sidebar que apuntaba a `/contrasenas` se retiró el 2026-10-28
  para no ofrecer una ruta que devolvía 404 tras el login.

### Producción

| Campo | Valor |
|---|---|
| URL | <https://casa-os-mauve.vercel.app> |
| Deployment del PR #32 | `casa-cqvqvnpm0-ivans-projects-884d2864.vercel.app` → **ERROR** |
| Causa | `P3009`: migración histórica `2026102820_add_password_entry` fallida en Neon |
| Último deployment *Ready* | `dpl_HJXPZgEHzYZeXAQuk2R1CKqR6MfD` (commit `562c9b0`, sin el prototipo) |
| Health actual | `200` (sirve el deployment antiguo, no el prototipo) |

La reparación de la migración y el redeploy se hacen en la corrección
`fix/estado-real-produccion`. Aunque el prototipo llegue a desplegarse, no se
considera una funcionalidad terminada: no tiene UI y no cumple zero-knowledge.

## Documentación actualizada

- [x] `MEMORY.md`: prototipo marcado como no apto y sustituido por Cuentas.
- [x] `CHANGELOG.md`: entrada del prototipo y de la corrección.
- [x] `README.md`: sin promesa de gestor de contraseñas usable.
- [x] `docs/gestor-contrasenas.md`: reescrito con el alcance real.
- [x] `spec.md`, `plan.md` y `tasks.md`: corregidos (sin PBKDF2 ni UI ficticia).
- [x] `AGENTS.md`: no aplica.
- [x] `npm run docs:check -- gestor-contrasenas` pasa.

## Tareas

### Completadas

- Campo y migración aditiva.
- Helpers de cifrado/descifrado.
- Endpoints `GET`/`POST` básicos.
- Verificación local de lint, typecheck, tests y build.
- PR #32 mergeado.

### Pendientes / follow-ups

- **Sustitución completa por `feat/cuentas`** (zero-knowledge, master password,
  passkey opcional, visibilidad por cuenta). Motivo: el prototipo no cumple el
  modelo de seguridad acordado.
- Retirar la API y el campo `encryptedPasswords` cuando Cuentas esté cerrada.
  Motivo: evitar código muerto y superficie de ataque.
- Si se quiere conservar el prototipo en producción, documentarlo como
  "experimental" sin UI; no se recomienda.

## Decisiones y lecciones

- **Cifrado server-side ≠ zero-knowledge**: con la clave en el servidor, un
  administrador comprometido puede descifrar todas las contraseñas. No sirve
  para la bóveda familiar.
- **La misma clave para 2FA y contraseñas** mezcla dominios; el AAD separa los
  payloads, pero no la política de acceso ni la rotación.
- **El spec prometía más de lo entregado**: UI, import/export, `PUT`/`DELETE` y
  PBKDF2 nunca existieron. El cierre anterior lo daba por hecho.
- **Lección**: un `docs:check` verde no demuestra que la implementación exista;
  hay que contrastar los archivos citados con el repo.

## Riesgos residuales

- El campo `encryptedPasswords` sigue en el esquema y la migración se aplicará
  en el próximo deploy. Es aditivo y no se usa sin la API.
- La tabla `PasswordEntry` de la migración fallida pudo quedar creada a medias
  en Neon. No forma parte del esquema, no se referencia y **no se borra
  automáticamente**; limpiarla requiere copia de seguridad y confirmación.
- La API, si se despliega, puede almacenar contraseñas con cifrado reversible
  por el servidor. No usarla para credenciales reales.
- El código quedará obsoleto cuando Cuentas introduzca su propio modelo; hay que
  retirarlo entonces.

## Checklist de cierre

- [x] Código del prototipo en `main` (PR #32, `c5d2334`).
- [x] CI del PR #32 verde.
- [x] Documentación corregida para reflejar el alcance real.
- [x] Enlace roto `/contrasenas` retirado del sidebar.
- [x] `tasks.md` sin casillas pendientes.
- [x] `cierre.md` sin casillas pendientes.
- [x] `MEMORY.md` enlaza este cierre y registra el prototipo.
- [x] `npm run docs:check -- gestor-contrasenas` pasa.
- [x] Producción: no se marca como verificada; el deployment del PR #32 falló y
      el prototipo no es una funcionalidad usable.
