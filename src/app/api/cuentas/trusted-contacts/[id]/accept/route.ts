import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { jsonNoStore } from '@/lib/api-response';
import { getClientIp } from '@/lib/auth-events';
import { requireVaultAccess } from '@/lib/vault/access';
import { logVaultEvent } from '@/lib/vault/audit';
import { conflict, notFound, requireVaultUser, serverError } from '@/lib/vault/http';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type RouteContext = { params: { id: string } };

export async function POST(request: NextRequest, { params }: RouteContext) {
  const auth = await requireVaultUser();
  if (auth.response) return auth.response;
  const user = auth.user;

  const access = await requireVaultAccess(request, user);
  if (access.response) return access.response;

  const share = await prisma.vaultRecoveryShare.findUnique({
    where: { id: params.id },
    select: { id: true, ownerId: true, contactId: true, status: true },
  });

  if (!share || share.contactId !== user.id) {
    return notFound('Invitación no encontrada');
  }
  if (share.status !== 'PENDING') {
    return conflict('La invitación ya no está pendiente');
  }

  try {
    const accepted = await prisma.vaultRecoveryShare.update({
      where: { id: share.id },
      data: { status: 'ACCEPTED', acceptedAt: new Date() },
      select: { id: true },
    });

    await logVaultEvent({
      userId: share.ownerId,
      actorId: user.id,
      action: 'CONTACT_ACCEPTED',
      targetId: share.id,
      ip: getClientIp(request),
    });

    return jsonNoStore({ id: accepted.id, status: 'ACCEPTED' });
  } catch {
    return serverError();
  }
}
