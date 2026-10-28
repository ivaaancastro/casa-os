#!/usr/bin/env node
/**
 * Repara migraciones historicas que quedaron marcadas como fallidas en una
 * base de datos ya desplegada y que se eliminaron del historial de Prisma.
 *
 * Solo actua sobre una lista cerrada de migraciones conocidas. Si aparece
 * cualquier otro fallo, el build debe parar y alguien debe investigarlo: no
 * se resuelven fallos nuevos automaticamente.
 */
import { execFileSync } from 'node:child_process';
import { PrismaClient } from '@prisma/client';

const KNOWN_FAILED = [
  {
    name: '2026102820_add_password_entry',
    reason:
      'PR #31 se revirtio; la tabla PasswordEntry no forma parte del esquema final.',
  },
];

const prisma = new PrismaClient();

try {
  const [{ migrationsTable }] = await prisma.$queryRawUnsafe(
    "SELECT to_regclass('public._prisma_migrations')::text AS \"migrationsTable\"",
  );

  if (!migrationsTable) {
    console.log('[migraciones] No hay historial de Prisma todavia; nada que reparar.');
    process.exit(0);
  }

  for (const migration of KNOWN_FAILED) {
    const rows = await prisma.$queryRawUnsafe(
      'SELECT 1 FROM "_prisma_migrations" WHERE migration_name = $1 AND finished_at IS NULL AND rolled_back_at IS NULL LIMIT 1',
      migration.name,
    );

    if (rows.length === 0) {
      console.log(`[migraciones] ${migration.name}: sin fallo pendiente.`);
      continue;
    }

    console.log(
      `[migraciones] ${migration.name}: marcando como rolled-back. ${migration.reason}`,
    );
    execFileSync('npx', ['prisma', 'migrate', 'resolve', '--rolled-back', migration.name], {
      stdio: 'inherit',
      env: process.env,
    });
  }
} finally {
  await prisma.$disconnect();
}
