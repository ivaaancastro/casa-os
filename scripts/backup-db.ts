/**
 * Script de backup de la base de datos SQLite.
 * 
 * Uso: npm run backup
 * 
 * Crea una copia comprimida con timestamp en /backups
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

async function backup() {
  const dbPath = process.env.DATABASE_URL?.replace('file:', '') || 'prisma/dev.db';
  const backupDir = path.join(process.cwd(), 'backups');

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const backupPath = path.join(backupDir, `casa-os-${timestamp}.db`);

  console.log(`Creando backup de ${dbPath}...`);

  try {
    await execAsync(`cp ${dbPath} ${backupPath}`);
    await execAsync(`gzip ${backupPath}`);

    const finalPath = `${backupPath}.gz`;
    console.log(`Backup creado: ${finalPath}`);

    // Limpiar backups antiguos (mantener últimos 30)
    const files = fs.readdirSync(backupDir)
      .filter(f => f.startsWith('casa-os-') && f.endsWith('.gz'))
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
