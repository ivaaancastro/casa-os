# Roadmap de casa-os

> **Documento histórico.** El roadmap vivo, el foco actual, las decisiones y el
> registro de features están en [`MEMORY.md`](../MEMORY.md). No mantener dos
> roadmaps: este archivo solo resume los hitos y enlaza a la fuente única.

## Filosofía

- **Vertical slices**: cada feature se entrega completa (UI + API + tests) antes
  de pasar a la siguiente.
- **Familia primero**: se prioriza lo que más impacto tiene en el día a día.
- **Simplicidad**: si algo se resuelve con 10 líneas, no usar 100.

## Hitos

| Hito | Estado | Contenido |
|---|---|---|
| 1 — Fundación | ✅ | Auth, layout, notas, usuarios/roles, PostgreSQL, Vercel y PWA |
| 2 — Dispositivos | ✅ | CRUD manual · escaneo de red · estado de equipos, última vez visto y frescura |
| 3 — Organización | ✅ | Calendario ✅ · recordatorios Web Push ✅ (verificados en producción) |
| 4 — Seguridad | ✅ | 2FA ✅ · gestor de contraseñas (prototipo descartado) · **Cuentas zero-knowledge ✅** |
| 5 — Automatización | 💡 | Domótica |

Detalle, orden y criterios de “hecho”: [`MEMORY.md`](../MEMORY.md) → *Roadmap*.
El calendario familiar y los recordatorios Web Push están terminados y
verificados en producción. La entrega incluye panel **Avisos**, prueba,
deduplicación y scheduler de GitHub Actions cada 5 minutos; el aviso real se
comprobó con una suscripción FCM y dos ejecuciones del workflow.

**2FA** está implementado y desplegado (TOTP, códigos de recuperación, reset
por ADMIN y script de emergencia). El **gestor de contraseñas** quedó en un
prototipo server-side sin UI y no cumple zero-knowledge: se descarta y se
sustituye por **Cuentas** (`/cuentas`), que exige 2FA y cifra en el cliente con
master password + passkey opcional. Cuentas requiere `plan.md` y `spec.md`
aprobados antes de implementar. Cuentas está implementada en `feat/cuentas`
(ver [`docs/cuentas.md`](cuentas.md)) y pendiente de verificación de
producción y cierre documental.

## Backlog

Buscador global, papelera/exportación, roles granulares/auditoría y app nativa
si la PWA se queda corta. Ver [`MEMORY.md`](../MEMORY.md) → *Backlog*.

## Historial

La versión inicial detallada de este documento (con checkboxes por hito) está
en el historial de Git, en el commit `6a2e394`. Se sustituyó por este índice
para evitar que se desincronizara del estado real.
