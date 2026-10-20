# Spec — Escaneo de red e importación

**Estado:** aprobada por el usuario (2026-10-20)

## Objetivo

Descubrir los equipos conectados a la red local con `nmap`, previsualizar el
resultado en `/devices` y añadir al inventario los equipos nuevos, sin duplicar
IP/MAC ni sobrescribir dispositivos existentes.

## Decisión de alcance

El escaneo se ejecuta **en el ordenador del usuario**, porque `nmap` no puede
correr en Vercel ni ver la red de casa desde la nube. El flujo es:

1. El usuario ejecuta `npm run scan -- --out scan-latest.json` en su equipo.
2. Sube el JSON en `/devices` → *Importar escaneo*.
3. La app muestra una previsualización; el usuario importa solo los equipos
   nuevos que seleccione.

No habrá un botón que ejecute `nmap` en producción. La publicación directa con
token queda fuera de esta entrega.

## Requisitos funcionales

### RF1 — Escáner local

- `npm run scan` ejecuta `nmap -sn <CIDR>` y muestra una tabla legible.
- `npm run scan -- --out scan-latest.json` escribe el JSON y muestra la ruta.
- `npm run scan -- --json` imprime solo el JSON por stdout. `npm run` añade su
  propia cabecera; para pipes usar `npm run --silent scan -- --json`.
- `--cidr <CIDR>` permite indicar la red; si no, se usa `NETWORK_CIDR` o
  `192.168.1.0/24`.
- El CIDR se valida antes de ejecutar `nmap`.
- Se usa `execFile`, no un shell, para evitar inyección de comandos.
- Si `nmap` no está instalado, el error explica cómo instalarlo y sale con
  código distinto de cero.
- La salida soporta:
  - `Nmap scan report for 192.168.1.1`
  - `Nmap scan report for router.local (192.168.1.1)`
  - `MAC Address: AA:BB:CC:DD:EE:FF (Apple, Inc.)`
  - equipos sin MAC.
- Las MAC se normalizan a `AA:BB:CC:DD:EE:FF`.
- Los resultados se deduplican por IP y por MAC dentro del mismo escaneo.
- `scan-latest.json` está en `.gitignore`.

### RF2 — Formato del archivo

```json
{
  "version": 1,
  "scannedAt": "2026-10-20T18:00:00.000Z",
  "cidr": "192.168.1.0/24",
  "devices": [
    {
      "ip": "192.168.1.20",
      "mac": "AA:BB:CC:DD:EE:FF",
      "vendor": "Apple, Inc."
    }
  ]
}
```

- `version` es opcional; si existe, debe ser `1`.
- `scannedAt` y `cidr` son informativos.
- `devices` es obligatorio, entre 1 y 512 elementos.
- `ip` es obligatoria (se valida en la clasificación).
- `mac` y `vendor` son opcionales.
- `name` opcional: si viene, se usa como nombre sugerido.

### RF3 — Previsualización sin escribir

- La UI envía el archivo a `POST /api/devices/import` con `dryRun: true`.
- La API responde con un resumen y una fila por dispositivo:
  - `new` — no existe ni la IP ni la MAC.
  - `existing` — la IP o la MAC pertenece al mismo dispositivo existente.
  - `conflict` — la IP pertenece a un dispositivo y la MAC a otro distinto.
  - `duplicate` — otra fila del mismo archivo repite IP o MAC.
  - `invalid` — IP o MAC no válida.
- Solo `new` se puede importar.
- No se escribe nada en base de datos durante la previsualización.

### RF4 — Importación

- La UI envía solo las filas `new` seleccionadas con `dryRun: false`.
- La API vuelve a clasificar contra el inventario actual y crea las que siguen
  siendo `new`.
- Se usa `createMany({ skipDuplicates: true })` para tolerar duplicados
  concurrentes.
- Nombre por defecto:
  1. `name` del archivo, si existe.
  2. `<vendor> (<ip>)`, si hay vendor.
  3. `Dispositivo <ip>`.
  - Se recorta a 80 caracteres.
- `type`: `OTHER`.
- `ownerId`, `notes`: `null`.
- `online`: `false`; `lastSeen`: `null` (los gestionará
  `feat/dispositivos-estado`).
- No se actualizan dispositivos existentes.
- La UI refresca la lista y muestra cuántos se crearon y cuántos se omitieron.

## API

### `POST /api/devices/import`

- **Auth:** sesión ADMIN. `401` sin sesión; `403` para FAMILY. La ruta está
  excluida del middleware de NextAuth para que el guard devuelva JSON en vez de
  redirigir a login; sigue protegida por `requireAdmin`.
- **Body:**

```json
{
  "version": 1,
  "scannedAt": "2026-10-20T18:00:00.000Z",
  "cidr": "192.168.1.0/24",
  "dryRun": true,
  "devices": [
    { "ip": "192.168.1.20", "mac": "AA:BB:CC:DD:EE:FF", "vendor": "Apple" }
  ]
}
```

- `dryRun` por defecto `true`. Para escribir hay que enviar `false`
  explícitamente.
- **Respuesta `200` (dry run):**

```json
{
  "dryRun": true,
  "summary": {
    "total": 2,
    "new": 1,
    "existing": 1,
    "conflict": 0,
    "duplicate": 0,
    "invalid": 0,
    "created": 0,
    "skipped": 0
  },
  "items": [
    {
      "index": 0,
      "ip": "192.168.1.20",
      "mac": "AA:BB:CC:DD:EE:FF",
      "vendor": "Apple",
      "suggestedName": "Apple (192.168.1.20)",
      "status": "new",
      "reason": "No existe en el inventario",
      "existingDevice": null,
      "ipDevice": null,
      "macDevice": null
    }
  ]
}
```

- **Respuesta al importar:** `201` si creó al menos uno; `200` si no creó
  ninguno. Incluye `created`, `skipped` y el mismo `summary`/`items`.
- **Errores:** `400` payload inválido; `401`; `403`; `500`.
- `reason` e interfaz en español.

## Clasificación

1. Validar IP (IPv4) y MAC (si existe). Si falla → `invalid`.
2. Normalizar MAC antes de comparar.
3. Si la IP o la MAC ya apareció en una fila válida anterior del archivo →
   `duplicate`.
4. Buscar dispositivo por IP y por MAC en el inventario:
   - ambos y mismo `id` → `existing`.
   - ambos y distinto `id` → `conflict` (se muestran los dos).
   - solo uno → `existing`.
   - ninguno → `new`.
5. Sin MAC, solo se compara por IP.

Los empates y conflictos no se resuelven automáticamente: el usuario debe
editar el inventario o descartar la fila.

## UI

### `/devices`

- El ADMIN ve dos acciones: **Añadir dispositivo** e **Importar escaneo**.
- FAMILY no ve ninguna de las dos.
- *Importar escaneo* abre un panel editorial con:
  - Texto: el escaneo se ejecuta en el ordenador, no en Vercel.
  - Comando copiable: `npm run scan -- --out scan-latest.json`.
  - Selector de archivo `application/json,.json`.
  - Estado de carga y errores con `role="alert"`.
- Tras leer el archivo:
  - Se muestra `scannedAt` y `cidr` si vienen.
  - Resumen: total, nuevos, existentes, conflictos, duplicados, inválidos.
  - Lista responsive por fila: IP, MAC, vendor, nombre sugerido, estado y
    motivo.
  - Las filas `new` tienen checkbox, marcadas por defecto.
  - Las demás no son importables y muestran el dispositivo existente o el
    motivo.
  - Botón **Importar N nuevos** deshabilitado si N = 0 o hay una petición en
    curso.
- Al importar:
  - Se envían solo las filas seleccionadas.
  - Se muestra el resultado (`N importados · M omitidos`).
  - `router.refresh()` actualiza el inventario.
  - Se puede cerrar el panel; el input se limpia.
- Archivo inválido, JSON roto, demasiadas filas o error de red → mensaje claro.
- Sin overflow horizontal a 390 px.

## Modelo de datos

Sin cambios. Se reutiliza `Device`:

- `ip` y `mac` ya son únicas.
- La importación crea filas nuevas; no hay tabla de escaneos ni historial.
- El archivo JSON es efímero: se procesa en memoria y no se guarda.

## Seguridad y privacidad

- Solo ADMIN puede previsualizar/importar (`requireAdmin`).
- El archivo contiene IP/MAC locales: no se sube a terceros, solo a la propia
  API; no se persiste como archivo.
- Límite de 512 filas y longitudes máximas.
- `execFile` + CIDR validado: sin inyección de shell.
- No se registran MAC/IP en logs del servidor.
- No hay secretos nuevos ni tokens.

## Tests

- `tests/scan.test.ts`:
  - CIDR válido/inválido.
  - Parser con IP sola, hostname + IP, MAC/vendor, sin MAC, varios equipos y
    líneas malformadas.
  - Normalización de MAC y deduplicación.
  - `classifyScanDevices`: new, existing por IP, existing por MAC, conflict,
    duplicate, invalid, nombre sugerido.
- `tests/api/scan.schemas.test.ts`:
  - Payload válido y `dryRun` por defecto `true`.
  - 512 permitido; 513 rechazado.
  - `devices` vacío rechazado.
  - `version` distinta de 1 rechazada.
  - `dryRun: false` aceptado.
- Verificación manual de API/UI con un fixture y con un `nmap` simulado.
- Si `nmap` está instalado, escaneo real; si no, se documenta la limitación.

## Criterios de aceptación

1. `npm run scan -- --out scan-latest.json` valida el CIDR, invoca `nmap` sin
   shell, escribe el JSON con `version`, `scannedAt`, `cidr` y `devices`, y
   falla con un mensaje claro si `nmap` no está instalado.
2. El parser soporta los formatos de nmap indicados y normaliza/deduplica.
3. Un ADMIN sube el JSON, ve la previsualización y no se escribe nada hasta
   pulsar importar.
4. La clasificación distingue `new`, `existing`, `conflict`, `duplicate` e
   `invalid`; solo se importan `new`.
5. Importar crea los equipos con nombre por defecto, IP/MAC correctas y
   `type = OTHER`; no modifica existentes ni `online`/`lastSeen`.
6. El endpoint exige ADMIN (`401/403`), valida el payload (`400`) y respeta el
   máximo de 512.
7. FAMILY no ve el panel y no puede llamar a la API.
8. Archivo inválido y errores de red se muestran con `role="alert"`; móvil
   390 px sin overflow.
9. `npm run lint`, `npm run typecheck`, `npm run test` y `npm run build` pasan;
   CI verde.
10. Producción: `/devices` protegida, importación autenticada verificada sin
    dejar datos de prueba; documentación y cierre actualizados.

## Fuera de alcance

- Ejecutar `nmap` en Vercel o desde un botón en producción.
- Publicación directa con token o agente en segundo plano.
- Actualizar `online`/`lastSeen`, detectar equipos ausentes o alertas.
- Actualizar nombre, MAC, tipo o propietario de dispositivos existentes.
- Persistir historial de escaneos o programar escaneos.
- Escaneo de puertos, sistema operativo, hostnames o Wake-on-LAN.
