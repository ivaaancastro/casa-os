import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { jsonNoStore } from '@/lib/api-response';
import { getClientIp } from '@/lib/auth-events';
import { requireVaultAccess } from '@/lib/vault/access';
import { logVaultEvent } from '@/lib/vault/audit';
import {
  badRequest,
  readJson,
  requireVaultUser,
  serverError,
  zodErrorResponse,
} from '@/lib/vault/http';
import { createTrustedContactSchema } from '@/lib/vault/schemas';
import { isSealedKey } from '@/lib/vault/sharing';
import type { VaultContactSummary } from '@/lib/vault/types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function toSummary(
  share: {
    id: string;
    ownerId: string;
    contactId: string;
    status: string;
    createdAt: Date;
    acceptedAt: Date | null;
    owner: { name: string | null; email: string | null };
    contact: { name: string | null; email: string | null };
  },
  userId: string,
): VaultContactSummary {
  return {
    id: share.id,
    ownerId: share.ownerId,
    contactId: share.contactId,
    ownerName: share.owner.name,
    ownerEmail: share.owner.email,
    contactName: share.contact.name,
    contactEmail: share.contact.email,
    status: share.status as VaultContactSummary['status'],
    createdAt: share.createdAt.toISOString(),
    acceptedAt: share.acceptedAt?.toISOString() ?? null,
    direction: share.ownerId === userId ? 'outgoing' : 'incoming',
  };
}

export async function GET(request: NextRequest) {
  const auth = await requireVaultUser();
  if (auth.response) return auth.response;
  const user = auth.user;

  const access = await requireVaultAccess(request, user);
  if (access.response) return access.response;

  const shares = await prisma.vaultRecoveryShare.findMany({
    where: { OR: [{ ownerId: user.id }, { contactId: user.id }] },
    orderBy: { createdAt: 'desc' },
    include: {
      owner: { select: { name: true, email: true } },
      contact: { select: { name: true, email: true } },
    },
  });

  return jsonNoStore({ contacts: shares.map((share) => toSummary(share, user.id)) });
}

export async function POST(request: NextRequest) {
  const auth = await requireVaultUser();
  if (auth.response) return auth.response;
  const user = auth.user;

  const access = await requireVaultAccess(request, user);
  if (access.response) return access.response;

  const parsed = createTrustedContactSchema.safeParse(await readJson(request));
  if (!parsed.success) return zodErrorResponse(parsed.error);
  const data = parsed.data;

  if (data.contactId === user.id) {
    return badRequest('No puedes ser tu propio contacto de confianza');
  }
  if (!isSealedKey(data.wrappedRecoveryKey)) {
    return badRequest('La copia para el contacto no es válida');
  }

  const contact = await prisma.user.findUnique({
    where: { id: data.contactId },
    select: { id: true, active: true, vault: { select: { publicKey: true } } },
  });
  if (!contact?.active || !contact.vault?.publicKey) {
    return badRequest('El contacto debe estar activo y tener bóveda');
  }

  try {
    const share = await prisma.vaultRecoveryShare.upsert({
      where: {
        ownerId_contactId: { ownerId: user.id, contactId: data.contactId },
      },
      create: {
        ownerId: user.id,
        contactId: data.contactId,
        wrappedRecoveryKey: data.wrappedRecoveryKey,
        status: 'PENDING',
      },
      update: {
        wrappedRecoveryKey: data.wrappedRecoveryKey,
        status: 'PENDING',
        acceptedAt: null,
      },
      include: {
        owner: { select: { name: true, email: true } },
        contact: { select: { name: true, email: true } },
      },
    });

    await logVaultEvent({
      userId: user.id,
      actorId: user.id,
      action: 'CONTACT_INVITED',
      targetId: data.contactId,
      ip: getClientIp(request),
    });

    return jsonNoStore({ contact: toSummary(share, user.id) }, 201);
  } catch {
    return serverError();
  }
}

