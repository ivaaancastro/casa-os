import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { pushSubscriptionIdSchema } from '@/lib/schemas/push';

interface RouteContext {
  params: { id: string };
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const auth = await requireUser();
  if (auth.response) return auth.response;

  const parsed = pushSubscriptionIdSchema.safeParse(params.id);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Suscripción no encontrada' },
      { status: 404 },
    );
  }

  const deleted = await prisma.pushSubscription.deleteMany({
    where: {
      id: parsed.data,
      userId: auth.user.id,
    },
  });

  if (deleted.count === 0) {
    return NextResponse.json(
      { error: 'Suscripción no encontrada' },
      { status: 404 },
    );
  }

  return new NextResponse(null, { status: 204 });
}
