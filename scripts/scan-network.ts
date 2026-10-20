/**
 * Escáner de red local para detectar dispositivos conectados.
 *
 * Uso:
 *   npm run scan
 *   npm run scan -- --out scan-latest.json
 *   npm run scan -- --json
 *   npm run scan -- --cidr 192.168.1.0/24
 *
 * Requiere nmap instalado en el equipo que escanea. No se ejecuta en Vercel:
 * el resultado se sube a /devices para previsualizarlo e importarlo.
 */

import { execFile } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { promisify } from 'node:util';
import {
  buildScanPayload,
  isValidCidr,
  parseNmapOutput,
} from '../src/lib/utils/scan';

const execFileAsync = promisify(execFile);

interface CliOptions {
  cidr?: string;
  out?: string;
  json: boolean;
  help: boolean;
}

interface NmapError extends Error {
  code?: string;
  stderr?: string;
}

function printHelp() {
  console.log(`Uso: npm run scan -- [opciones]

Opciones:
  --out <archivo>   Guarda el resultado en un JSON para subirlo a /devices
  --json            Imprime solo el JSON por stdout
  --cidr <CIDR>     Red a escanear (por defecto NETWORK_CIDR o 192.168.1.0/24)
  --help            Muestra esta ayuda

Ejemplo:
  npm run scan -- --out scan-latest.json`);
}

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = { json: false, help: false };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--json') {
      options.json = true;
      continue;
    }

    if (arg === '--help' || arg === '-h') {
      options.help = true;
      continue;
    }

    if (arg === '--out' || arg === '--cidr') {
      const value = argv[index + 1];
      if (!value || value.startsWith('--')) {
        throw new Error(`Falta el valor de ${arg}`);
      }

      if (arg === '--out') options.out = value;
      else options.cidr = value;

      index += 1;
      continue;
    }

    throw new Error(`Opción no reconocida: ${arg}`);
  }

  return options;
}

async function run() {
  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    printHelp();
    return;
  }

  const cidr = (
    options.cidr ??
    process.env.NETWORK_CIDR ??
    '192.168.1.0/24'
  ).trim();

  if (!isValidCidr(cidr)) {
    throw new Error(
      `CIDR no válido: "${cidr}". Ejemplo: 192.168.1.0/24`,
    );
  }

  console.error(`Escaneando red ${cidr}...`);

  const { stdout } = await execFileAsync(
    'nmap',
    ['-sn', cidr, '-n', '--max-retries', '1'],
    { maxBuffer: 2 * 1024 * 1024 },
  );

  const devices = parseNmapOutput(stdout);
  const payload = buildScanPayload(cidr, devices);

  if (options.out) {
    writeFileSync(options.out, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  }

  if (options.json) {
    console.log(JSON.stringify(payload, null, 2));
    return;
  }

  console.log(`Red: ${cidr}`);
  console.log(`Dispositivos encontrados: ${devices.length}`);

  if (devices.length > 0) {
    console.table(
      devices.map((device) => ({
        IP: device.ip,
        MAC: device.mac ?? '—',
        Fabricante: device.vendor ?? '—',
      })),
    );
  } else {
    console.log('No se encontró ningún dispositivo.');
  }

  if (options.out) {
    console.log(`\nJSON guardado en ${options.out}`);
    console.log('Súbelo en /devices → Importar escaneo (solo ADMIN).');
  } else {
    console.log(
      '\nPara importarlo: npm run scan -- --out scan-latest.json y súbelo en /devices.',
    );
  }
}

run().catch((error: NmapError) => {
  if (error.code === 'ENOENT') {
    console.error(
      'nmap no está instalado. En macOS: brew install nmap. En Debian/Ubuntu: sudo apt install nmap.',
    );
  } else if (error.stderr?.trim()) {
    console.error(error.stderr.trim());
  } else {
    console.error(error.message);
  }

  process.exit(1);
});
