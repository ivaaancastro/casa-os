# Tasks — Estado online/offline y última vez visto

> Estado: en implementación. Spec aprobado el 2026-10-22.

## Utilidades y tests

- [x] **1. Utilidades de estado** — Crear `src/lib/utils/deviceStatus.ts` con
  `parseCidr`, `isIpInCidr`, `planStatusUpdates` y `formatRelativeTime`.
- [x] **2. Tests del planificador** — Crear `tests/device-status.test.ts`:
  CIDR (límites, `/32`, `/0`, inválido), vistos por IP/MAC, conflictos,
  ausentes dentro/fuera del CIDR, nunca vistos, `stale` y sin CIDR.
- [x] **3. Formato de presencia** — Actualizar `formatDeviceStatus` para
  `En línea · visto hace X` / `Ausente · visto hace X` / `Sin datos` y ajustar
  `tests/device.test.ts`.

## Validación y API

- [x] **4. Esquema del escaneo** — En `src/lib/schemas/scan.ts`: `importIps`,
  `cidr` validado y `scannedAt` ISO no futuro (margen 5 min).
- [x] **5. Tests del esquema** — Ampliar `tests/api/scan.schemas.test.ts` con
  `importIps`, CIDR inválido, fecha futura y fecha inválida.
- [x] **6. Planificación en la API** — En `POST /api/devices/import`:
  observados por clasificación, `planStatusUpdates`, respuesta `changes` y
  flags `statusApplied` / `offlineChecked`; la previsualización no escribe.
- [x] **7. Escritura transaccional** — Crear solo las `new` de `importIps`
  (o todas si no viene), con `online`/`lastSeen`; actualizar vistos y ausentes
  en `prisma.$transaction`; estado HTTP `201`/`200`.
- [x] **8. Tests de la ruta** — Cubrir con tests puros/planificador el caso
  «solo estado», selección parcial, `stale`, sin CIDR y fecha futura.

## Interfaz

- [x] **9. Panel de importación** — Enviar todas las filas + `importIps`,
  mostrar proyección de altas/bajas/stale y botón `Actualizar estado` sin
  nuevos.
- [x] **10. Resultado del escaneo** — Resumen de altas (nuevos + reconectados),
  bajas e ignorados; refresco de la lista.
- [x] **11. Lista y cabecera** — Estado con última vez visto en cada equipo;
  frescura global y aviso si el último dato tiene más de 24 h.

## Cierre de la feature

- [x] **12. Documentación** — `README.md`, `docs/escaneo-red.md`,
  `CHANGELOG.md`, `MEMORY.md` y `docs/roadmap.md` al día; borrador de
  `specs/dispositivos-estado/cierre.md`.
- [x] **13. Calidad** — `npm run lint && npm run typecheck && npm run test &&
  npm run build`. `docs:check` se valida en la Fase B, cuando el cierre deja de
  ser borrador.
- [ ] **14. UI y PR** — Verificación Chrome MCP (escritorio y 390 px), commits,
  PR, CI verde, squash merge y borrado de rama.

## Pendientes / follow-ups

- Notificaciones push/email de altas y bajas: `feat/recordatorios`.
- Historial de disponibilidad y gráficas: backlog.
- Resolución automática de conflictos IP/MAC o IP por DHCP: fuera de alcance.
