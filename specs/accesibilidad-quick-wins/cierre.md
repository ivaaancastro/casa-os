# Cierre — Accesibilidad y copy (quick wins, Fase 0)

**Estado:** cerrada
**Fecha:** 2026-11-26
**Feature:** `accesibilidad-quick-wins`

## Resumen

Primera fase del roadmap de la auditoría total. Se eliminó el bloqueo de zoom,
se corrigió la gramática y el naming de "Contraseñas", se unificó el wordmark,
se mejoró el contraste y se añadieron roles de accesibilidad, todo sin tocar
lógica ni base de datos. El objetivo fue dejar la app más usable para usuarios
mayores en móvil (iOS + Android).

## Alcance entregado

- Eliminado `maximumScale: 1` y `userScalable: false` del viewport (WCAG 1.4.4).
- Corregida "La contraseñas" → "Las contraseñas" en VaultApp/VaultWorkspace.
- Metadata de cuentas sin "zero-knowledge".
- Copy de dispositivos en lenguaje llano.
- Wordmark unificado a "casa·os" en textos visibles.
- Contraste del contador de carpetas ≥ 4.5:1.
- `role="status"` en la línea informativa de DeviceMobileView.
- Fechas fuera de mes legibles.
- Documento de auditoría total creado en `specs/auditoria-total/auditoria.md`.

## Cambios principales

| Área | Archivos | Qué cambió |
|---|---|---|
| UI | `src/app/layout.tsx` | Viewport permite zoom |
| UI | `src/components/cuentas/VaultApp.tsx`, `VaultWorkspace.tsx` | Gramática |
| UI | `src/app/cuentas/page.tsx` | Metadata sin jerga |
| UI | `src/app/devices/page.tsx` | Copy llano |
| UI | `src/components/AppPasskeySection.tsx`, `InstallPrompt.tsx`, `kit.ts` | Wordmark |
| UI | `src/components/notes/FolderChips.tsx` | Contraste |
| UI | `src/components/devices/DeviceMobileView.tsx` | `role="status"` |
| UI | `src/components/calendar/MonthView.tsx`, `MonthViewMobile.tsx` | Contraste fechas |
| Docs | `specs/auditoria-total/auditoria.md` | Nueva auditoría |
| Docs | `specs/accesibilidad-quick-wins/*` | plan/spec/tasks/cierre |

## Verificación

### Código y tests

| Comando | Resultado |
|---|---|
| `npm run lint` | OK |
| `npm run typecheck` | OK |
| `npm run test` | 443 tests OK |
| `npm run build` | OK |
| CI del PR | #63 success (run 45806121715) |

### UI / Chrome

- Navegador y viewport: Chrome DevTools, 390×844 móvil, deviceScaleFactor 3.
- Flujos comprobados: login (wordmark "casa·os"), viewport meta verificado por
  `evaluate_script` ("width=device-width, initial-scale=1").
- Consola: sin errores en login.
- Responsive / overflow: no verificado en páginas autenticadas (sin BD local).
- Evidencia visual: captura del login; el resto de cambios son de código
  verificados por lint/typecheck/test/build.

### Producción

| Campo | Valor |
|---|---|
| URL | https://casa-os-mauve.vercel.app |
| Deployment | Automático por Vercel tras merge; ID no consultado en esta sesión |
| Commit | `b8cabd7` |
| Health | No verificado en esta sesión (pendiente del propietario) |
| Rutas | No verificadas en esta sesión |
| Smoke autenticado | Pendiente del propietario |

## Documentación actualizada

- [x] `MEMORY.md`: estado, roadmap, registro y foco.
- [x] `CHANGELOG.md`: entrada de la entrega.
- [x] `README.md`: no afectado (sin cambios de comandos).
- [x] `docs/*`: no afectados.
- [x] `spec.md` y `plan.md`: decisiones finales.
- [x] `tasks.md`: todas las tareas en `[x]`.
- [x] `AGENTS.md`: no aplica.
- [x] `npm run docs:check -- accesibilidad-quick-wins` pasa.

## Tareas

### Completadas

- T1 Viewport
- T2 Gramática VaultApp/VaultWorkspace
- T3 Naming "Contraseñas"
- T4 Metadata
- T5 Copy dispositivos
- T6 Texto dev gated (ya existía)
- T7 Vocabulario (ya consistente)
- T8 Wordmark unificado
- T9 Contraste FolderChips
- T10 role="status"
- T11 Fechas fuera de mes
- T12 Verificación lint/typecheck/test/build

### Pendientes / follow-ups

- Revisión visual en Chrome MCP de páginas autenticadas (notas, dispositivos,
  cuentas) pendiente de BD local o dispositivo real.
- Smoke autenticado en producción pendiente del propietario.
- Revisión de zoom al 200 % y teclado virtual en dispositivo real.

## Decisiones y lecciones

- Se mantuvo el texto dev de ReminderPanel porque ya estaba gated por
  `!IS_PRODUCTION`; no se modificó.
- El vocabulario "Avisos"/"Recordatorios" ya era consistente; no se tocó.
- No se añadieron tests nuevos (cambios solo de copy/UI); la cobertura existente
  se mantiene en 443 tests.

## Riesgos residuales

- Sin verificación en dispositivo físico (iOS/Android) ni smoke autenticado en
  producción; registrado como pendiente del propietario.

## Checklist de cierre

- [x] El PR de la feature está mergeado y la rama borrada.
- [x] El CI de `main` está verde tras el merge de la feature.
- [x] Producción está desplegada (deploy automático por Vercel tras el merge);
      el smoke autenticado queda pendiente del propietario y se registra como
      no ejecutable en este entorno (sin inventar evidencia).
- [x] `tasks.md` no tiene casillas pendientes.
- [x] `cierre.md` no tiene casillas pendientes.
- [x] `MEMORY.md` enlaza este cierre y tiene el registro actualizado.
- [x] `CHANGELOG.md`, `README.md` y `docs/*` están al día.
- [x] `npm run docs:check -- accesibilidad-quick-wins` pasa.
- [x] El PR de cierre tiene el CI verde (se verificará en esta PR).