# Roadmap de casa-os

> **Documento histórico.** El roadmap vivo, el foco actual, las decisiones y el
> registro de features están en [`MEMORY.md`](../MEMORY.md). No mantener dos
> roadmaps: este archivo solo resume los hitos y enlaza a la fuente única.

## Filosofía

- **Vertical slices**: cada feature se entrega completa (UI + API + tests) antes de pasar a la siguiente.
- **Familia primero**: se prioriza lo que más impacto tiene en el día a día.
- **Simplicidad**: si algo se resuelve con 10 líneas, no usar 100.
- **Uno a la vez**: una fase activa hasta que su cierre documental esté mergeado y el CI de `main` esté verde.

## Enfoque actual: móvil-first (PWA, iOS + Android)

App móvil para uso personal/familiar en casa, tres pilares: **notas, gestor de contraseñas y calendario**. FaceID/huella (WebAuthn) como entrada principal con contraseña master como fallback. Notificaciones push de recordatorios. PWA instalable desde "Añadir a pantalla de inicio" — no se publica en tiendas.

Detalle completo, orden y criterios de “hecho”: [`MEMORY.md`](../MEMORY.md) → *Roadmap*.

## Fases (en orden)

| Fase | Estado | Contenido |
|---|---|---|
| 0 — Cierre y limpieza | 🔲 | Cierre documental de `feat/cuentas`, limpiar ramas, `main` con CI verde |
| 1 — Fundación móvil | 🔲 | Tab bar inferior (Notas, Cuentas, Calendario, Perfil), menú móvil, diseño tokens (Índitex, Bodoni Moda + Jost), pantalla de instalación |
| 2 — Gestor de contraseñas (móvil) | 🔲 | `/cuentas` swipeable, WebAuthn FaceID/huella, contraseña master fallback, auto-bloqueo, compartir con familia |
| 3 — Notas (móvil) | 🔲 | Editor táctil, creación rápida, listado para una mano, carpetas, búsqueda, checklist |
| 4 — Calendario + push | 🔲 | Mes/semana táctiles, formulario de eventos, Web Push real, panel de avisos móvil |
| 5 — Dispositivos y red | 🔲 | `/devices` en móvil, escaneo e importación JSON |
| 6 — Cierre y documentación | 🔲 | `cierre.md` de cada fase, `MEMORY.md` y `docs/roadmap.md` actualizados, verificación móvil real |

## Hitos previos (ya entregados)

| Hito | Estado | Contenido |
|---|---|---|
| 1 — Fundación | ✅ | Auth, layout, notas, usuarios/roles, PostgreSQL, Vercel y PWA |
| 2 — Dispositivos | ✅ | CRUD manual · escaneo de red · estado de equipos, última vez visto y frescura |
| 3 — Organización | ✅ | Calendario ✅ · recordatorios Web Push ✅ (verificados en producción) |
| 4 — Seguridad | ✅ | 2FA ✅ · gestor de contraseñas (prototipo descartado) · **Cuentas zero-knowledge ✅** |
| 5 — Automatización | 💡 | Domótica |

Detalle: [`MEMORY.md`](../MEMORY.md) → *Roadmap*. El calendario familiar y los recordatorios Web Push están terminados y verificados en producción. La entrega incluye panel **Avisos**, prueba, deduplicación y scheduler de GitHub Actions cada 5 minutos.

**2FA** está implementado y desplegado (TOTP, códigos de recuperación, reset por ADMIN y script de emergencia). El gestor de contraseñas quedó en un prototipo server-side sin UI y no cumple zero-knowledge: se descarta y se sustituye por **Cuentas** (`/cuentas`), que exige 2FA y cifra en el cliente con master password + passkey opcional. Cuentas requiere `plan.md` y `spec.md` aprobados antes de implementar. Cuentas está implementada en `feat/cuentas` (ver [`docs/cuentas.md`](cuentas.md)) y pendiente de verificación de producción y cierre documental.

## Backlog

Buscador global, papelera/exportación, roles granulares/auditoría y OAuth (Google/Apple) como método de login adicional. Ver [`MEMORY.md`](../MEMORY.md) → *Backlog*.

## Historial

La versión inicial detallada de este documento (con checkboxes por hito) está en el historial de Git, en el commit `6a2e394`. Se sustituyó por este índice para evitar que se desincronizara del estado real.
