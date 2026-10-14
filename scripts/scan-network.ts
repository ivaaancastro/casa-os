/**
 * Escáner de red local para detectar dispositivos conectados.
 * 
 * Uso: npm run scan
 * 
 * Requiere que el equipo tenga permisos de red local.
 * En algunos sistemas puede requerir permisos elevados.
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface ScannedDevice {
  ip: string;
  mac?: string;
  vendor?: string;
}

async function scanNetwork(): Promise<ScannedDevice[]> {
  const cidr = process.env.NETWORK_CIDR || '192.168.1.0/24';

  console.log(`Escaneando red ${cidr}...`);

  try {
    const { stdout } = await execAsync(`nmap -sn ${cidr} -n --max-retries 1`);

    const devices: ScannedDevice[] = [];
    const lines = stdout.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const ipMatch = lines[i].match(/Nmap scan report for (\d+\.\d+\.\d+\.\d+)/);
      if (ipMatch) {
        const ip = ipMatch[1];
        const macLine = lines[i + 1] || '';
        const macMatch = macLine.match(/MAC Address:\s+([0-9A-Fa-f:]+)(?:\s+\((.+?)\))?/);

        devices.push({
          ip,
          mac: macMatch?.[1],
          vendor: macMatch?.[2],
        });
      }
    }

    console.log(`\nSe encontraron ${devices.length} dispositivos:`);
    console.table(devices);

    return devices;
  } catch (error) {
    console.error('Error al escanear la red. Asegúrate de tener nmap instalado:');
    console.error('  brew install nmap  (macOS)');
    console.error('  sudo apt install nmap  (Linux)');
    throw error;
  }
}

scanNetwork()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
