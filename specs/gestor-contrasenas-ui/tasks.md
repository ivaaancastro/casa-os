# Tasks — UI Gestor de contraseñas (cancelada)

**Feature:** `gestor-contrasenas-ui`
**Estado:** cancelada; sustituida por `feat/cuentas`
**Spec:** [`spec.md`](spec.md)
**Plan:** [`plan.md`](plan.md)

> El PR #33 solo añadió el enlace del sidebar y documentación. **Ninguna de las
> tareas de UI se implementó.** No se marcan como hechas: se conservan como
> registro de lo que se planeó y se canceló.

## Limpieza y corrección (completado)

- [x] Retirar el enlace `/contrasenas` de `src/components/Sidebar.tsx`.
- [x] Corregir `cierre.md` para no afirmar páginas, componentes, hooks ni tests
  inexistentes.
- [x] Corregir `tasks.md` y `plan.md`/`spec.md` con el estado real.
- [x] Marcar la feature como cancelada y registrar la sustitución por Cuentas
  zero-knowledge en `MEMORY.md`.
- [x] `npm run docs:check -- gestor-contrasenas-ui` pasa.

## Tareas de UI no ejecutadas (canceladas)

- Página `src/app/contrasenas/page.tsx`.
- `src/components/passwords/PasswordList.tsx`.
- `src/components/passwords/PasswordModal.tsx`.
- `src/components/passwords/PasswordActions.tsx`.
- `src/hooks/usePasswords.ts`.
- Export/import JSON y tests de UI.
- Verificación móvil 390 px de una UI que no existe.

## Follow-ups (sin checkbox)

- `feat/cuentas`: bóveda zero-knowledge con su propia spec, UI, API y
  verificación. No reutilizar esta estructura cancelada.
