import { timingSafeEqual } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getVapidConfig } from '@/lib/push';
import { deliverReminder } from '@/lib/push-service';
import {
  DEFAULT_HOUSE_TIMEZONE,
  buildNotificationPayload,
  getReminderSchedule,
  isWithinDispatchWindow,
  isValidTimeZone,
  reminderTargetUserId,
} from '@/lib/reminders';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const DAY_MS = 24 * 60 * 60 * 1000;
const LOOKBACK_DAYS = 2;
const LOOKAHEAD_DAYS = 2;

function safeEqual(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: NextRequest) {
  const startedAt = Date.now();
  const cronSecret = process.env.CRON_SECRET?.trim();

  if (!cronSecret) {
    return NextResponse.json(
      { error: 'El cron no está configurado' },
      { status: 503 },
    );
  }

  const authorization = request.headers.get('authorization') ?? '';
  if (!safeEqual(authorization, `Bearer ${cronSecret}`)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const timeZone =
    process.env.HOUSE_TIMEZONE?.trim() || DEFAULT_HOUSE_TIMEZONE;

  if (!getVapidConfig() || !isValidTimeZone(timeZone)) {
    return NextResponse.json(
      { error: 'La configuración de avisos está incompleta' },
      { status: 503 },
    );
  }

  try {
    const now = new Date();
    const events = await prisma.event.findMany({
      where: {
        reminderMinutes: { not: null },
        start: {
          gte: new Date(now.getTime() - LOOKBACK_DAYS * DAY_MS),
          lte: new Date(now.getTime() + LOOKAHEAD_DAYS * DAY_MS),
        },
      },
      include: {
        owner: { select: { id: true, name: true } },
      },
      orderBy: { start: 'asc' },
    });

    let eligibleDeliveries = 0;
    let sent = 0;
    let failed = 0;
    let skipped = 0;
    let deactivated = 0;

    for (const event of events) {
      const schedule = getReminderSchedule(event, timeZone);
      if (
        !schedule ||
        !isWithinDispatchWindow(schedule.scheduledFor, now)
      ) {
        continue;
      }

      const targetUserId = reminderTargetUserId(event);
      const subscriptions = await prisma.pushSubscription.findMany({
        where: {
          active: true,
          user: targetUserId
            ? { id: targetUserId, active: true }
            : { active: true },
        },
        select: {
          id: true,
          endpoint: true,
          p256dh: true,
          auth: true,
          failureCount: true,
        },
      });

      eligibleDeliveries += subscriptions.length;
      const payload = buildNotificationPayload(event, timeZone);

      for (const subscription of subscriptions) {
        try {
          const outcome = await deliverReminder(
            event.id,
            subscription,
            schedule.scheduledFor,
            payload,
          );

          if (outcome.status === 'SENT') sent += 1;
          else if (outcome.status === 'FAILED') failed += 1;
          else skipped += 1;

          if (outcome.deactivated) deactivated += 1;
        } catch (error) {
          failed += 1;
          console.error(
            'Error al entregar un recordatorio:',
            error instanceof Error ? error.name : 'desconocido',
          );
        }
      }
    }

    return NextResponse.json(
      {
        ok: true,
        checkedEvents: events.length,
        eligibleDeliveries,
        sent,
        failed,
        skipped,
        deactivated,
        durationMs: Date.now() - startedAt,
      },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    console.error(
      'Error en el dispatch de recordatorios:',
      error instanceof Error ? error.name : 'desconocido',
    );
    return NextResponse.json(
      { error: 'No se pudieron procesar los recordatorios' },
      { status: 500 },
    );
  }
}
