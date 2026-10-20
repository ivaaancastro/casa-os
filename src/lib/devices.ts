import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { prisma } from './prisma';

/** Include estándar de dispositivos con su propietario. */
export const deviceWithOwner = {
  owner: { select: { id: true, name: true } },
} satisfies Prisma.DeviceInclude;

export type DeviceWithOwner = Prisma.DeviceGetPayload<{
  include: typeof deviceWithOwner;
}>;

/**
 * Busca otro dispositivo que ya use la IP o la MAC indicadas.
 *
 * `excludeId` permite editar un dispositivo conservando sus propios valores.
 */
export async function findDeviceConflict(input: {
  ip?: string | null;
  mac?: string | null;
  excludeId?: string;
}) {
  const or: Prisma.DeviceWhereInput[] = [];
  if (input.ip) or.push({ ip: input.ip });
  if (input.mac) or.push({ mac: input.mac });
  if (or.length === 0) return null;

  return prisma.device.findFirst({
    where: {
      ...(input.excludeId ? { id: { not: input.excludeId } } : {}),
      OR: or,
    },
    select: { ip: true, mac: true },
  });
}

/** Respuesta 409 indicando si el choque fue por IP o por MAC. */
export function deviceConflictResponse(
  conflict: { ip: string; mac: string | null },
  requested: { ip?: string | null; mac?: string | null },
) {
  const sameIp = Boolean(requested.ip && conflict.ip === requested.ip);

  return NextResponse.json(
    {
      error: sameIp
        ? 'Ya existe un dispositivo con esa IP'
        : 'Ya existe un dispositivo con esa MAC',
    },
    { status: 409 },
  );
}

/** El propietario debe existir (puede estar inactivo si ya estaba asignado). */
export async function ownerExists(ownerId: string): Promise<boolean> {
  const owner = await prisma.user.findUnique({
    where: { id: ownerId },
    select: { id: true },
  });
  return Boolean(owner);
}

/** Traduce errores de validación, unicidad y servidor a respuestas HTTP. */
export function deviceErrorResponse(error: unknown) {
  if (error instanceof ZodError) {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
  }

  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  ) {
    return NextResponse.json(
      { error: 'Ya existe un dispositivo con esa IP o MAC' },
      { status: 409 },
    );
  }

  return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
}
