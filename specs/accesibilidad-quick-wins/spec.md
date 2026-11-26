# Spec — Accesibilidad y copy (quick wins, Fase 0)

## Requisitos funcionales

1. **RF1 — Zoom permitido:** el viewport debe permitir pinch-zoom (WCAG 1.4.4).
   Se elimina `maximumScale: 1` y `userScalable: false`; se mantiene
   `initialScale: 1`. (A1)
2. **RF2 — Gramática:** corregir "La contraseñas" → "Las contraseñas" o "Tu
   contraseña" en todos los textos de `VaultApp.tsx` y `VaultWorkspace.tsx`. (U7)
3. **RF3 — Naming unificado:** el producto se llama "Contraseñas" en nav, workspace
   heading y metadata. (U8)
4. **RF4 — Metadata:** descripción de `/cuentas` pasa a "Tus contraseñas guardadas
   de forma segura" (sin "zero-knowledge"). (U2)
5. **RF5 — Copy de dispositivos:** "Sin escaneos aplicados" → "Todavía no se ha
   revisado la red"; "Estado desactualizado, sube un escaneo nuevo" → "Hace
   tiempo que no se revisa la red". (U4)
6. **RF6 — Copy dev oculto:** el texto sobre service worker en desarrollo solo se
   muestra en dev (`process.env.NODE_ENV !== 'production'`); en prod, mensaje
   neutro o nada. (U5)
7. **RF7 — Vocabulario:** unificar "Avisos"/"Recordatorios" (elegir "Avisos" para
   el panel, "recordatorio" para el campo). (U9)
8. **RF8 — Wordmark único:** mostrar "casa·os" una sola vez por pantalla
   (sidebar en escritorio o login; en contenido, título de sección). Unificar
   `casa·os` vs `casa-os`. (V5)
9. **RF9 — Contraste:** contador de carpetas en `FolderChips` con contraste ≥ 4.5:1
   sobre accent. (A2)
10. **RF10 — Status role:** línea informativa en `DeviceMobileView` con
    `role="status"`. (A7)
11. **RF11 — Fechas fuera de mes:** mejorar contraste (`text-ash/70` → `text-ash`). (A3)

## Requisitos no funcionales

- Sin cambios en API, BD, auth ni lógica de negocio.
- Lint, typecheck, tests y build deben pasar.
- Revisión visual en Chrome MCP (390×844) iOS/Android + zoom 200 %.

## Criterios de aceptación

- [ ] Pinch-zoom funciona en móvil (iOS Safari + Chrome Android).
- [ ] No aparece "La contraseñas" en ningún texto.
- [ ] Nombre consistente "Contraseñas" en nav/workspace/metadata.
- [ ] Metadata de cuentas sin jerga "zero-knowledge".
- [ ] Copy de dispositivos en lenguaje llano.
- [ ] Texto dev no visible en build de producción.
- [ ] Wordmark una sola vez por pantalla.
- [ ] Contraste del contador de carpetas ≥ 4.5:1.
- [ ] `role="status"` presente.
- [ ] Fechas fuera de mes legibles.
- [ ] lint/typecheck/test/build en verde.

## Fuera de alcance

- Reescritura completa de copy técnico (npm/Vercel/PRF) → Fase 3.
- Cambios de diseño visual profundos → Fase 4.
- Cualquier cambio de lógica o BD.