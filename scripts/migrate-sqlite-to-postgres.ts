/**
 * Vuelca los datos de la antigua base SQLite (prisma/dev.db) a PostgreSQL.
 *
 * Uso: npm run db:migrate-data
 *
 * - Lee el SQLite con `node:sqlite` (nativo, sin dependencias) y escribe con Prisma.
 * - Es idempotente: usa `upsert` por clave, así que reejecutarlo no duplica filas.
 * - Preserva ids y relaciones (orden: User -> Account/Session/Note/Device).
 *
 * Ruta del SQLite configurable con SQLITE_PATH (por defecto prisma/dev.db).
 */

import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const sqlitePath = process.env.SQLITE_PATH
  ? path.resolve(process.env.SQLITE_PATH)
  : path.join(process.cwd(), 'prisma', 'dev.db');

type Row = Record<string, unknown>;

function all(db: DatabaseSync, sql: string): Row[] {
  return db.prepare(sql).all() as Row[];
}

// En SQLite, Prisma guarda Boolean como 0/1 y DateTime como milisegundos (INTEGER).
const toBool = (v: unknown): boolean => v === 1 || v === true;
const toDate = (v: unknown): Date => new Date(Number(v));
const toDateOrNull = (v: unknown): Date | null =>
  v === null || v === undefined ? null : new Date(Number(v));
const toStrOrNull = (v: unknown): string | null =>
  v === null || v === undefined ? null : String(v);
const toIntOrNull = (v: unknown): number | null =>
  v === null || v === undefined ? null : Number(v);

async function main() {
  if (!fs.existsSync(sqlitePath)) {
    throw new Error(`No se encuentra la base SQLite: ${sqlitePath}`);
  }

  const db = new DatabaseSync(sqlitePath);
  const counts = {
    users: 0,
    accounts: 0,
    sessions: 0,
    verificationTokens: 0,
    notes: 0,
    devices: 0,
  };

  for (const r of all(db, 'SELECT * FROM User')) {
    await prisma.user.upsert({
      where: { id: String(r.id) },
      update: {},
      create: {
        id: String(r.id),
        name: toStrOrNull(r.name),
        email: toStrOrNull(r.email),
        emailVerified: toDateOrNull(r.emailVerified),
        password: toStrOrNull(r.password),
        image: toStrOrNull(r.image),
        role: r.role ? String(r.role) : 'FAMILY',
        active: r.active === null || r.active === undefined ? true : toBool(r.active),
        createdAt: toDate(r.createdAt),
        updatedAt: toDate(r.updatedAt),
      },
    });
    counts.users++;
  }

  for (const r of all(db, 'SELECT * FROM Account')) {
    await prisma.account.upsert({
      where: { id: String(r.id) },
      update: {},
      create: {
        id: String(r.id),
        userId: String(r.userId),
        type: String(r.type),
        provider: String(r.provider),
        providerAccountId: String(r.providerAccountId),
        refresh_token: toStrOrNull(r.refresh_token),
        access_token: toStrOrNull(r.access_token),
        expires_at: toIntOrNull(r.expires_at),
        token_type: toStrOrNull(r.token_type),
        scope: toStrOrNull(r.scope),
        id_token: toStrOrNull(r.id_token),
        session_state: toStrOrNull(r.session_state),
      },
    });
    counts.accounts++;
  }

  for (const r of all(db, 'SELECT * FROM Session')) {
    await prisma.session.upsert({
      where: { id: String(r.id) },
      update: {},
      create: {
        id: String(r.id),
        sessionToken: String(r.sessionToken),
        userId: String(r.userId),
        expires: toDate(r.expires),
      },
    });
    counts.sessions++;
  }

  for (const r of all(db, 'SELECT * FROM VerificationToken')) {
    const identifier = String(r.identifier);
    const token = String(r.token);
    await prisma.verificationToken.upsert({
      where: { identifier_token: { identifier, token } },
      update: {},
      create: { identifier, token, expires: toDate(r.expires) },
    });
    counts.verificationTokens++;
  }

  for (const r of all(db, 'SELECT * FROM Note')) {
    await prisma.note.upsert({
      where: { id: String(r.id) },
      update: {},
      create: {
        id: String(r.id),
        title: String(r.title ?? ''),
        content: String(r.content ?? ''),
        type: r.type ? String(r.type) : 'SHOPPING',
        completed: toBool(r.completed),
        authorId: String(r.authorId),
        createdAt: toDate(r.createdAt),
        updatedAt: toDate(r.updatedAt),
      },
    });
    counts.notes++;
  }

  for (const r of all(db, 'SELECT * FROM Device')) {
    await prisma.device.upsert({
      where: { id: String(r.id) },
      update: {},
      create: {
        id: String(r.id),
        name: String(r.name),
        ip: String(r.ip),
        mac: toStrOrNull(r.mac),
        type: r.type ? String(r.type) : 'OTHER',
        online: toBool(r.online),
        lastSeen: toDateOrNull(r.lastSeen),
        notes: toStrOrNull(r.notes),
        ownerId: toStrOrNull(r.ownerId),
        createdAt: toDate(r.createdAt),
        updatedAt: toDate(r.updatedAt),
      },
    });
    counts.devices++;
  }

  db.close();

  console.log('Migración completada (upsert idempotente):', counts);
}

main()
  .catch((error) => {
    console.error('Error en la migración:', error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
