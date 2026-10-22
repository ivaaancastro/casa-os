# Spec — Estado online/offline y última vez visto

**Feature:** `dispositivos-estado`
**Estado:** propuesta — pendiente de aprobación del usuario
**Fecha:** 2026-10-22
**Hito:** 2 — Dispositivos de la red

## Objetivo

Que `/devices` muestre el estado real de los equipos a partir del último escaneo
aplicado: en línea, ausente o sin datos, con la última vez visto y un resumen de
las altas y bajas detectadas. Sin cron, sin `nmap` en el servidor y sin cambios
de esquema.

## Requisitos funcionales

### RF-1 — Aplicar el escaneo actualiza el estado

Al importar un escaneo como ADMIN (`dryRun: false`), además de crear los equipos
nuevos seleccionados:

- Cada equipo del inventario que aparezca en el archivo (por IP o por MAC y sin
  conflicto) pasa a `online = true` y `lastSeen = scannedAt`.
- Cada equipo creado en esa importación nace con `online = true` y
  `lastSeen = scannedAt`.
- Cada equipo del inventario con IP dentro del `cidr` escaneado que **no**
  aparezca en el archivo, que ya hubiera sido visto (`lastSeen != null`) y no
  esté en conflicto, pasa a `online = false` (conserva su `lastSeen`).

### RF-2 — Un escaneo antiguo no pisa datos más recientes

Si `scannedAt` es anterior al `lastSeen` de un equipo, ese equipo no se
modifica: ni se marca en línea ni se marca ausente. Se devuelve en `stale` para
que la UI lo explique.

### RF-3 — La previsualización no escribe y proyecta los cambios

`dryRun: true` devuelve, sin escribir nada:

- la clasificación actual de todas las filas (`new`, `existing`, `conflict`,
  `duplicate`, `invalid`);
- la proyección de estado: equipos que pasarían a en línea (`connected`), a
  ausentes (`disconnected`) y equipos ignorados por antigüedad (`stale`).

La UI muestra esa proyección antes de aplicar el escaneo.

### RF-4 — La selección de nuevos no impide actualizar el estado

La UI envía **todas** las filas del archivo y una lista `importIps` con las IPs
de las filas `new` seleccionadas. Sin `importIps`, la API mantiene el
comportamiento anterior (crea todas las `new`) para no romper clientes
existentes, pero la UI siempre la envía.

Aplicar un escaneo sin equipos nuevos es válido: actualiza el estado y devuelve
`created: 0`.

### RF-5 — Resultado con altas, bajas e ignorados

La respuesta de una importación real incluye:

- `created`: equipos nuevos creados;
- `connected`: equipos que pasan a en línea (`{ id, name }`), incluidos los
  recuperados;
- `disconnected`: equipos que pasan a ausentes (`{ id, name }`);
- `stale`: equipos ignorados porque el escaneo es anterior a su `lastSeen`
  (`{ id, name, lastSeen }`);
- `statusApplied`: si se aplicó lógica de estado (`scannedAt` válido);
- `offlineChecked`: si se pudo evaluar ausencias (había `cidr` válido).

La UI resume: «X altas (N nuevos, M reconectados) · Y bajas» y, si hay,
«Z equipos ignorados por ser un escaneo antiguo».

### RF-6 — Lista y cabecera reflejan la frescura

- Cada equipo muestra su estado: `En línea`, `Ausente` o `Sin datos`.
- Se muestra la última vez visto de forma relativa (`hace 2 min`, `hace 3 h`,
  `hace 2 días` o fecha corta) cuando exista.
- La cabecera muestra `Última actualización: hace X` calculada con el
  `lastSeen` más reciente y avisa en tono de atención si supera 24 h:
  «Estado desactualizado: sube un escaneo nuevo».
- Sin ningún `lastSeen`, la cabecera indica «Sin escaneos aplicados».

### RF-7 — Permisos y validación

- Solo ADMIN puede previsualizar o aplicar escaneos (`requireAdmin`); FAMILY
  sigue en solo lectura y no ve el panel.
- El JSON se valida con Zod: versión 1, entre 1 y 512 filas, `scannedAt` ISO,
  `cidr` IPv4 válido, `importIps` IPv4 y máximo 512.
- `scannedAt` con más de 5 minutos en el futuro → `400`.
- `scannedAt` ausente o inválido → no se aplica estado (`statusApplied: false`);
  se puede seguir creando equipos nuevos con `online: false` y `lastSeen: null`.
- La respuesta nunca expone datos de otros usuarios ni secretos.

## Contrato de API

`POST /api/devices/import` (ADMIN, fuera del middleware de redirección para
devolver JSON).

### Petición — previsualizar

```json
{
  "version": 1,
  "scannedAt": "2026-10-22T18:00:00.000Z",
  "cidr": "192.168.1.0/24",
  "dryRun": true,
  "devices": [
    { "ip": "192.168.1.1", "mac": "AA:BB:CC:DD:EE:FF", "vendor": "Router Co." },
    { "ip": "192.168.1.20", "mac": null }
  ]
}
```

### Petición — aplicar

```json
{
  "version": 1,
  "scannedAt": "2026-10-22T18:00:00.000Z",
  "cidr": "192.168.1.0/24",
  "dryRun": false,
  "importIps": ["192.168.1.20"],
  "devices": [
    { "ip": "192.168.1.1", "mac": "AA:BB:CC:DD:EE:FF" },
    { "ip": "192.168.1.20" }
  ]
}
```

### Respuesta

```json
{
  "dryRun": false,
  "scannedAt": "2026-10-22T18:00:00.000Z",
  "cidr": "192.168.1.0/24",
  "statusApplied": true,
  "offlineChecked": true,
  "created": 1,
  "skipped": 0,
  "summary": {
    "total": 2,
    "new": 1,
    "existing": 1,
    "conflict": 0,
    "duplicate": 0,
    "invalid": 0,
    "created": 1,
    "skipped": 0,
    "connected": 1,
    "disconnected": 2
  },
  "changes": {
    "connected": [{ "id": "dev_1", "name": "Router" }],
    "disconnected": [
      { "id": "dev_2", "name": "TV salón" },
      { "id": "dev_3", "name": "Impresora" }
    ],
    "stale": []
  },
  "items": ["…clasificación completa…"]
}
```

- `201` si se creó al menos un equipo; `200` si solo se actualizó estado.
- `400` si el payload no es válido o `scannedAt` es futuro.
- `401`/`403` sin sesión o sin rol ADMIN.

## Modelo de datos

**Sin migración.** Se usan los campos existentes:

| Campo | Uso |
|---|---|
| `Device.online` | Estado actual (`true` visto en el último escaneo aplicado) |
| `Device.lastSeen` | Momento del último escaneo en que se vio el equipo |

No se crean tablas de escaneos ni de eventos. El historial de altas/bajas vive
en la respuesta del import y en `lastSeen`.

## UI/UX

### Panel «Importar escaneo»

1. Subir archivo → previsualización con la clasificación actual.
2. Bloque nuevo «Estado tras aplicar»:
   - «N equipos pasarán a en línea» (con nombres, máx. 5 y «y N más»).
   - «M equipos se marcarán como ausentes» (con nombres, máx. 5).
   - «K equipos se ignoran: el escaneo es anterior a su última vez visto».
   - Aviso si el escaneo tiene más de 24 h: se puede aplicar, pero el estado
     resultante no será reciente.
3. Botón:
   - con nuevos seleccionados: `Importar N nuevos y actualizar estado`;
   - sin nuevos: `Actualizar estado` (habilitado si la previsualización es
     válida).
4. Tras aplicar: resumen de altas/bajas e ignorados; `router.refresh()`.
5. La previsualización no escribe; «Descartar» limpia todo.

Estética editorial existente (Bodoni + Jost, radios 0, `mist`/`ink`/`ash`),
mobile-first y sin overflow a 390 px. Los avisos usan `role="status"` y los
errores `role="alert"`.

### Lista de dispositivos

- Estado + última vez visto: `En línea · visto hace 2 min`, `Ausente · visto
  hace 3 h`, `Sin datos`.
- Sin cambios en edición, borrado ni permisos.
- La cabecera añade la línea de frescura descrita en RF-6.

## Criterios de aceptación

- [ ] Aplicar un escaneo con un equipo existente lo deja `online: true` y con
      `lastSeen` igual a `scannedAt`.
- [ ] Un equipo del CIDR que no aparece y ya había sido visto pasa a
      `online: false` sin cambiar su `lastSeen`.
- [ ] Un equipo nunca visto no se marca ausente.
- [ ] Un equipo fuera del CIDR no se toca.
- [ ] Un equipo con `lastSeen` posterior a `scannedAt` no se modifica y aparece
      en `stale`.
- [ ] Un equipo nuevo seleccionado se crea `online: true` con `lastSeen`.
- [ ] Aplicar sin equipos nuevos (solo estado) devuelve `200`, `created: 0` y
      actualiza la lista.
- [ ] `dryRun` devuelve la proyección y no escribe en la base de datos.
- [ ] `scannedAt` futuro (> 5 min) devuelve `400`.
- [ ] Sin `cidr`, se actualizan los vistos pero no se marcan ausencias
      (`offlineChecked: false`).
- [ ] FAMILY no puede previsualizar ni aplicar (`403`); la UI no le muestra el
      panel.
- [ ] La lista y la cabecera muestran estado y frescura correctos en escritorio
      y a 390 px, sin overflow ni errores de consola.
- [ ] Tests nuevos y existentes pasan; `lint`, `typecheck` y `build` en verde.

## Tests

- `tests/device-status.test.ts` (nuevo):
  - `isIpInCidr`: dentro/fuera, límites de red y broadcast, `/32`, `/0` y CIDR
    inválido.
  - `planStatusUpdates`: vistos por IP, por MAC, conflicto, ausente dentro del
    CIDR, fuera del CIDR, nunca visto, `stale` y ausencia de `cidr`.
  - Formato de frescura (minutos, horas, días, fecha y sin datos).
- `tests/api/scan.schemas.test.ts`: `importIps`, `scannedAt` ISO y futuro,
  límites y `cidr`.
- Tests de integración de la ruta solo si no exigen red; se mantiene el patrón
  actual de tests puros.

## Seguridad

- Validación Zod de todo el payload; máximo 512 filas y 1 MB en cliente.
- Solo ADMIN; la ruta sigue fuera del middleware para devolver `401`/`403`
  JSON y protegida por `requireAdmin`.
- No se guardan archivos ni historial de escaneos; el JSON no se persiste.
- No se exponen IP/MAC más allá de lo que ya muestra el inventario autenticado.
- Sin secretos ni variables de entorno nuevas.

## Fuera de alcance

- Cron, ping o `nmap` en el servidor.
- Estado en tiempo real, WebSocket o sondeos periódicos.
- Notificaciones push o email (van con `feat/recordatorios`).
- Historial de escaneos o de eventos; gráficas de disponibilidad.
- Resolución automática de conflictos IP/MAC o reescritura de IP por DHCP.
- Wake-on-LAN, escaneo de puertos o fingerprinting.

## Decisiones pendientes de aprobación

1. **Marcar ausentes solo dentro del CIDR y solo equipos ya vistos.** Evita
   falsos «ausente» en equipos manuales o de otras redes.
2. **Guardia contra escaneos antiguos** (`scannedAt < lastSeen` → `stale`), en
   vez de aplicar siempre el último archivo subido.
3. **Alertas sin historial**: resumen de altas/bajas al aplicar + frescura en
   la lista y la cabecera. Sin tabla de eventos ni push.
4. **Sin migración**: se reutilizan `online` y `lastSeen`.
