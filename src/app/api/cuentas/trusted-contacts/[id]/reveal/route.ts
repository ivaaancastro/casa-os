import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { jsonNoStore } from '@/lib/api-response';
import { getClientIp } from '@/lib/auth-events';
import { requireVaultAccess } from '@/lib/vault/access';
import { logVaultEvent } from '@/lib/vault/audit';
import { conflict, notFound, requireVaultUser } from '@/lib/vault/http';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type RouteContext = { params: { id: string } };

/**
 * Devuelve la `recoveryKey` del dueño envuelta para el contacto. El servidor
 * no puede abrirla; solo la entrega al contacto aceptado y lo audita.
 */
export async function POST(request: NextRequest, { params }: RouteContext) {
  const auth = await requireVaultUser();
  if (auth.response) return auth.response;
  const user = auth.user;

  const access = await requireVaultAccess(request, user);
  if (access.response) return access.response;

  const share = await prisma.vaultRecoveryShare.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      ownerId: true,
      contactId: true,
      status: true,
      wrappedRecoveryKey: true,
      owner: { select: { name: true, email: true } },
    },
  });

  if (!share || share.contactId !== user.id) {
    return notFound('Contacto no encontrado');
  }
  if (share.status === 'STALE') {
    return conflict('La copia está obsoleta. Pide al dueño que la renueve');
  }
  if (share.status !== 'ACCEPTED') {
    return conflict('La invitación todavía no está aceptada');
  }

  await logVaultEvent({
    userId: share.ownerId,
    actorId: user.id,
    action: 'CONTACT_REVEALED',
    targetId: share.id,
    ip: getClientIp(request),
  });

  return jsonNoStore({
    wrappedRecoveryKey: share.wrappedRecoveryKey,
    ownerName: share.owner.name,
    ownerEmail: share.owner.email,
  });
}
