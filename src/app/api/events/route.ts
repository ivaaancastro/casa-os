import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { requireUser } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import {
  activeMemberExists,
  eventErrorResponse,
  eventWithPeople,
  normalizeEventDates,
} from '@/lib/events';
import {
  eventInputSchema,
  listEventsQuerySchema,
} from '@/lib/schemas/event';

export async function GET(request: NextRequest) {
  const auth = await requireUser();
  if (auth.response) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const query = listEventsQuerySchema.parse({
      from: searchParams.get('from') ?? undefined,
      to: searchParams.get('to') ?? undefined,
    });

    const where: Prisma.EventWhereInput =
      query.from && query.to
        ? {
            start: { lt: new Date(query.to) },
            OR: [
              { end: { gte: new Date(query.from) } },
              { end: null, start: { gte: new Date(query.from) } },
            ],
          }
        : {};

    const events = await prisma.event.findMany({
      where,
      include: eventWithPeople,
      orderBy: { start: 'asc' },
    });

    return NextResponse.json({ events });
  } catch (error) {
    return eventErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireUser();
  if (auth.response) return auth.response;

  try {
    const data = eventInputSchema.parse(await request.json());

    if (data.ownerId && !(await activeMemberExists(data.ownerId))) {
      return NextResponse.json(
        { error: 'El responsable no existe o no está activo' },
        { status: 400 },
      );
    }

    const { start, end } = normalizeEventDates(data);
    const event = await prisma.event.create({
      data: {
        title: data.title,
        description: data.description ?? null,
        start,
        end,
        allDay: data.allDay,
        reminderMinutes: data.reminderMinutes ?? null,
        ownerId: data.ownerId ?? null,
        createdById: auth.user.id,
      },
      include: eventWithPeople,
    });

    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    return eventErrorResponse(error);
  }
}
