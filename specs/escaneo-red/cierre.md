# Cierre — Escaneo de red e importación

**Estado:** borrador (Fase A)
**Fecha:** 2026-10-20
**Feature:** `escaneo-red`
**PR de feature:** pendiente
**Commit:** pendiente
**PR de cierre:** pendiente

## Resumen

Escaneo local de la red con `nmap`, salida JSON versionada y previsualización en
`/devices` para importar solo equipos nuevos. La app no ejecuta `nmap` en Vercel:
el usuario escanea en su ordenador y sube el archivo; la API valida, deduplica
por IP/MAC y crea únicamente las filas `new` seleccionadas.

## Alcance entregado

- CLI `npm run scan` con validación de CIDR, `execFile` sin shell, `--out`,
  `--json` y `--cidr`.
- Parser de nmap con IP/hostname, MAC/vendor, normalización y deduplicación.
- `POST /api/devices/import` solo ADMIN, con `dryRun` por defecto y preview de
  estados `new`/`existing`/`conflict`/`duplicate`/`invalid`.
- Panel editorial en `/devices` para subir el JSON, revisar el resumen, marcar
  nuevos e importar; FAMILY no lo ve.
- Sin cambios de esquema ni historial de escaneos; el JSON es efímero.
- Fuera de alcance: `online`/`lastSeen` (siguiente feature), publicación directa
  con token, escaneo en segundo plano y actualización de equipos existentes.

## Cambios principales

| Área | Archivos | Qué cambió |
|---|---|---|
| Lógica | `src/lib/utils/scan.ts`, `src/lib/utils/device.ts` | Parser, CIDR, clasificación, nombres sugeridos y regex IPv4 compartida |
| Esquema | `src/lib/schemas/scan.ts` | Payload de importación, `dryRun` por defecto, máximo 512 |
| API | `src/app/api/devices/import/route.ts` | Preview/importación, deduplicación y `createMany` |
| Middleware | `src/middleware.ts` | Excepción para devolver `401` JSON en la importación |
| CLI | `scripts/scan-network.ts` | `execFile`, flags, errores y JSON |
| UI | `src/components/devices/ScanImportPanel.tsx`, `DeviceManager.tsx` | Subida, preview, selección, importación y permisos |
| Tests | `tests/scan.test.ts`, `tests/api/scan.schemas.test.ts`, `tests/middleware.test.ts` | Parser, clasificación, esquema y excepción de middleware |
| Docs | `README.md`, `CHANGELOG.md`, `docs/escaneo-red.md`, `specs/escaneo-red/` | Guía, estado y cierre |

## Verificación

### Código y tests

| Comando | Resultado |
|---|---|
| `npm run lint` | OK |
| `npm run typecheck` | OK |
| `npm run test` | 225 tests OK |
| `npm run build` | OK; `ƒ /api/devices/import` y `ƒ /devices` presentes |
| CI del PR | pendiente |

### CLI

- `npm run scan -- --out ...` con un `nmap` simulado en `PATH`: 3 equipos,
  MAC normalizada y JSON válido.
- `npm run --silent scan -- --json`: JSON limpio por stdout; progreso por
  stderr.
- CIDR inválido (`999.1.1.0/24`): error claro, exit 1, sin invocar el escaneo.
- Sin `nmap` en `PATH`: mensaje de instalación, exit 1.
- El entorno del agente no tiene `nmap`; el escaneo real queda para el usuario.

### UI / Chrome

- Build de producción local (`npm start`), Chrome headless/CDP, viewport 390.
- ADMIN: panel, subida de fixture, resumen (5 descubiertos · 2 nuevos · 1
  existente · 1 duplicado · 1 inválido), importación de 2 equipos y refresco.
- Segundo fixture: conflicto entre IP y MAC de dos equipos, duplicado y un
  nuevo; se importó solo el nuevo.
- FAMILY: sin botones ni panel; API `403`.
- Sin sesión: API `401` (`{"error":"No autorizado"}`); payload inválido `400`.
- Archivo no JSON: `role="alert"` visible.
- Móvil 390 px: `scrollWidth === innerWidth` antes y durante el panel/preview.
- Consola: sin errores.
- Evidencia visual: capturas locales del panel y del preview; no se adjuntan
  datos personales.

### Producción

| Campo | Valor |
|---|---|
| URL | <https://casa-os-mauve.vercel.app> |
| Deployment | pendiente |
| Commit | pendiente |
| Health | pendiente |
| Rutas | pendiente |
| Smoke autenticado | pendiente |

## Documentación actualizada

- [x] `MEMORY.md`: estado, roadmap, registro y foco (pendiente PR/deployment).
- [x] `CHANGELOG.md`: entrada de la entrega.
- [x] `README.md`: característica, requisito de nmap y guía.
- [x] `docs/*`: `docs/escaneo-red.md`.
- [x] `spec.md` y `plan.md`: decisiones finales.
- [ ] `tasks.md`: tarea 13 (PR/producción) pendiente hasta Fase B.
- [x] `AGENTS.md`: no aplica; no cambian las reglas del arnés.
- [ ] `npm run docs:check -- escaneo-red` pasa (Fase B).

## Tareas

### Completadas

- Utilidades de escaneo, parser, CIDR y clasificación.
- CLI con flags, `execFile` y errores claros.
- Esquema Zod, endpoint ADMIN y lógica de importación.
- Panel de importación y permisos FAMILY.
- Tests de parser, clasificación, esquema y middleware.
- Documentación, verificación local/UI y build.
- Datos de prueba eliminados de la base local.

### Pendientes / follow-ups

- `feat/dispositivos-estado` — actualizar `online`/`lastSeen`, detectar equipos
  ausentes y alertas básicas.
- Publicación directa del escaneo con token — evitar la subida manual, si se
  quiere; no entra en esta entrega.
- Escaneo real — el agente no tiene `nmap` instalado; verificar con la red de
  casa y registrar el resultado en la Fase B.
- Resolver conflictos IP/MAC manualmente — no hay fusión automática.

## Decisiones y lecciones

- **Escaneo local + JSON** en vez de `nmap` en Vercel: es la única opción que ve
  la red de casa. Se evita un token de servicio y un historial de escaneos.
- **`dryRun` por defecto `true`**: una petición sin intención explícita solo
  previsualiza; para escribir hay que enviar `false`.
- **Duplicado en archivo tiene prioridad** sobre la coincidencia con el
  inventario; el usuario ve que la fila está repetida antes de importar.
- **Solo se crean filas `new`**: no se actualizan MAC, IP, nombre ni tipo de
  equipos existentes. El estado online queda para la siguiente feature.
- **Excepción de middleware**: las rutas de API deben devolver `401` JSON, no
  redirigir a login; el guard `requireAdmin` sigue siendo la defensa real.
- **`npm run --silent`** para pipes: la cabecera de npm contaminaría el stdout.
- **Verificación honesta**: el escaneo real no se pudo ejecutar en el entorno
  del agente; se probó el CLI con un `nmap` simulado y el usuario deberá hacer
  el smoke con su red.

## Riesgos residuales

- `nmap` debe estar instalado y con permisos de red local; sin él no hay
  escaneo.
- Algunos equipos no exponen MAC; la deduplicación queda solo por IP.
- DHCP puede reutilizar IPs y producir falsos `existing`/`conflict`; se muestran
  sin sobrescribir.
- Un JSON antiguo puede mostrar equipos que ya no están; no se toca el estado
  online en esta entrega.

## Checklist de cierre

- [ ] El PR de la feature está mergeado y la rama borrada.
- [ ] El CI de `main` está verde tras el merge de la feature.
- [ ] Producción está desplegada y verificada; el smoke autenticado está
      documentado.
- [ ] `tasks.md` no tiene casillas pendientes.
- [ ] `cierre.md` no tiene casillas pendientes.
- [ ] `MEMORY.md` enlaza este cierre y tiene el registro actualizado.
- [ ] `CHANGELOG.md`, `README.md` y `docs/*` están al día.
- [ ] `npm run docs:check -- escaneo-red` pasa.
- [ ] El PR de cierre tiene el CI verde.
