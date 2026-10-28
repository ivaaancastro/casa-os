import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { jsonNoStore } from '@/lib/api-response';
import { getClientIp } from '@/lib/auth-events';
import { requireVaultAccess } from '@/lib/vault/access';
import { logVaultEvent } from '@/lib/vault/audit';
import { NONCE_BYTES } from '@/lib/vault/constants';
import {
  badRequest,
  conflict,
  forbidden,
  isExactBase64,
  notFound,
  readJson,
  requireVaultUser,
  serverError,
  zodErrorResponse,
} from '@/lib/vault/http';
import { updateAccountKeysSchema } from '@/lib/vault/schemas';
import { validateRecipients } from '@/lib/vault/service';
import { isSealedKey, recipientChanges } from '@/lib/vault/sharing';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type RouteContext = { params: { id: string } };

/**
 * Reemplaza los destinatarios y rota la DEK. El cliente ya ha re-cifrado el
 * contenido con la DEK nueva; el servidor solo persiste el conjunto y los
 * blobs envueltos. Todo ocurre en una transacción.
 */
export async function PUT(request: NextRequest, { params }: RouteContext) {
  const auth = await requireVaultUser();
  if (auth.response) return auth.response;
  const user = auth.user;

  const access = await requireVaultAccess(request, user);
  if (access.response) return access.response;

  const parsed = updateAccountKeysSchema.safeParse(await readJson(request));
  if (!parsed.success) return zodErrorResponse(parsed.error);
  const data = parsed.data;

  if (!isExactBase64(data.nonce, NONCE_BYTES)) {
    return badRequest('El nonce de la cuenta no es válido');
  }
  if (data.keys.some((key) => !isSealedKey(key.wrappedDek))) {
    return badRequest('La clave de la cuenta no es válida');
  }

  const account = await prisma.vaultAccount.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      ownerId: true,
      revision: true,
      keys: { select: { userId: true } },
    },
  });

  if (!account) return notFound('Cuenta no encontrada');
  if (account.ownerId !== user.id) {
    return forbidden('Solo el dueño puede cambiar los destinatarios');
  }
  if (account.revision !== data.revision) {
    return conflict('La cuenta cambió en otro dispositivo. Recarga antes de guardar');
  }

  const validation = await validateRecipients({
    ownerId: user.id,
    visibility: data.visibility,
    keys: data.keys,
  });
  if (!validation.ok) return badRequest(validation.error);

  const changes = recipientChanges(
    account.keys.map((key) => key.userId),
    validation.keys.map((key) => key.userId),
  );

  try {
    const updated = await prisma.$transaction(async (tx) => {
      await tx.vaultAccountKey.deleteMany({ where: { accountId: account.id } });
      return tx.vaultAccount.update({
        where: { id: account.id },
        data: {
          visibility: data.visibility,
          ciphertext: data.ciphertext,
          nonce: data.nonce,
          revision: account.revision + 1,
          keys: {
            create: validation.keys.map((key) => ({
              userId: key.userId,
              wrappedDek: key.wrappedDek,
              canEdit: key.canEdit,
            })),
          },
        },
        select: { revision: true },
      });
    });

    const ip = getClientIp(request);
    await logVaultEvent({
      userId: user.id,
      actorId: user.id,
      action: 'KEY_ROTATED',
      targetId: account.id,
      ip,
    });
    for (const userId of changes.added) {
      await logVaultEvent({
        userId: user.id,
        actorId: user.id,
        action: 'SHARE_GRANTED',
        targetId: userId,
        ip,
      });
    }
    for (const userId of changes.removed) {
      await logVaultEvent({
        userId: user.id,
        actorId: user.id,
        action: 'SHARE_REVOKED',
        targetId: userId,
        ip,
      });
    }

    return jsonNoStore({ revision: updated.revision });
  } catch {
    return serverError();
  }
}
