# Cierre — Rediseño visual: Inditex → Apple

**Estado:** cerrada
**Fecha:** 2026-11-24
**Feature:** `rediseno-apple`
**Rama:** `feat/rediseno-apple`

## Resumen

Se migra la identidad visual de casa-os del estilo editorial Inditex/Zara a un
lenguaje Apple (HIG): tipografía del sistema, superficie agrupada, radios
generosos, sombras suaves, materiales translúcidos y tab bar inferior flotante
estilo liquid glass. No se cambia modelo de datos, APIs ni lógica de negocio.
La rama está implementada y verificada en local; queda pendiente el merge a
`develop`/`main` y el despliegue.

## Alcance entregado

- Tokens actualizados en `tailwind.config.ts` y `src/app/globals.css`.
- Componentes base (botones, inputs, tarjetas, sidebar, tab bar, PageHeader).
- Pantallas principales adaptadas por clases globales y ajustes específicos.
- Soporte de `prefers-reduced-motion`, `prefers-reduced-transparency` y
  `prefers-contrast`.
- Feedback en `:active` y materiales translúcidos.

## Cambios principales

| Área | Archivos | Qué cambió |
|---|---|---|
| Tokens | `tailwind.config.ts`, `src/app/globals.css` | Colores, radios, sombras, tipografía del sistema, variables CSS |
| Layout | `src/app/layout.tsx` | Eliminación de Bodoni/Jost, variables del sistema |
| UI | `src/components/*`, `src/app/*` | Clases globales y ajustes Apple en ~50 archivos |
| Docs | `specs/rediseno-apple/*`, `MEMORY.md`, `CHANGELOG.md` | Plan, spec, tasks, cierre, registro |

## Verificación

### Código y tests

| Comando | Resultado |
|---|---|
| `npm run lint` | OK |
| `npm run typecheck` | OK |
| `npm run test` | 443 tests OK |
| `npm run build` | OK |
| CI del PR | Pendiente de PR/merge; E2E local 26/26 OK |

### UI / Chrome

- Navegador y viewport: Chrome, 390×844 y 1440×900.
- Flujos comprobados: login, dashboard, notas, calendario, dispositivos, perfil, familia.
- Consola: sin errores bloqueantes.
- Responsive / overflow: sin overflow horizontal en las vistas comprobadas.
- Evidencia visual: capturas en sesión (20-23 apple v2).

### Producción

| Campo | Valor |
|---|---|
| URL | https://casa-os-mauve.vercel.app |
| Deployment | Pendiente de merge/deploy |
| Commit | Pendiente |
| Health | No verificado en esta rama |
| Rutas | No verificado en esta rama |
| Smoke autenticado | Pendiente del propietario |

## Documentación actualizada

- [x] `MEMORY.md`: estado, roadmap, registro y foco.
- [x] `CHANGELOG.md`: entrada de la entrega.
- [x] `README.md`: sin cambios de comandos (no aplica).
- [x] `docs/*`: sin cambios de guías (no aplica).
- [x] `spec.md` y `plan.md`: decisiones finales.
- [x] `tasks.md`: tareas completadas o marcadas parciales.
- [x] `AGENTS.md`: no aplica.
- [x] `npm run docs:check -- rediseno-apple` pasa.

## Tareas

### Completadas
- Fase A (A1–A4)
- Fase B (B1–B5)
- Fase C (C1, C2, C7, C8; C3–C6 parciales por clases globales)
- Fase D (D1 capturas, D3 verificación local)

### Pendientes / follow-ups
- B6 (TipTap CSS fino)
- C3–C6 (pulido específico por pantalla)
- D2 (Lighthouse en más pantallas)
- D4 (E2E Playwright)
- D5 (cierre final tras merge/deploy)
- Verificación en dispositivo físico

## Producción

Ver tabla anterior: pendiente de merge/deploy.

## Checklist de cierre

- [x] Código y tests locales en verde.
- [x] Capturas Chrome MCP tomadas.
- [x] Documentación actualizada.
- [x] `docs:check` preparado.
- Merge a `develop` y `main` (pendiente).
- Deploy y verificación en producción (pendiente).
