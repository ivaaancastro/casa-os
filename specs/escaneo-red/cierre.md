# Cierre — Escaneo de red e importación

**Estado:** cerrada
**Fecha:** 2026-10-21
**Feature:** `escaneo-red`
**PR de feature:** #18
**Commits:** `955bd6a` (feature), `d51aeb6` (#19) y `5835fd2` (#20)
**PR de cierre:** #21

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
| Pulido UI | PR #19 y #20 | Concordancia `1 nuevo`/`N nuevos` y comando completo en móvil |
| Tests | `tests/scan.test.ts`, `tests/api/scan.schemas.test.ts`, `tests/middleware.test.ts` | Parser, clasificación, esquema y excepción de middleware |
| Docs | `README.md`, `CHANGELOG.md`, `docs/escaneo-red.md`, `specs/escaneo-red/` | Guía, estado y cierre |

## Verificación

### Código y tests

| Comando / comprobación | Resultado |
|---|---|
| `npm run lint` | OK |
| `npm run typecheck` | OK |
| `npm run test` | 225 tests OK |
| `npm run build` | OK; `ƒ /api/devices/import` y `ƒ /devices` presentes |
| CI PR #18 | ✅ [run 39464481002](https://github.com/ivaaancastro/casa-os/actions/runs/39464481002) |
| CI de `main` tras #18 | ✅ [run 39464716601](https://github.com/ivaaancastro/casa-os/actions/runs/39464716601) |
| CI PR #19 | ✅ [run 39581446625](https://github.com/ivaaancastro/casa-os/actions/runs/39581446625) |
| CI de `main` tras #19 | ✅ [run 39581639376](https://github.com/ivaaancastro/casa-os/actions/runs/39581639376) |
| CI PR #20 | ✅ [run 39582032219](https://github.com/ivaaancastro/casa-os/actions/runs/39582032219) |
| CI de `main` tras #20 | ✅ [run 39582208456](https://github.com/ivaaancastro/casa-os/actions/runs/39582208456) |

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
| Deployment | Auto-deploy de Vercel desde `main`; ID no disponible sin token de Vercel |
| Commit | `5835fd2` (`fix(escaneo): mostrar el comando completo en móvil (#20)`) |
| Health | `GET /api/health` → `200` (`status: ok`, `db: ok`) |
| Rutas | `/api/devices/import` sin sesión → `401` JSON; `/devices` sin sesión → `307` al login; `/auth/login` → `200`; manifest, SW y `/offline` → `200` |
| Cabeceras | CSP, HSTS, `nosniff`, `frame-options` y `permissions-policy` correctas |
| Código nuevo | La UI final muestra `1 nuevo` y el comando completo; el `401` JSON de la ruta nueva confirma que producción sirve el código del merge |
| Smoke ADMIN | Cuenta temporal: `/devices` con panel, fixture de 2 equipos (1 existente + 1 nuevo), preview sin importar, 390 px sin overflow y consola limpia |
| Smoke FAMILY | No ejecutado en producción (sin credencial FAMILY); misma lógica verificada en local y API `403` |
| Limpieza | Cuenta temporal desactivada por Iván desde `/familia`; la app solo permite baja lógica, no borrado duro |

## Documentación actualizada

- [x] `MEMORY.md`: v0.7, producción, registro de features, foco y lecciones.
- [x] `CHANGELOG.md`: entrada de la entrega, verificación en producción y fixes.
- [x] `README.md`: característica, requisito de nmap y guía.
- [x] `docs/*`: `docs/escaneo-red.md` y roadmap histórico.
- [x] `spec.md` y `plan.md`: decisiones finales.
- [x] `tasks.md`: tarea 14 completada y follow-ups separados.
- [x] `AGENTS.md`: no aplica; no cambian las reglas del arnés.
- [x] `npm run docs:check -- escaneo-red` pasa.

## Tareas

### Completadas

- Utilidades de escaneo, parser, CIDR y clasificación.
- CLI con flags, `execFile` y errores claros.
- Esquema Zod, endpoint ADMIN y lógica de importación.
- Panel de importación y permisos FAMILY.
- Tests de parser, clasificación, esquema y middleware.
- Documentación, verificación local/UI y build.
- Datos de prueba eliminados de la base local.
- PR #18 mergeado en `main` (`955bd6a`), rama borrada y CI de `main` verde.
- PRs #19 y #20 de pulido UI mergeados; commit final `5835fd2` y CI verde.
- Producción verificada en público: health, cabeceras, rutas protegidas y
  `401` JSON de la nueva API.
- Smoke ADMIN de producción con fixture: panel, preview, móvil 390 px y consola
  limpia, sin importar datos.
- Cuenta temporal de producción desactivada.

### Pendientes / follow-ups

- `feat/dispositivos-estado` — actualizar `online`/`lastSeen`, detectar equipos
  ausentes y alertas básicas.
- Publicación directa del escaneo con token — evitar la subida manual, si se
  quiere; no entra en esta entrega.
- Escaneo real — el agente no tiene `nmap` instalado; verificar con la red de
  casa y registrar el resultado.
- Confirmación FAMILY en producción (opcional) — el guard es el mismo que se
  verificó en local.
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
- **Pulido en PRs pequeños**: el smoke de producción detectó concordancia y un
  comando recortado; se corrigieron en `fix/*` antes de cerrar, no se dejaron
  como deuda visual.
- **Baja lógica ≠ borrado**: no hay `DELETE /api/users` y la autodesactivación
  está bloqueada; una cuenta temporal debe desactivarla otro ADMIN o borrarse
  desde la base de datos.
- **Verificación honesta**: el escaneo real no se pudo ejecutar en el entorno
  del agente y FAMILY no se probó en producción; se registra así en vez de
  presentarlo como verificación automática.

## Riesgos residuales

- `nmap` debe estar instalado y con permisos de red local; sin él no hay
  escaneo.
- Algunos equipos no exponen MAC; la deduplicación queda solo por IP.
- DHCP puede reutilizar IPs y producir falsos `existing`/`conflict`; se muestran
  sin sobrescribir.
- Un JSON antiguo puede mostrar equipos que ya no están; no se toca el estado
  online en esta entrega.
- La cuenta temporal queda como baja lógica, no eliminada físicamente; no hay
  endpoint de borrado duro.

## Checklist de cierre

- [x] El PR de la feature está mergeado (#18) y la rama borrada.
- [x] El CI de `main` está verde tras el merge de la feature y de los fixes.
- [x] Producción está desplegada y verificada; el smoke ADMIN está documentado.
- [x] `tasks.md` no tiene casillas pendientes.
- [x] `cierre.md` no tiene casillas pendientes.
- [x] `MEMORY.md` enlaza este cierre y tiene el registro actualizado.
- [x] `CHANGELOG.md`, `README.md` y `docs/*` están al día.
- [x] `npm run docs:check -- escaneo-red` pasa.
- [x] El PR de cierre #21 tiene el CI verde.

**Estado final:** cerrada
