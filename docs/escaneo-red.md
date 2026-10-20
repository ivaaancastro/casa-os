# Escaneo de red e importación

Descubre los equipos conectados a la red de casa, previsualiza el resultado y
añade al inventario solo los que quieras, sin duplicar IP ni MAC.

## Por qué se escanea en local

`nmap` necesita estar en la misma red que los equipos. En Vercel (serverless) no
puede ejecutarse ni ver la red de casa, así que **el escaneo corre en tu
ordenador** y la app recibe un archivo JSON. No hay ningún botón que ejecute
`nmap` en producción.

El flujo es:

1. Ejecutas el escáner en tu equipo.
2. Subes el JSON en `/devices` como ADMIN.
3. La app previsualiza qué es nuevo, qué ya existe y qué conflictos hay.
4. Importas solo los equipos nuevos que marques.

## Requisitos

- `nmap` instalado en el equipo que escanea:
  - macOS: `brew install nmap`
  - Debian/Ubuntu: `sudo apt install nmap`
- Estar conectado a la red que quieres escanear.
- Permisos de red local. Si nmap no ve las MAC, revisa los permisos de red del
  sistema; el escaneo de ping suele funcionar sin `sudo`.

## Comandos

```bash
# Escaneo con tabla legible
npm run scan

# Guardar el JSON para importarlo en /devices
npm run scan -- --out scan-latest.json

# Indicar otra red (si no, NETWORK_CIDR o 192.168.1.0/24)
npm run scan -- --cidr 192.168.1.0/24 --out scan-latest.json

# JSON por stdout, sin cabecera de npm
npm run --silent scan -- --json
```

`scan-latest.json` está en `.gitignore`: contiene IP y MAC de tu red y no debe
subirse al repositorio.

### Opciones

| Opción | Descripción |
|---|---|
| `--out <archivo>` | Escribe el resultado en JSON y muestra la ruta |
| `--json` | Imprime solo el JSON por stdout |
| `--cidr <CIDR>` | Red a escanear; por defecto `NETWORK_CIDR` o `192.168.1.0/24` |
| `--help` | Muestra la ayuda |

La CIDR se valida antes de invocar nmap y el comando se ejecuta con `execFile`
(sin shell), para evitar inyección.

## Formato del archivo

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
    },
    {
      "ip": "192.168.1.30"
    }
  ]
}
```

- `devices` admite entre 1 y 512 filas.
- `mac` y `vendor` son opcionales.
- `name` es opcional; si existe, se usa como nombre sugerido.
- Las MAC se normalizan a `AA:BB:CC:DD:EE:FF`.

## Importar en la app

1. Entra en **Dispositivos** como ADMIN.
2. Pulsa **Importar escaneo**.
3. Selecciona `scan-latest.json`.
4. Revisa el resumen y las filas.
5. Marca los equipos nuevos y pulsa **Importar N nuevos**.

La previsualización no escribe nada. La importación crea solo las filas `new`
que hayas seleccionado; las demás se muestran con su motivo.

### Estados

| Estado | Significado | ¿Se importa? |
|---|---|---|
| `Nuevo` | No existe ni la IP ni la MAC | Sí, si lo marcas |
| `Ya existe` | La IP o la MAC pertenece a un equipo del inventario | No |
| `Conflicto` | La IP es de un equipo y la MAC de otro distinto | No |
| `Duplicado` | Otra fila del mismo archivo repite IP o MAC | No |
| `Inválido` | IP o MAC no válida | No |

Los equipos importados se crean con:

- Nombre sugerido: el nombre del archivo, `<fabricante> (<IP>)` o
  `Dispositivo <IP>`.
- Tipo `Otro`; propietario y notas vacíos.
- `online = false` y `lastSeen = null`.

El estado online y la última vez visto se actualizarán en
`feat/dispositivos-estado`. Esta feature **no** modifica equipos existentes ni
sobrescribe su MAC, nombre o tipo.

### Conflictos y DHCP

- Si una IP pertenece a un equipo existente pero la MAC es nueva, la fila sale
  como **Ya existe**. No se actualiza la MAC automáticamente.
- Si la MAC pertenece a un equipo pero la IP es nueva (por ejemplo, DHCP), la
  fila sale como **Ya existe**. Edita el equipo a mano si quieres corregir la IP.
- Si IP y MAC pertenecen a equipos distintos, la fila sale como **Conflicto**;
  revisa ambos equipos y resuélvelo manualmente.

## Privacidad y seguridad

- El JSON contiene IP/MAC locales; no se envía a terceros y no se guarda como
  archivo en el servidor.
- Solo ADMIN puede previsualizar e importar; FAMILY recibe `403`.
- La API valida el payload con Zod, limita a 512 filas y no escribe filas
  inválidas.
- No hay tabla de historial de escaneos ni secretos nuevos.
- El middleware deja pasar esta ruta para que el guard devuelva `401` JSON en
  vez de redirigir a login.

## Problemas frecuentes

| Problema | Solución |
|---|---|
| `nmap no está instalado` | Instálalo con el comando de la sección Requisitos |
| `CIDR no válido` | Usa una red IPv4 con prefijo, p. ej. `192.168.1.0/24` |
| No aparecen equipos | Comprueba que estás en la red correcta y que nmap tiene permisos |
| Faltan MAC | Algunos equipos o adaptadores no exponen la MAC; se puede importar por IP |
| El archivo no contiene dispositivos | El escaneo no encontró hosts; revisa la red o el comando |
| `Datos del escaneo no válidos` | JSON mal formado, versión distinta de 1 o más de 512 filas |

## Limitaciones y siguiente paso

- No se ejecuta desde Vercel ni en segundo plano.
- No hay publicación directa con token; el archivo se sube a mano.
- No se actualizan `online`/`lastSeen` ni se detectan equipos ausentes.
- No se escanean puertos, sistema operativo, hostnames persistentes ni se hace
  Wake-on-LAN.
- No se guarda historial de escaneos.

La siguiente feature del roadmap es
[`feat/dispositivos-estado`](../MEMORY.md), para reflejar el estado real de los
equipos.
