# Tasks — Escaneo de red e importación

> Estado: en cierre. La tarea 13 (PR y producción) se completa en la Fase B.

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
- [ ] **13. PR y producción** — PR, CI verde, squash merge, deployment y
  comprobaciones públicas; smoke autenticado con escaneo real o fixture sin
  dejar datos.

## Pendientes / follow-ups

- `feat/dispositivos-estado`: actualizar `online`/`lastSeen` y detectar
  equipos ausentes.
- Publicación directa del escaneo con token (opción B), si se quiere evitar
  subir el archivo manualmente.
