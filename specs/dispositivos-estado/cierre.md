# Cierre — Estado de dispositivos (online/ausente)

**Estado:** cerrada
**Fecha:** 2026-10-22
**Feature:** `dispositivos-estado`

## Resumen

La importación de un escaneo ahora actualiza el estado del inventario, no solo
crea equipos nuevos. Los equipos vistos pasan a **En línea**, los que ya se
habían visto y ya no aparecen en la red escaneada pasan a **Ausente**, y la
lista muestra la última vez visto y la frescura del dato. Se apoya en los campos
`online`/`lastSeen` existentes: no hay migración ni historial.

## Alcance entregado

- Estado aplicado al importar un escaneo (`dryRun: false`): altas de equipos
  nuevos, reconexiones, ausencias y última vez visto.
- Previsualización con proyección de altas/bajas y aviso de escaneo antiguo
  antes de escribir nada.
- Reglas conservadoras: ausencias solo dentro de un CIDR válido, solo para
  equipos ya vistos y protegidas frente a filas ambiguas.
- Guardia contra escaneos anteriores al `lastSeen` de cada equipo.
- Resumen tras aplicar y frescura global en la cabecera con aviso a partir de
  24 h.
- Fuera de alcance: notificaciones push/email, historial de disponibilidad y
  resolución automática de conflictos IP/MAC. Continúan en
  `feat/recordatorios` y backlog.

## Cambios principales

| Área | Archivos | Qué cambió |
|---|---|---|
| Datos | Sin cambios en `prisma/schema.prisma` | Se reutilizan `online` y `lastSeen`; no hay migración |
| API | `src/app/api/devices/import/route.ts`, `src/lib/schemas/scan.ts` | Planificación de estado, `importIps`, validación de CIDR/fecha, transacción y respuesta con `changes` |
| Lógica | `src/lib/utils/deviceStatus.ts`, `src/lib/utils/device.ts` | CIDR, planificador de vistos/ausentes/stale y formato de presencia |
| UI | `src/components/devices/ScanImportPanel.tsx`, `DeviceManager.tsx`, `src/app/devices/page.tsx` | Envío de todas las filas, proyección, resultado, estado por equipo y frescura en cabecera |
| Tests | `tests/device-status.test.ts`, `tests/device.test.ts`, `tests/api/scan.schemas.test.ts` | 24 tests nuevos de CIDR/planificador/formato y validaciones del esquema |
| Docs | `README.md`, `docs/escaneo-red.md`, `CHANGELOG.md`, `MEMORY.md`, `docs/roadmap.md` | Comportamiento, limitaciones, comandos y estado del roadmap |

## Verificación

### Código y tests

| Comando | Resultado |
|---|---|
| `npm run lint` | OK, sin avisos |
| `npm run typecheck` | OK |
| `npm run test` | 253 tests OK (24 nuevos) |
| `npm run build` | OK; `/devices` y `/api/devices/import` compilan |
| CI del PR | [PR #22](https://github.com/ivaaancastro/casa-os/pull/22): quality, test, build y Vercel en verde |

### UI / Chrome

- Navegador y viewport: Chrome DevTools MCP; escritorio y 390 px (producción).
- Flujos comprobados en local: previsualización con equipos nuevos y
  existentes; aplicación con altas y reconexiones; transición a ausente;
  escaneo antiguo ignorado; cabecera con última actualización; usuario FAMILY
  sin controles y API con `403`.
- Flujos comprobados en producción: lista con `En línea · visto hace 3 días` y
  aviso `Estado desactualizado`; previsualización de un fixture con el router
  existente y un equipo nuevo, proyección `Estado tras aplicar` (0 altas,
  0 bajas) y fila nueva marcada. Se descartó sin escribir.
- Consola: limpia, salvo el aviso preexistente de `metadata` de Next.js.
- Responsive / overflow: `scrollWidth = innerWidth = 390`; panel y lista
  legibles en una columna.
- Evidencia visual: capturas locales y de producción de la previsualización, el
  resultado y la lista; no incluyen datos sensibles.

### Producción

| Campo | Valor |
|---|---|
| URL | https://casa-os-mauve.vercel.app |
| Deployment | Producción automática de Vercel (Git integration); alias actualizado tras el merge |
| Commit | `34fee9f` |
| Health | `200` (`{"status":"ok","db":"ok"}`) |
| Rutas | `/auth/login` 200 · `/manifest.webmanifest` 200 · `/api/health` 200 · `/devices` 307 sin sesión (esperado) |
| Smoke autenticado | Sesión ADMIN en producción: lista con estado y frescura, previsualización de fixture y descarte sin escritura; verificado el 2026-10-22 |

## Documentación actualizada

- [x] `MEMORY.md`: estado, roadmap, registro y foco.
- [x] `CHANGELOG.md`: entrada de la entrega.
- [x] `README.md`: características afectadas.
- [x] `docs/*`: `escaneo-red.md` y `roadmap.md`.
- [x] `spec.md` y `plan.md`: decisiones finales.
- [x] `tasks.md`: todas las tareas completadas.
- [x] `AGENTS.md`: No aplica (no cambian las reglas del arnés).
- [x] `npm run docs:check -- dispositivos-estado` pasa.

## Tareas

### Completadas

- Utilidades de estado, tests del planificador y formato de presencia.
- Esquema del escaneo (`importIps`, CIDR, fecha no futura) y sus tests.
- Planificación y escritura transaccional en `POST /api/devices/import`.
- Panel de importación con proyección, resultado y refresco de la lista.
- Lista con última vez visto y cabecera con frescura y aviso de 24 h.
- Documentación de la feature y cierre completo.
- `lint`, `typecheck`, `test` y `build` en verde.
- Verificación de UI con Chrome MCP en escritorio y 390 px, local y producción.
- PR #22 con CI verde, squash merge (`34fee9f`) y rama borrada.
- CI de `main` verde (run `39818616853`).
- Deployment de producción y smoke autenticado.

### Pendientes / follow-ups

- Notificaciones push/email de altas y bajas — `feat/recordatorios`.
- Historial de disponibilidad y gráficas — backlog.
- Resolución automática de conflictos IP/MAC o IP por DHCP — fuera de alcance.

## Decisiones y lecciones

- **Estado solo al aplicar el escaneo**: en Vercel no hay cron ni `nmap`; el
  estado es tan reciente como el último escaneo aplicado y la UI lo dice.
- **Ausencias conservadoras**: sin CIDR válido, sin `lastSeen` o con filas en
  conflicto no se marca ausente. Un falso «ausente» es peor que un estado
  desactualizado.
- **Escaneo antiguo**: comparar `scannedAt` con el `lastSeen` de cada equipo
  evita que un JSON viejo revierta datos más recientes.
- **Escaneo vacío rechazado**: un archivo sin equipos no puede marcar toda la
  red como ausente.
- **Compatibilidad**: si la petición no trae `importIps`, se crean todas las
  filas `new`, como antes. La UI nueva envía todas las filas y la selección.

## Riesgos residuales

- El estado no es en tiempo real; equipos apagados entre escaneos conservan el
  estado anterior hasta el siguiente. Mitigado con la fecha visible y el aviso
  de 24 h.
- Un escaneo incompleto (red parcial o filtrada) puede marcar ausentes equipos
  presentes. Mitigado exigiendo CIDR y permitiendo revisar la proyección antes
  de aplicar.
- Sin historial no se puede auditar cuándo cambió un estado. Aceptado para esta
  feature; el historial está en backlog.

## Checklist de cierre

- [x] El PR de la feature está mergeado y la rama borrada.
- [x] El CI de `main` está verde tras el merge de la feature.
- [x] Producción está desplegada y verificada; el smoke autenticado está
      documentado.
- [x] `tasks.md` no tiene casillas pendientes.
- [x] `cierre.md` no tiene casillas pendientes.
- [x] `MEMORY.md` enlaza este cierre y tiene el registro actualizado.
- [x] `CHANGELOG.md`, `README.md` y `docs/*` están al día.
- [x] `npm run docs:check -- dispositivos-estado` pasa.
- [ ] El PR de cierre tiene el CI verde.
