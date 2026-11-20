# Cierre — Fase 5: Dispositivos y red en móvil

**Estado:** cerrada
**Fecha:** 2026-11-20
**Feature:** `dispositivos-movil`
**Rama:** `feat/dispositivos-movil` (borrada tras el merge)

## Resumen

Se entrega `/devices` como pantalla de gestión con una mano: lista de tarjetas
con un solo árbol montado por breakpoint, FAB portalado a `body`, formulario e
importación en hojas inferiores y botón para copiar el comando `nmap`. El
inventario ya era una lista mobile-first, así que no se rehízo: se completaron
los patrones móviles que faltaban y se le dio su primera cobertura E2E. Sin
cambios en BD, esquemas Zod, API, auth ni navegación global.

## Alcance entregado

- `DeviceLayout` como dueño del estado y `DeviceMobileView` /
  `DeviceDesktopView` elegidas por `useIsMobile()` (`< 1024px`).
- FAB con `createPortal` a `body` que abre una hoja con «Añadir dispositivo» e
  «Importar escaneo» (solo ADMIN).
- `BottomSheet` compartida por acciones, `DeviceForm` y `ScanImportPanel`: scrim,
  Escape, foco, safe-area y acciones pegajosas ≥ 44 px.
- «Copiar comando» con `navigator.clipboard` y fallback, con estado anunciado.
- FAMILY ve la lista y el aviso de solo lectura, sin FAB ni acciones.
- 8 E2E con login real (ADMIN y FAMILY) y auditoría visual con 5 capturas.

## Cambios principales

| Área | Archivos | Qué cambió |
|---|---|---|
| Vistas | `DeviceLayout.tsx`, `DeviceMobileView.tsx`, `DeviceDesktopView.tsx`, `types.ts`, `page.tsx` | Estado centralizado, una vista por breakpoint, `h1` en Jost |
| Hojas/FAB | `BottomSheet.tsx`, `DeviceActionSheet.tsx`, `DeviceForm.tsx`, `ScanImportPanel.tsx`, `globals.css` | Portal a `body`, safe-area, táctil ≥ 44 px y comando copiable |
| Tests | `tests/e2e/dispositivos-movil.spec.ts`, `tests/e2e/helpers/devices-setup.ts` | 8 E2E con fixtures deterministas de dispositivos y usuario FAMILY |
| Docs | `specs/dispositivos-movil/*`, `MEMORY.md`, `CHANGELOG.md`, `README.md`, `docs/roadmap.md` | Spec aprobada, tareas, auditoría y registro de la entrega |

Se eliminó `DeviceManager.tsx`: su marcado se repartió entre las dos vistas sin
cambiar la lógica de dominio.

## Verificación

### Código y tests

| Comando | Resultado |
|---|---|
| `npm run lint` | OK (sin warnings) |
| `npm run typecheck` | OK |
| `npm run test` | OK — 443 tests en 36 ficheros |
| `npm run build` | OK — todas las rutas generadas |
| `npm run test:e2e` | OK — 26/26 con login real (Pixel 7 / Chromium), 8 nuevos de Dispositivos |
| CI del PR #53 | OK — `quality`, `build`, `test` y Vercel en verde (`44738104296`) |
| CI de `main` tras el merge | OK — `44738344635` en verde (`quality`, `build`, `test`) |

### UI / Chrome

- Navegador y viewport: Chromium (Chrome MCP), 390×844, sesión real contra BD
  local sembrada; se capturaron vista ADMIN y vista FAMILY.
- Flujos comprobados: lista → FAB → alta → importación (preview) → FAMILY.
- Consola: sin errores ni avisos en las capturas.
- Responsive: sin desbordamiento horizontal a 390 px (E2E + capturas).
- Evidencia: 5 capturas referenciadas en [`auditoria.md`](auditoria.md).
  **Sin hallazgos P0/P1**; tres detalles de pulido quedan documentados.

### Producción

| Campo | Valor |
|---|---|
| URL | <https://casa-os-mauve.vercel.app> |
| Deployment | `WpKN4HPHUcCaXc8QBgMoxVgPRvm3` (estado `success` en GitHub status; la API de Vercel no se consultó por falta de token). Preview del PR: `GWeDESekqBxVsWDNwW3XKGonKzWv` |
| Commit | `1d3bde1` (merge squash del PR #53) |
| Health | `200` — `{"status":"ok","db":"ok","timestamp":"2026-11-20T12:46:19.936Z"}` verificado tras el merge |
| Rutas | `/auth/login` → `200`, `/` → `307` |
| Smoke autenticado | No ejecutado en producción: no hay credenciales válidas del propietario en este entorno. Se verificó con login real en local (BD sembrada, ADMIN y FAMILY). Lo confirma el propietario con sus credenciales. |

## Documentación actualizada

- [x] `MEMORY.md`: Fase 5 ✅, registro del PR #53, foco en Fase 6, notas técnicas y lecciones.
- [x] `CHANGELOG.md`: entrada de la Fase 5.
- [x] `README.md`: E2E de Dispositivos incluido en la descripción de `test:e2e`.
- [x] `docs/roadmap.md`: Fase 5 ✅ y Fase 6 como siguiente.
- [x] `spec.md` y `plan.md`: decisiones aprobadas y criterios verificados.
- [x] `tasks.md`: 15/15 tareas completadas, sin casillas pendientes.
- [x] `AGENTS.md`: no aplica (no cambian las reglas del arnés).
- [x] `npm run docs:check -- dispositivos-movil` pasa.

## Tareas

### Completadas

- Fase 0 — rama y documentos de spec (1).
- Fase 1 — vistas por breakpoint y estado centralizado (2-4).
- Fase 2 — FAB portalado y hoja de acciones (5).
- Fase 3 — formulario, importación y comando copiable (6-8).
- Fase 4 — accesibilidad y tipografía (9-10).
- Fase 5 — E2E, verificaciones y auditoría (11-13).
- Fase 6 — PR #53 mergeado, CI verde y cierre documental (14-15).

### Pendientes / follow-ups

- **Espaciado de la cabecera**: hay un hueco entre las reglas de la cabecera y
  la primera tarjeta (`01-lista.png`). El wrapper es compartido por otras
  secciones, se dejó para un pulido global.
- **Preview largo**: hasta 512 filas sin virtualizar; la fila importable puede
  quedar bajo el desplazamiento (`04-importacion.png`). El resumen se mantiene
  arriba a propósito.
- **Dispositivo real y accesibilidad**: no hay iOS/Android; repetir con teclado
  virtual, lector de pantalla, contraste de `ash` a 10-13 px y Face ID/huella
  de la Fase 2.
- **`nmap` real**: no instalado en el entorno; la importación se probó con un
  fixture JSON. La verificación histórica está en `specs/escaneo-red/cierre.md`.
- **Picker móvil**: no se probó en iOS/Android; el `.json` se subió desde el
  selector de Chromium.
- **CI intermitente de `next/font/google`**: no se repitió en esta fase; si
  vuelve, valorar `next/font/local` en una feature separada.

## Decisiones y lecciones

- Las seis decisiones se aprobaron con la opción A: listar con vistas
  separadas, FAB portalado, hojas inferiores, subida de archivo con comando
  copiable y sin reloj de frescura en cliente.
- El roadmap decía «lista, no tabla», pero la lista ya existía. Explorar antes
  de escribir la spec evitó rehacer una feature cerrada: el valor estuvo en
  vistas, hojas y cobertura E2E.
- Reutilizar una sola `BottomSheet` para tres paneles garantiza el mismo
  comportamiento de cierre, foco y zona segura.
- El FAB vuelve a portarse a `body` por el `transform` de `animate-fade-rise`:
  es la regresión más costosa si se olvida.

## Riesgos residuales

- La UI de importación sigue dependiendo de que el usuario consiga el JSON en
  el móvil; el texto y el botón de copia lo explican, pero no eliminan el paso.
- El estado del inventario sigue siendo tan reciente como el último escaneo
  aplicado (sin tiempo real), coherente con `specs/dispositivos-estado`.
- El smoke autenticado en producción sigue pendiente del propietario.

## Checklist de cierre

- [x] El PR de la feature (#53) está mergeado (squash) y la rama borrada.
- [x] El CI de `main` está verde tras el merge (`44738344635`).
- [x] Producción desplegada y verificada; el smoke autenticado está documentado
      como no ejecutable en este entorno.
- [x] `tasks.md` no tiene casillas pendientes.
- [x] `cierre.md` no tiene casillas pendientes.
- [x] `MEMORY.md` enlaza este cierre y tiene el registro actualizado.
- [x] `CHANGELOG.md`, `README.md` y `docs/*` están al día.
- [x] `npm run docs:check -- dispositivos-movil` pasa.
- [x] El PR de cierre tiene el CI verde (se verifica en el PR antes del merge).
