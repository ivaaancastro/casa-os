import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/api-auth';
import { updateDeviceSchema } from '@/lib/schemas/device';
import {
  deviceConflictResponse,
  deviceErrorResponse,
  deviceWithOwner,
  findDeviceConflict,
  ownerExists,
} from '@/lib/devices';

interface RouteContext {
  params: { id: string };
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

  try {
    const data = updateDeviceSchema.parse(await request.json());

    const existing = await prisma.device.findUnique({
      where: { id: params.id },
      select: { id: true },
    });
    if (!existing) {
      return NextResponse.json(
        { error: 'Dispositivo no encontrado' },
        { status: 404 },
      );
    }

    const conflict = await findDeviceConflict({
      ip: data.ip,
      mac: data.mac,
      excludeId: params.id,
    });
    if (conflict) {
      return deviceConflictResponse(conflict, {
        ip: data.ip,
        mac: data.mac,
      });
    }

    if (
      data.ownerId !== undefined &&
      data.ownerId !== null &&
      !(await ownerExists(data.ownerId))
    ) {
      return NextResponse.json(
        { error: 'El propietario no existe' },
        { status: 400 },
      );
    }

    const device = await prisma.device.update({
      where: { id: params.id },
      data,
      include: deviceWithOwner,
    });

    return NextResponse.json(device);
  } catch (error) {
    return deviceErrorResponse(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

  try {
    const existing = await prisma.device.findUnique({
      where: { id: params.id },
      select: { id: true },
    });
    if (!existing) {
      return NextResponse.json(
        { error: 'Dispositivo no encontrado' },
        { status: 404 },
      );
    }

    await prisma.device.delete({ where: { id: params.id } });

    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
