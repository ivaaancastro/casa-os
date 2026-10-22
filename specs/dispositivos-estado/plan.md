# Plan — Estado online/offline y última vez visto

**Feature:** `dispositivos-estado`
**Rama:** `feat/dispositivos-estado`
**Hito:** 2 — Dispositivos de la red
**Depende de:** `feat/dispositivos-crud` y `feat/escaneo-red` (cerradas)

## Contexto

El inventario ya tiene `online` y `lastSeen`, pero nadie los escribe: los
equipos aparecen siempre como «Sin datos». El escaneo de red (JSON + `nmap`
local) sabe qué equipos están vivos en un momento dado, así que es la única
fuente fiable de estado en un despliegue serverless.

En esta entrega el escaneo deja de ser solo un importador: al aplicarlo,
actualiza el estado de los equipos vistos y marca como ausentes los que ya no
aparecen, dentro de la red escaneada. La lista de `/devices` pasa a reflejar el
estado real y muestra cuándo se vio cada equipo por última vez.

## Enfoque técnico

1. **El estado se aplica al importar el escaneo**, no con un cron (Vercel no ve
   la red de casa) ni con un botón que ejecute `nmap` en el servidor.
2. **La UI envía todas las filas del escaneo** (no solo las nuevas
   seleccionadas) más la selección de IPs a crear. Así el servidor puede
   actualizar los equipos existentes y detectar ausencias.
3. **Planificador puro y testeable** (`src/lib/utils/deviceStatus.ts`):
   - `isIpInCidr(ip, cidr)`: pertenencia a la red escaneada.
   - `planStatusUpdates(...)`: calcula qué equipos pasan a en línea, cuáles a
     ausentes y cuáles se ignoran por ser un escaneo más antiguo que su
     `lastSeen`.
4. **Escritura transaccional** en `POST /api/devices/import`:
   `createMany` de los nuevos + `updateMany` de en línea + `updateMany` de
   ausentes, dentro de `prisma.$transaction`.
5. **Detección de ausencias conservadora**:
   - solo si el payload trae `cidr` válido;
   - solo equipos con IP dentro de esa red;
   - solo equipos ya vistos (`lastSeen != null`) y que no aparezcan en el
     archivo;
   - nunca si el escaneo es más antiguo que el `lastSeen` del equipo.
6. **Altas y bajas visibles** sin historial nuevo: la respuesta de importación
   devuelve `connected` / `disconnected` / `stale` con `id` y `name`; el panel
   muestra el resumen. La lista deriva la frescura de `lastSeen`, y la cabecera
   avisa si el último dato tiene más de 24 h.
7. **Sin cambios de esquema.** `online` y `lastSeen` ya existen; no se añaden
   tablas de historial ni de escaneos (decisión de `feat/escaneo-red`).

## Cambios previstos

| Área | Archivo | Cambio |
|---|---|---|
| Utilidades | `src/lib/utils/deviceStatus.ts` (nuevo) | CIDR, planificador de transiciones y formato de frescura |
| API | `src/lib/schemas/scan.ts` | `importIps` opcional y validación de `scannedAt` |
| API | `src/app/api/devices/import/route.ts` | Estado en `dryRun`, transacción y resumen de cambios |
| UI | `src/components/devices/ScanImportPanel.tsx` | Enviar todas las filas, mostrar proyección y resultado |
| UI | `src/components/devices/DeviceManager.tsx` | Última vez visto y estado por equipo |
| UI | `src/app/devices/page.tsx` | Cabecera con frescura y aviso de datos antiguos |
| Tests | `tests/device-status.test.ts` (nuevo) + `tests/api/scan.schemas.test.ts` | CIDR, planificador, esquema y resultados |
| Docs | `README.md`, `docs/escaneo-red.md`, `CHANGELOG.md`, `MEMORY.md`, `docs/roadmap.md` | Nuevo comportamiento y límites |

## Decisiones de diseño

- **Aplicar el escaneo es un acto explícito.** La previsualización (`dryRun`)
  no escribe; el botón indica cuántos equipos se actualizarán y qué bajas
  habrá antes de confirmar.
- **Nada de estado «en vivo».** El estado es tan reciente como el último
  escaneo aplicado; la UI lo dice en vez de fingir tiempo real.
- **Un escaneo viejo no pisa datos más nuevos.** Si `scannedAt` es anterior al
  `lastSeen` de un equipo, ese equipo se deja intacto (`stale`).
- **Las filas en conflicto no actualizan estado**, porque la IP y la MAC
  apuntan a equipos distintos.
- **Los equipos nuevos nacen en línea** (`online: true`, `lastSeen =
  scannedAt`), porque el escaneo acaba de verlos.
- **Sin notificaciones push.** Las «alertas básicas» son el resumen de altas y
  bajas tras aplicar el escaneo y el aviso de frescura en la lista. Los avisos
  programados pertenecen a `feat/recordatorios`.

## Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Un escaneo parcial marca equipos dormidos como ausentes | Solo dentro del CIDR, solo equipos ya vistos, previsualización con recuento y bajas antes de aplicar; límite documentado |
| Un JSON antiguo revierte el estado | Guarda `scannedAt >= lastSeen`; los equipos afectados se listan como `stale` |
| Un `scannedAt` futuro falsea `lastSeen` | Se rechaza con `400` si supera 5 min de margen |
| DHCP cambia la IP de un equipo | El emparejamiento por MAC marca el equipo como visto; no se reescribe la IP |
| Payload grande (hasta 512 filas) | Zod limita y la transacción solo toca IDs planificados |

## Alternativas descartadas

- **Cron o ping desde Vercel:** serverless no está en la red de casa.
- **Ejecutar `nmap` desde la API:** mismo motivo; ya se descartó en
  `feat/escaneo-red`.
- **Tabla de historial de escaneos/eventos:** aporta poco para el objetivo y
  contradice la decisión de no guardar historial; las alertas se resuelven con
  la respuesta del import y `lastSeen`.
- **Estado en tiempo real por WebSocket:** fuera de alcance y sin fuente de
  datos fiable.

## Verificación prevista

- Tests unitarios del CIDR y del planificador (incluidos `stale`, conflictos y
  equipos fuera de la red).
- `lint`, `typecheck`, `test`, `build`.
- UI en Chrome MCP: preview sin escritura, aplicación con altas/bajas, móvil
  390 px y consola limpia.
- Producción tras el merge: subir un fixture realista como ADMIN y comprobar
  lista y frescura (sin dejar datos de prueba).
