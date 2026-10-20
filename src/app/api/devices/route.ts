import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin, requireUser } from '@/lib/api-auth';
import { createDeviceSchema } from '@/lib/schemas/device';
import {
  deviceConflictResponse,
  deviceErrorResponse,
  deviceWithOwner,
  findDeviceConflict,
  ownerExists,
} from '@/lib/devices';

export async function GET() {
  const auth = await requireUser();
  if (auth.response) return auth.response;

  try {
    const devices = await prisma.device.findMany({
      include: deviceWithOwner,
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ devices });
  } catch {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

  try {
    const data = createDeviceSchema.parse(await request.json());

    const conflict = await findDeviceConflict({
      ip: data.ip,
      mac: data.mac ?? null,
    });
    if (conflict) {
      return deviceConflictResponse(conflict, {
        ip: data.ip,
        mac: data.mac ?? null,
      });
    }

    if (data.ownerId && !(await ownerExists(data.ownerId))) {
      return NextResponse.json(
        { error: 'El propietario no existe' },
        { status: 400 },
      );
    }

    const device = await prisma.device.create({
      data: {
        name: data.name,
        ip: data.ip,
        mac: data.mac ?? null,
        type: data.type,
        ownerId: data.ownerId ?? null,
        notes: data.notes ?? null,
      },
      include: deviceWithOwner,
    });

    return NextResponse.json(device, { status: 201 });
  } catch (error) {
    return deviceErrorResponse(error);
  }
}
