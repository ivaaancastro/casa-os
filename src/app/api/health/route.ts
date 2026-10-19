import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Estado de salud de la app (sin autenticación).
 *
 * - 200: la app responde y la base de datos está accesible.
 * - 503: la app responde pero la base de datos no.
 *
 * No expone datos: solo el estado. Útil para monitorización/uptime checks.
 */
export const dynamic = 'force-dynamic';

export async function GET() {
  const timestamp = new Date().toISOString();

  try {
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json(
      { status: 'ok', db: 'ok', timestamp },
      { status: 200, headers: { 'Cache-Control': 'no-store' } },
    );
  } catch {
    return NextResponse.json(
      { status: 'degraded', db: 'error', timestamp },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
