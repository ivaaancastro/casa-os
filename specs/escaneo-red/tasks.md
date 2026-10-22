# Tasks — Escaneo de red e importación

> Estado: cerrada. Feature, pulido y smoke de producción completados.

## Escáner y utilidades

- [x] **1. Utilidades de red** — `src/lib/utils/scan.ts`: `isValidIpv4`,
  `isValidCidr`, `parseNmapOutput`, `buildScanPayload`,
  `classifyScanDevices` y nombres sugeridos. Mover la regex IPv4 a
  `src/lib/utils/device.ts` para compartirla.
- [x] **2. CLI** — `scripts/scan-network.ts`: `--out`, `--json` y `--cidr`;
  `execFile` sin shell, validación de CIDR, errores claros si falta nmap y
  `.gitignore` para `scan-latest.json`.
- [x] **3. Esquema Zod** — `src/lib/schemas/scan.ts`: payload, `dryRun` por
  defecto `true`, máximo 512 y límites de longitud.

## API

- [x] **4. Endpoint** — `src/app/api/devices/import/route.ts`: ADMIN, preview
  `dryRun`, importación de solo `new`, `createMany` con `skipDuplicates`, sin
  tocar existentes ni `online`/`lastSeen`.

## UI

- [x] **5. Panel de importación** — `src/components/devices/ScanImportPanel.tsx`:
  instrucciones, selector JSON, resumen, filas clasificadas, selección de
  nuevos, importación y errores.
- [x] **6. Integración** — `src/components/devices/DeviceManager.tsx`: botón
  “Importar escaneo” solo ADMIN, apertura/cierre y refresco del inventario.

## Tests

- [x] **7. Parser y clasificación** — `tests/scan.test.ts`: CIDR, formatos de
  nmap, normalización, deduplicación y todos los estados.
- [x] **8. Esquema** — `tests/api/scan.schemas.test.ts`: defaults, versión,
  límites y validaciones.

## Verificación y documentación

- [x] **9. CLI** — probar `--out` y `--json` con un `nmap` simulado; comprobar
  el error si falta nmap y que el CIDR inválido no ejecuta nada.
- [x] **10. UI/API local** — subir fixture en `/devices`, previsualizar,
  importar, comprobar conflictos/duplicados/inválidos, FAMILY, móvil 390 px y
  consola limpia. Limpiar los datos de prueba.
- [x] **11. Documentación** — `docs/escaneo-red.md`, README, CHANGELOG, MEMORY,
  spec/tasks y borrador de `cierre.md`.
- [x] **12. Calidad local** — `npm run lint && npm run typecheck && npm run
  test && npm run build`.
- [x] **13. PR y despliegue** — PR #18, CI verde, squash merge `955bd6a`,
  deployment automático y comprobaciones públicas (health, cabeceras, `401`
  sin sesión y rutas protegidas).
- [x] **14. Smoke autenticado** — ADMIN confirmado en producción con cuenta
  temporal: panel, preview de fixture (un equipo existente y uno nuevo) y móvil
  390 px sin overflow, sin importar datos. FAMILY se verificó en local (sin
  panel ni botones; API `403`); no se usó una credencial FAMILY de producción.
  Cuenta temporal desactivada tras el smoke.

## Pendientes / follow-ups

- `feat/dispositivos-estado`: actualizar `online`/`lastSeen` y detectar
  equipos ausentes.
- Publicación directa del escaneo con token (opción B), si se quiere evitar
  subir el archivo manualmente.
- Confirmación FAMILY en producción (opcional): el guard es el mismo que se
  verificó en local; no hay credencial FAMILY de producción.
- Escaneo real con `nmap` instalado en el equipo de casa; el agente solo pudo
  probar el CLI con un binario simulado.
