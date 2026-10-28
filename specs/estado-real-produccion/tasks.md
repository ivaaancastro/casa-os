# Tasks — Corrección del estado real y desbloqueo de producción

- [x] **1. Reproducir el fallo de producción**: deployments en `ERROR` desde
  `b559622`; `P3009` por `2026102820_add_password_entry`.
- [x] **2. Confirmar el último deployment *Ready***: `dpl_HJXPZgEHzYZeXAQuk2R1CKqR6MfD`
  (`562c9b0`), alias de producción.
- [x] **3. Probar la reparación en una base temporal**: migración fallida
  simulada + `prisma migrate resolve --rolled-back`.
- [x] **4. Crear `scripts/repair-known-migrations.mjs`** idempotente y limitado
  a la migración histórica conocida.
- [x] **5. Ejecutar el script en `vercel-build`** antes de `prisma migrate deploy`.
- [x] **6. Retirar el enlace `/contrasenas`** de `src/components/Sidebar.tsx`.
- [x] **7. Alinear el dashboard** con el roadmap (Familia, Cuentas; sin
  Inventario/Gastos) y corregir los primeros pasos.
- [x] **8. Reescribir `specs/2fa/{tasks,cierre}.md`** con la verificación real y
  la limitación del smoke de producción.
- [x] **9. Crear `docs/2fa.md`** y actualizar `spec.md`/`plan.md`.
- [x] **10. Reescribir el cierre del prototipo de contraseñas** como no apto,
  sin UI y no zero-knowledge.
- [x] **11. Marcar `gestor-contrasenas-ui` como cancelada** y corregir su spec,
  plan y tasks.
- [x] **12. Actualizar `docs/gestor-contrasenas.md`** al alcance real.
- [x] **13. Permitir `Estado: cancelada`** en `scripts/check-docs.mjs`, la guía
  de cierre y la plantilla.
- [x] **14. Actualizar `MEMORY.md`, `CHANGELOG.md`, `README.md`,
  `docs/roadmap.md`, `docs/architecture.md` y `docs/despliegue-vercel.md`.
- [x] **15. Eliminar `pnpm-lock.yaml`, `pnpm-workspace.yaml` y `.close-2fa.txt`**.
- [x] **16. Verificación local**: lint, typecheck, 356 tests, build y
  `docs:check` de las tres features.
- [x] **17. Verificación UI**: build de producción en Chromium; sidebar sin
  «Contraseñas», dashboard con Familia/Cuentas.
- [x] **18. PR #34**, CI verde, squash merge `0e8803e` y rama borrada.
- [x] **19. CI de `main` verde** (run `40665897804`).
- [x] **20. Verificar producción**: deployment `dpl_6mQZz8KvrbyZVrQqq3xh8zoZkzjg`
  *Ready*, health `200`, `/api/2fa/status` `401`, login `200` y sidebar sin
  «Contraseñas».
- [x] **21. Registrar el cierre** y dejar `MEMORY.md`/`CHANGELOG.md` al día.
