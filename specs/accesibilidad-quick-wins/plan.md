# Plan — Accesibilidad y copy (quick wins, Fase 0)

## Contexto

La auditoría total (`specs/auditoria-total/auditoria.md`, Fase 0) identificó
bloqueos de accesibilidad y problemas de copy que impiden el uso cómodo de la app
por parte de usuarios mayores (padres) en móvil (iOS + Android). Son cambios de
bajo riesgo y alto impacto que no tocan lógica ni base de datos.

## Objetivo

Eliminar el bloqueo de zoom, corregir gramática y naming, unificar wordmark y
vocabulario, mejorar contraste, añadir `role="status"` y reescribir copy técnico
en lenguaje llano, todo sin cambiar comportamiento funcional.

## Enfoque técnico

- Solo cambios en `src/app/layout.tsx`, componentes de UI y copy.
- Sin cambios en API, BD ni auth.
- Verificación: lint, typecheck, test, build + revisión visual en Chrome MCP
  (390×844) en iOS/Android, zoom 200 %, teclado virtual.

## Dependencias

Ninguna. Independiente del resto de fases.

## Riesgos

- Bajo: cambios de copy y viewport. Riesgo de regresión visual mínimo.
- El cambio de viewport (permitir zoom) puede afectar layouts que asumían
  `maximumScale: 1`; verificar en móvil.

## Archivos a modificar

- `src/app/layout.tsx`
- `src/components/notes/FolderChips.tsx`
- `src/components/devices/DeviceMobileView.tsx`
- `src/components/devices/ScanImportPanel.tsx` (copy)
- `src/components/cuentas/VaultApp.tsx`
- `src/components/cuentas/VaultWorkspace.tsx`
- `src/app/cuentas/page.tsx` (metadata)
- `src/components/calendar/ReminderPanel.tsx` (copy dev)
- `src/components/Sidebar.tsx` / `src/app/page.tsx` (wordmark)
- `src/components/notes/...` (contraste)