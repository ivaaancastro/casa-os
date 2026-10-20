# Plan — Escaneo de red e importación

**Estado:** aprobado (2026-10-20)

## Contexto

El inventario manual de dispositivos ya existe (`feat/dispositivos-crud`), pero
hay que dar de alta cada equipo a mano. El objetivo es descubrir los equipos de
la red local con `nmap`, revisar qué hay y añadir al inventario solo lo que
interese, sin duplicar IP/MAC.

## Restricción clave

`nmap` necesita estar en la misma red que los equipos y no funciona en Vercel
(serverless). Por tanto, **el escaneo se ejecuta en el ordenador del usuario**,
no en el servidor de producción. La app recibe el resultado como archivo JSON y
lo previsualiza antes de importar.

## Opciones consideradas

| Opción | Ventajas | Inconvenientes | Decisión |
|---|---|---|---|
| A. Escaneo local + subida de JSON | Sin servidor nmap, sin tokens nuevos, funciona con la app desplegada, revisión previa | Requiere ejecutar un comando y subir un archivo | **Elegida para v1** |
| B. El script publica directo en la app con token | Más cómodo; no hay que subir archivo | Token de servicio, almacenamiento del último escaneo, más superficie y configuración | Futuro |
| C. `nmap` en una API de Next.js | Un botón en la app | Imposible en Vercel y no vería la red de casa | Descartada |

## Enfoque técnico

1. **Escáner CLI** (`scripts/scan-network.ts`)
   - Validar el CIDR antes de invocar `nmap`.
   - Usar `execFile` (sin shell) para evitar inyección de comandos.
   - Parsear la salida de `nmap -sn`, incluyendo el formato con hostname:
     `Nmap scan report for router.local (192.168.1.1)`.
   - Normalizar MAC a `AA:BB:CC:DD:EE:FF`.
   - Modos: tabla humana por defecto, `--out <archivo>` para escribir JSON y
     `--json` para imprimir solo JSON (para pipes: `npm run --silent`).
   - `--cidr` opcional; si no, `NETWORK_CIDR` o `192.168.1.0/24`.
   - Añadir `scan-latest.json` a `.gitignore`.

2. **Utilidades puras** (`src/lib/utils/scan.ts`)
   - `isValidIpv4`, `isValidCidr`.
   - `parseNmapOutput(stdout)`.
   - `buildScanPayload(cidr, devices, scannedAt)`.
   - `classifyScanDevices({ devices, existing })`:
     - `new`, `existing`, `conflict`, `duplicate`, `invalid`.
     - Coincidencia por MAC normalizada y por IP.
     - Sin efectos secundarios; testeable sin BD.

3. **Esquema Zod** (`src/lib/schemas/scan.ts`)
   - Payload de importación con `version`, `scannedAt`, `cidr`, `dryRun` y
     `devices` (1–512).
   - Validación de longitudes; la validez de IP/MAC se resuelve en la
     clasificación para poder mostrar filas inválidas sin rechazar el archivo
     entero.
   - `dryRun` por defecto `true` (seguro: previsualizar sin escribir).

4. **API de importación** (`POST /api/devices/import`)
   - Solo ADMIN; 401 sin sesión y 403 para FAMILY. La ruta se excluye del
     middleware para devolver 401 JSON; el guard `requireAdmin` sigue activo.
   - `dryRun: true` → resumen y filas clasificadas, sin escribir.
   - `dryRun: false` → crea solo las filas `new` con
     `createMany({ skipDuplicates: true })`.
   - No actualiza dispositivos existentes, ni `online`/`lastSeen`.
   - No guarda el archivo ni crea una tabla de escaneos: el JSON es efímero.

5. **UI** (`ScanImportPanel` dentro de `/devices`)
   - Solo ADMIN ve “Importar escaneo”.
   - Instrucciones del comando local y selector de archivo JSON.
   - Al elegir archivo: llama a la API en `dryRun`, muestra resumen y filas.
   - Filas nuevas seleccionables; existentes/conflictos/duplicadas/inválidas
     no se importan y muestran el motivo.
   - “Importar N nuevos” → `dryRun: false`; luego `router.refresh()`.
   - Errores accesibles, responsive 390 px, FAMILY sin panel.

6. **Documentación**
   - `docs/escaneo-red.md`: requisitos, comandos, formato JSON, flujo de
     importación, privacidad, resolución de conflictos y limitaciones.
   - README, CHANGELOG, MEMORY y spec/tasks/cierre según el protocolo.

## Dependencias

- `nmap` instalado en el equipo que escanea (`brew install nmap` en macOS).
- No hay dependencias npm nuevas.
- No hay cambios de esquema ni migración: se reutiliza `Device` y sus índices
  únicos.

## Riesgos

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| `nmap` no instalado | Alta en el entorno actual | No se puede escanear | Error claro con instrucciones; tests con fixture y binario simulado; el usuario instala nmap para el escaneo real |
| MAC ausente en algunos equipos | Media | Menos deduplicación | La IP sigue siendo única; se muestra la fila y se puede importar |
| IP reutilizada por DHCP | Media | Falso “existente” o conflicto | Se muestra el dispositivo existente y el motivo; no se sobrescribe nada |
| Archivo JSON manipulado o enorme | Baja | Datos inválidos o abuso | Zod, máximo 512 filas, límites de longitud y solo ADMIN |
| Inyección de shell por CIDR | Baja | Ejecución arbitraria | `execFile` + validación estricta de CIDR |
| Importar un escaneo antiguo | Media | Inventario desactualizado | Se muestra `scannedAt`; no se toca el estado online en esta feature |

## Verificación

- Tests de parser (formatos de nmap, MAC/vendor, deduplicación), CIDR, esquema
  y clasificación.
- CLI con un `nmap` simulado en `PATH` para verificar salida JSON y errores.
- UI local: subir fixture, previsualizar, importar, recargar y ver los equipos;
  comprobar FAMILY, conflictos, duplicados, archivo inválido y móvil 390 px.
- `lint + typecheck + test + build` y CI.
- Producción: rutas protegidas y smoke autenticado con un escaneo real o
  fixture, sin dejar datos de prueba.

## Fuera de alcance

- Escaneo desde Vercel o en segundo plano.
- Publicación directa con token (opción B).
- Actualizar `online`/`lastSeen` o marcar equipos ausentes; eso corresponde a
  `feat/dispositivos-estado`.
- Actualizar MAC/nombre/tipo de dispositivos existentes.
- Escaneo de puertos, detección de sistema operativo, hostnames persistentes o
  Wake-on-LAN.
- Historial de escaneos y programación periódica.
