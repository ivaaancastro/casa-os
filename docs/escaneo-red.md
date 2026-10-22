# Escaneo de red e importación

Descubre los equipos conectados a la red de casa, previsualiza el resultado,
añade al inventario solo los que quieras y actualiza su estado (en línea,
ausente y última vez visto), sin duplicar IP ni MAC.

## Por qué se escanea en local

`nmap` necesita estar en la misma red que los equipos. En Vercel (serverless) no
puede ejecutarse ni ver la red de casa, así que **el escaneo corre en tu
ordenador** y la app recibe un archivo JSON. No hay ningún botón que ejecute
`nmap` en producción.

El flujo es:

1. Ejecutas el escáner en tu equipo.
2. Subes el JSON en `/devices` como ADMIN.
3. La app previsualiza qué es nuevo, qué ya existe, qué conflictos hay y cómo
   cambiará el estado del inventario.
4. Importas los equipos nuevos que marques y aplicas el estado: los vistos
   pasan a en línea y los ausentes de esa red se marcan como ausentes.

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
4. Revisa el resumen, las filas y el bloque **Estado tras aplicar**.
5. Marca los equipos nuevos y pulsa **Importar N nuevos y actualizar estado**.
   Si no hay nuevos, el botón es **Actualizar estado**.

La previsualización no escribe nada. Al aplicar se crean las filas `new`
seleccionadas y se actualiza el estado de los equipos existentes con la fecha
del escaneo. Las demás filas se muestran con su motivo.

### Estados del escaneo

| Estado | Significado | ¿Se importa? |
|---|---|---|
| `Nuevo` | No existe ni la IP ni la MAC | Sí, si lo marcas |
| `Ya existe` | La IP o la MAC pertenece a un equipo del inventario | No, pero actualiza su estado |
| `Conflicto` | La IP es de un equipo y la MAC de otro distinto | No; no se toca el estado |
| `Duplicado` | Otra fila del mismo archivo repite IP o MAC | No |
| `Inválido` | IP o MAC no válida | No |

Los equipos importados se crean con:

- Nombre sugerido: el nombre del archivo, `<fabricante> (<IP>)` o
  `Dispositivo <IP>`.
- Tipo `Otro`; propietario y notas vacíos.
- `online = true` y `lastSeen = scannedAt`, porque el escaneo acaba de verlos.

## Estado, ausencias y última vez visto

Al aplicar un escaneo (botón de importar o **Actualizar estado**):

- Cada equipo del inventario que aparece en el archivo pasa a **En línea** y su
  «última vez visto» es la fecha del escaneo.
- Cada equipo **ya visto** cuya IP está dentro del `cidr` y que no aparece en el
  archivo pasa a **Ausente**. Conserva su última vez visto.
- Los equipos que **nunca** se han visto no se marcan ausentes: siguen como
  **Sin datos**.
- Los equipos fuera de la red escaneada no se tocan.
- Las filas en conflicto o inválidas no cambian el estado de ningún equipo.
- Si el escaneo es **anterior** a la última vez visto de un equipo, ese equipo
  se ignora y se lista como «ignorado por fecha». Así un JSON viejo no pisa
  datos más recientes.
- Sin `cidr` válido no se evalúan ausencias; solo se actualizan los vistos.
- Un escaneo vacío no se puede importar (mínimo 1 equipo). Es una protección:
  un archivo vacío no debe marcar toda la red como ausente.

La cabecera de `/devices` muestra la frescura global («Última actualización:
hace 5 min») y avisa si el dato tiene más de 24 h. El estado **no es en tiempo
real**: refleja el último escaneo aplicado.

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
| `La fecha del escaneo está en el futuro` | Revisa el reloj del equipo que escanea; se admite un margen de 5 min |
| `El CIDR no es válido` | Usa una red IPv4 con prefijo, p. ej. `192.168.1.0/24` |
| Equipos «ignorados por fecha» | El JSON es anterior a su última vez visto; genera un escaneo nuevo |

## Limitaciones y siguiente paso

- No se ejecuta desde Vercel ni en segundo plano: el estado se actualiza al
  aplicar un escaneo, no en tiempo real.
- No hay publicación directa con token; el archivo se sube a mano.
- No se guarda historial de escaneos ni de cambios de estado; las altas y bajas
  se resumen al aplicar el escaneo.
- Un escaneo sin equipos no se puede importar (protección contra marcar toda la
  red como ausente por error).
- No se escanean puertos, sistema operativo, hostnames persistentes ni se hace
  Wake-on-LAN.

La siguiente feature del roadmap es
[`feat/calendario`](../MEMORY.md), para organizar los eventos del hogar.
