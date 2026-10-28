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

  const share = await prisma.vaultRecoveryShare.findUnique({
    where: { id: params.id },
    select: { id: true, ownerId: true, contactId: true },
  });

  if (!share || (share.ownerId !== user.id && share.contactId !== user.id)) {
    return notFound('Contacto no encontrado');
  }

  try {
    await prisma.vaultRecoveryShare.delete({ where: { id: share.id } });
    await logVaultEvent({
      userId: share.ownerId,
      actorId: user.id,
      action: 'CONTACT_REVOKED',
      targetId: share.contactId,
      ip: getClientIp(request),
    });
    return jsonNoStore({ ok: true });
  } catch {
    return serverError();
  }
}
