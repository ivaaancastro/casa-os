# Cierre — UI Gestor de contraseñas (cancelada)

**Estado:** cancelada (sustituida por Cuentas zero-knowledge)
**Fecha:** 2026-10-28
**Feature:** `gestor-contrasenas-ui`
**PR:** #33, squash merge `989ff54`

> **Aviso:** el cierre anterior afirmaba que existían una página
> `/contrasenas`, tres componentes, un hook y tests. **No existen en el repo.**
> El PR #33 solo añadió el enlace «Contraseñas» al sidebar y documentación que
> describía una UI ficticia. Esta feature se cancela y no se marca como
> implementada.

## Resumen

La UI del gestor de contraseñas nunca se implementó. Se descartó el diseño
server-side y se decidió construir **Cuentas** con cifrado zero-knowledge. El
enlace roto `/contrasenas` se retiró del sidebar el 2026-10-28 para no ofrecer
una ruta que devolvía 404 tras el login.

## Alcance real

- Se añadió `{ href: '/contrasenas', label: 'Contraseñas' }` a
  `src/components/Sidebar.tsx` (PR #33).
- Se añadieron `specs/gestor-contrasenas-ui/*` y `docs/gestor-contrasenas.md`.
- No se creó ninguna página, componente, hook, test de UI ni funcionalidad de
  import/export.
- El enlace se eliminó en la corrección `fix/estado-real-produccion`.

## Cambios principales

| Área | Archivos | Qué pasó |
|---|---|---|
| Sidebar | `src/components/Sidebar.tsx` | Se añadió y luego se retiró el enlace `/contrasenas` |
| UI | `src/app/contrasenas/page.tsx`, `src/components/passwords/*`, `src/hooks/usePasswords.ts` | **No existen** |
| Docs | `specs/gestor-contrasenas-ui/*`, `docs/gestor-contrasenas.md` | Se corrigieron para reflejar la cancelación |

## Verificación

### Código y tests

| Comando | Resultado |
|---|---|
| `npm run lint` | OK (el PR #33 no añadió UI que verificar) |
| `npm run typecheck` | OK |
| `npm run test` | 356 tests; ninguno cubre una UI inexistente |
| `npm run build` | OK; el build no genera ninguna ruta `/contrasenas` |
| CI del PR #33 | Verde (solo sidebar + docs) |

### UI / Chrome

- No aplica: no hay UI que verificar.
- El enlace `/contrasenas` llevaba a una ruta inexistente; se retiró.
- La sección **Cuentas** futura tendrá su propia spec, UI y verificación.

### Producción

| Campo | Valor |
|---|---|
| URL | <https://casa-os-mauve.vercel.app> |
| Deployment del PR #33 | `casa-i7t17gsbj-ivans-projects-884d2864.vercel.app` → **ERROR** (P3009) |
| Último deployment *Ready* | `dpl_HJXPZgEHzYZeXAQuk2R1CKqR6MfD` (commit `562c9b0`, sin esta UI) |
| Rutas | `/contrasenas` no existe en el build actual; el middleware redirige al login y después daría 404 |

El PR #33 nunca llegó a producción. No hay nada que verificar como funcionalidad
de usuario.

## Documentación actualizada

- [x] `MEMORY.md`: feature marcada como cancelada/sustituida.
- [x] `CHANGELOG.md`: entrada de corrección, sin afirmar UI implementada.
- [x] `README.md`: sin mención a una sección de contraseñas usable.
- [x] `docs/gestor-contrasenas.md`: reescrito como prototipo sin UI.
- [x] `spec.md`, `plan.md`, `tasks.md` y `cierre.md`: corregidos.
- [x] `AGENTS.md`: no aplica.
- [x] `npm run docs:check -- gestor-contrasenas-ui` pasa con estado cancelada.

## Tareas

### Completadas

- Documentar la cancelación y retirar el enlace roto del sidebar.
- Corregir las afirmaciones falsas de este cierre y de `tasks.md`.
- Registrar la sustitución por Cuentas zero-knowledge.

### No ejecutadas (canceladas)

- Página `/contrasenas`.
- `PasswordList`, `PasswordModal` y `PasswordActions`.
- Hook `usePasswords`.
- Import/export y tests de UI.

### Pendientes / follow-ups

- `feat/cuentas`: nueva sección zero-knowledge con su propia spec y UI.
- No reutilizar los nombres ni la estructura de esta feature cancelada.

## Decisiones y lecciones

- **No se puede cerrar una UI que no existe**: el PR #33 solo añadió un enlace y
  documentación. `docs:check` pasó porque valida estructura, no implementación.
- **Un enlace sin página es peor que no tener enlace**: el sidebar ofrecía
  `/contrasenas` y el build no generaba esa ruta.
- **Lección**: contrastar cada archivo citado en `cierre.md` con `git ls-files`
  antes de dar una feature por terminada.

## Riesgos residuales

- Ninguno de código: el enlace se retiró y no hay UI.
- La documentación antigua podía inducir a un agente a "continuar" una UI
  inexistente; queda corregida y marcada como cancelada.

## Checklist de cierre

- [x] Enlace `/contrasenas` retirado del sidebar.
- [x] Cierre anterior corregido; no se afirma UI implementada.
- [x] `tasks.md` sin casillas pendientes (tareas no ejecutadas documentadas).
- [x] `cierre.md` sin casillas pendientes.
- [x] `MEMORY.md` enlaza este cierre y marca la feature como cancelada.
- [x] `npm run docs:check -- gestor-contrasenas-ui` pasa.
- [x] Producción: no aplica; el PR #33 nunca se desplegó y no hay funcionalidad.
