import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import {
  activeMemberExists,
  canEditEvent,
  eventErrorResponse,
  eventWithPeople,
  normalizeEventDates,
} from '@/lib/events';
import { updateEventSchema } from '@/lib/schemas/event';

interface RouteContext {
  params: { id: string };
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const auth = await requireUser();
  if (auth.response) return auth.response;

  try {
    const existing = await prisma.event.findUnique({
      where: { id: params.id },
      select: { id: true, createdById: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Evento no encontrado' },
        { status: 404 },
      );
    }

    if (!canEditEvent(existing, auth.user)) {
      return NextResponse.json({ error: 'Prohibido' }, { status: 403 });
    }

    const data = updateEventSchema.parse(await request.json());

    if (data.ownerId && !(await activeMemberExists(data.ownerId))) {
      return NextResponse.json(
        { error: 'El responsable no existe o no está activo' },
        { status: 400 },
      );
    }

    const { start, end } = normalizeEventDates(data);
    const event = await prisma.event.update({
      where: { id: params.id },
      data: {
        title: data.title,
        description: data.description ?? null,
        start,
        end,
        allDay: data.allDay,
        reminderMinutes: data.reminderMinutes ?? null,
        ownerId: data.ownerId ?? null,
      },
      include: eventWithPeople,
    });

    return NextResponse.json(event);
  } catch (error) {
    return eventErrorResponse(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const auth = await requireUser();
  if (auth.response) return auth.response;

  try {
    const existing = await prisma.event.findUnique({
      where: { id: params.id },
      select: { id: true, createdById: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Evento no encontrado' },
        { status: 404 },
      );
    }

    if (!canEditEvent(existing, auth.user)) {
      return NextResponse.json({ error: 'Prohibido' }, { status: 403 });
    }

    await prisma.event.delete({ where: { id: params.id } });

    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
