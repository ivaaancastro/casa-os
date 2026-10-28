import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { jsonNoStore } from '@/lib/api-response';
import { getClientIp } from '@/lib/auth-events';
import { requireVaultAccess } from '@/lib/vault/access';
import { logVaultEvent } from '@/lib/vault/audit';
import { notFound, requireVaultUser, serverError } from '@/lib/vault/http';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type RouteContext = { params: { id: string } };

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const auth = await requireVaultUser();
  if (auth.response) return auth.response;
  const user = auth.user;

  const access = await requireVaultAccess(request, user);
  if (access.response) return access.response;

  const passkey = await prisma.vaultPasskey.findUnique({
    where: { id: params.id },
    select: { id: true, userId: true },
  });

  if (!passkey || passkey.userId !== user.id) return notFound('Passkey no encontrada');

  try {
    await prisma.vaultPasskey.delete({ where: { id: passkey.id } });
    await logVaultEvent({
      userId: user.id,
      actorId: user.id,
      action: 'PASSKEY_REMOVED',
      targetId: passkey.id,
      ip: getClientIp(request),
    });
    return jsonNoStore({ ok: true });
  } catch {
    return serverError();
  }
}
