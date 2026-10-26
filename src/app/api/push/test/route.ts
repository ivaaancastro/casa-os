import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { getVapidConfig } from '@/lib/push';
import { sendAndRecordSubscription } from '@/lib/push-service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST() {
  const auth = await requireUser();
  if (auth.response) return auth.response;

  if (!getVapidConfig()) {
    return NextResponse.json(
      { error: 'Los avisos no están configurados en el servidor' },
      { status: 503 },
    );
  }

  const subscriptions = await prisma.pushSubscription.findMany({
    where: {
      userId: auth.user.id,
      active: true,
      user: { active: true },
    },
    select: {
      id: true,
      endpoint: true,
      p256dh: true,
      auth: true,
      failureCount: true,
    },
  });

  if (subscriptions.length === 0) {
    return NextResponse.json(
      { error: 'No hay dispositivos con avisos activos' },
      { status: 400 },
    );
  }

  const payload = {
    title: 'Prueba de aviso',
    body: 'Los avisos de casa·os están activos.',
    url: '/calendario',
    tag: `test-${Date.now()}`,
    eventId: 'test',
  };

  let sent = 0;
  let failed = 0;
  let deactivated = 0;

  for (const subscription of subscriptions) {
    try {
      const result = await sendAndRecordSubscription(subscription, payload);
      if (result.sent) sent += 1;
      else failed += 1;
      if (result.deactivated) deactivated += 1;
    } catch {
      failed += 1;
    }
  }

  return NextResponse.json(
    { ok: sent > 0, sent, failed, deactivated },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
