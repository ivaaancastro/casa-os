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
import { updateAccountSchema } from '@/lib/vault/schemas';
import { canEditAccount } from '@/lib/vault/sharing';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type RouteContext = { params: { id: string } };

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const auth = await requireVaultUser();
  if (auth.response) return auth.response;
  const user = auth.user;

  const access = await requireVaultAccess(request, user);
  if (access.response) return access.response;

  const parsed = updateAccountSchema.safeParse(await readJson(request));
  if (!parsed.success) return zodErrorResponse(parsed.error);
  const data = parsed.data;

  if (!isExactBase64(data.nonce, NONCE_BYTES)) {
    return badRequest('El nonce de la cuenta no es válido');
  }

  const account = await prisma.vaultAccount.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      ownerId: true,
      revision: true,
      keys: { where: { userId: user.id }, select: { canEdit: true } },
    },
  });

  if (!account) return notFound('Cuenta no encontrada');
  const ownKey = account.keys[0];
  if (!ownKey) return notFound('Cuenta no encontrada');

  if (!canEditAccount(account.ownerId, user.id, ownKey.canEdit)) {
    return forbidden('No puedes editar esta cuenta');
  }
  if (account.revision !== data.revision) {
    return conflict('La cuenta cambió en otro dispositivo. Recarga antes de guardar');
  }

  try {
    const updated = await prisma.vaultAccount.update({
      where: { id: account.id },
      data: {
        ciphertext: data.ciphertext,
        nonce: data.nonce,
        revision: account.revision + 1,
      },
      select: { revision: true },
    });

    await logVaultEvent({
      userId: user.id,
      actorId: user.id,
      action: 'ACCOUNT_UPDATED',
      targetId: account.id,
      ip: getClientIp(request),
    });

    return jsonNoStore({ revision: updated.revision });
  } catch {
    return serverError();
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const auth = await requireVaultUser();
  if (auth.response) return auth.response;
  const user = auth.user;

  const access = await requireVaultAccess(request, user);
  if (access.response) return access.response;

  const account = await prisma.vaultAccount.findUnique({
    where: { id: params.id },
    select: { id: true, ownerId: true },
  });

  if (!account) return notFound('Cuenta no encontrada');
  if (account.ownerId !== user.id) {
    return forbidden('Solo el dueño puede borrar esta cuenta');
  }

  try {
    await prisma.vaultAccount.delete({ where: { id: account.id } });
    await logVaultEvent({
      userId: user.id,
      actorId: user.id,
      action: 'ACCOUNT_DELETED',
      targetId: account.id,
      ip: getClientIp(request),
    });
    return jsonNoStore({ ok: true });
  } catch {
    return serverError();
  }
}
