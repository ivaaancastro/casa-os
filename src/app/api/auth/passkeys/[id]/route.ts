import type { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { jsonNoStore } from '@/lib/api-response';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return jsonNoStore({ error: 'No autorizado' }, 401);
  }
  const passkey = await prisma.appPasskey.findUnique({
    where: { id: params.id },
    select: { userId: true },
  });
  if (!passkey || passkey.userId !== session.user.id) {
    return jsonNoStore({ error: 'No encontrada' }, 404);
  }
  await prisma.appPasskey.delete({ where: { id: params.id } });
  return jsonNoStore({ ok: true });
}