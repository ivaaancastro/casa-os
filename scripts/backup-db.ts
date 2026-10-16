/**
 * Script de backup de la base de datos.
 *
 * Uso: npm run backup
 *
 * - PostgreSQL: usa `pg_dump` (preferimos DIRECT_URL, sin pooler). En desarrollo
 *   local, si no hay `pg_dump` instalado, recurre al contenedor de Docker Compose.
 * - En la nube (Neon/Vercel) el proveedor ya ofrece copias y restauracion a un
 *   instante; este script es para copias manuales/portables.
 *
 * Crea una copia comprimida con timestamp en /backups (mantiene las ultimas 30).
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

const DOCKER_CONTAINER = 'casa-os-db';

/** Carga .env de forma minima (los scripts con tsx no lo hacen solos). */
function loadEnvFile() {
  const envPath = path.join(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) return;

  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const match = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (!match) continue;

    const key = match[1];
    let value = match[2];
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

async function dumpPostgres(url: string, outPath: string): Promise<void> {
  try {
    await execAsync(`pg_dump "${url}" > "${outPath}"`);
    return;
  } catch (error) {
    const message = String(error instanceof Error ? error.message : error);
    if (!/not found|ENOENT/i.test(message)) {
      throw error;
    }
  }

  // Fallback para desarrollo local con Docker Compose.
  console.log(`pg_dump no disponible; usando el contenedor "${DOCKER_CONTAINER}"...`);
  await execAsync(`docker exec ${DOCKER_CONTAINER} pg_dump -U casa casa_os > "${outPath}"`);
}

async function backup() {
  loadEnvFile();
  const url = process.env.DIRECT_URL || process.env.DATABASE_URL;

  if (!url) {
    console.error('Falta DIRECT_URL/DATABASE_URL.');
    process.exit(1);
  }
  if (!url.startsWith('postgres')) {
    console.error('Este proyecto usa PostgreSQL. Revisa DIRECT_URL/DATABASE_URL.');
    process.exit(1);
  }

  const backupDir = path.join(process.cwd(), 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const backupPath = path.join(backupDir, `casa-os-${timestamp}.sql`);

  console.log('Creando backup de PostgreSQL...');

  try {
    await dumpPostgres(url, backupPath);
    await execAsync(`gzip ${backupPath}`);

    const finalPath = `${backupPath}.gz`;
    console.log(`Backup creado: ${finalPath}`);

    // Limpiar backups antiguos (mantener los ultimos 30)
    const files = fs
      .readdirSync(backupDir)
      .filter((f) => f.startsWith('casa-os-') && f.endsWith('.gz'))
      .sort()
      .reverse();

    if (files.length > 30) {
      for (const oldFile of files.slice(30)) {
        fs.unlinkSync(path.join(backupDir, oldFile));
        console.log(`Backup eliminado (antiguo): ${oldFile}`);
      }
    }
  } catch (error) {
    console.error('Error creando backup:', error);
    process.exit(1);
  }
}

backup();
