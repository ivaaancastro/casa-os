# Tasks — Accesibilidad y copy (quick wins, Fase 0)

- [x] T1. `src/app/layout.tsx`: eliminar `maximumScale: 1` y `userScalable: false` del viewport (RF1).
- [x] T2. `src/components/cuentas/VaultApp.tsx` y `VaultWorkspace.tsx`: corregir "La contraseñas" → "Las contraseñas"/"Tu contraseña" (RF2).
- [x] T3. Unificar nombre "Contraseñas" en nav/workspace/metadata (RF3).
- [x] T4. `src/app/cuentas/page.tsx`: metadata description sin "zero-knowledge" (RF4).
- [x] T5. `src/app/devices/page.tsx`: copy de dispositivos en lenguaje llano (RF5).
- [x] T6. `src/components/calendar/ReminderPanel.tsx`: texto dev ya estaba gated por `!IS_PRODUCTION` (RF6) — sin cambio adicional.
- [x] T7. Vocabulario "Avisos"/"Recordatorios": ya consistente; sin cambio (RF7).
- [x] T8. Wordmark unificado en textos visibles: `casa·os` (RF8).
- [x] T9. `src/components/notes/FolderChips.tsx`: contraste contador ≥ 4.5:1 (RF9).
- [x] T10. `src/components/devices/DeviceMobileView.tsx`: `role="status"` (RF10).
- [x] T11. `MonthView.tsx` / `MonthViewMobile.tsx`: fechas fuera de mes legibles (RF11).
- [x] T12. Verificación: lint ✅, typecheck ✅, test 443/443 ✅, build ✅. Revisión visual móvil pendiente de Chrome MCP (se hará antes del PR).