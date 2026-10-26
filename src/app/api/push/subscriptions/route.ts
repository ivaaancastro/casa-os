import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { requireUser } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { getVapidConfig } from '@/lib/push';
import { pushSubscriptionSchema } from '@/lib/schemas/push';

export const dynamic = 'force-dynamic';

export async function GET() {
  const auth = await requireUser();
  if (auth.response) return auth.response;

  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId: auth.user.id },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      userAgent: true,
      active: true,
      createdAt: true,
      lastSuccessAt: true,
      lastFailureAt: true,
    },
  });

  return NextResponse.json(
    { subscriptions },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}

export async function POST(request: NextRequest) {
  const auth = await requireUser();
  if (auth.response) return auth.response;

  if (!getVapidConfig()) {
    return NextResponse.json(
      { error: 'Los avisos no están configurados en el servidor' },
      { status: 503 },
    );
  }

  try {
    const data = pushSubscriptionSchema.parse(await request.json());
    const userAgent = request.headers.get('user-agent')?.slice(0, 512) ?? null;

    const subscription = await prisma.pushSubscription.upsert({
      where: { endpoint: data.endpoint },
      create: {
        userId: auth.user.id,
        endpoint: data.endpoint,
        p256dh: data.keys.p256dh,
        auth: data.keys.auth,
        userAgent,
      },
      update: {
        userId: auth.user.id,
        p256dh: data.keys.p256dh,
        auth: data.keys.auth,
        userAgent,
        active: true,
        failureCount: 0,
        lastFailureAt: null,
      },
      select: { id: true, active: true },
    });

    return NextResponse.json(subscription, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? 'Datos no válidos' },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: 'No se pudo guardar el dispositivo' },
      { status: 500 },
    );
  }
}
