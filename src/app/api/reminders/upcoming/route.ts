import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { requireUser } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import {
  DEFAULT_HOUSE_TIMEZONE,
  getReminderSchedule,
  isValidTimeZone,
} from '@/lib/reminders';
import { upcomingRemindersQuerySchema } from '@/lib/schemas/push';

export const dynamic = 'force-dynamic';

const UPCOMING_HORIZON_DAYS = 30;
const LOOKBACK_DAYS = 2;

export async function GET(request: NextRequest) {
  const auth = await requireUser();
  if (auth.response) return auth.response;

  const timeZone =
    process.env.HOUSE_TIMEZONE?.trim() || DEFAULT_HOUSE_TIMEZONE;

  if (!isValidTimeZone(timeZone)) {
    return NextResponse.json(
      { error: 'La zona horaria de la casa no es válida' },
      { status: 503 },
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const query = upcomingRemindersQuerySchema.parse({
      limit: searchParams.get('limit') ?? undefined,
    });

    const now = new Date();
    const from = new Date(
      now.getTime() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000,
    );
    const to = new Date(
      now.getTime() + UPCOMING_HORIZON_DAYS * 24 * 60 * 60 * 1000,
    );

    const events = await prisma.event.findMany({
      where: {
        reminderMinutes: { not: null },
        start: { gte: from, lte: to },
        OR: [{ ownerId: auth.user.id }, { ownerId: null }],
      },
      include: {
        owner: { select: { id: true, name: true } },
      },
      orderBy: { start: 'asc' },
    });

    const reminders = events
      .map((event) => {
        const schedule = getReminderSchedule(event, timeZone);
        if (!schedule || schedule.scheduledFor.getTime() <= now.getTime()) {
          return null;
        }

        return {
          eventId: event.id,
          title: event.title,
          allDay: event.allDay,
          start: event.start.toISOString(),
          scheduledFor: schedule.scheduledFor.toISOString(),
          owner: event.owner,
          url: schedule.url,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .sort(
        (a, b) =>
          new Date(a.scheduledFor).getTime() -
          new Date(b.scheduledFor).getTime(),
      )
      .slice(0, query.limit);

    return NextResponse.json(
      { reminders },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? 'Parámetros no válidos' },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: 'No se pudieron cargar los recordatorios' },
      { status: 500 },
    );
  }
}
