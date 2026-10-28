import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { jsonNoStore } from '@/lib/api-response';
import { getClientIp } from '@/lib/auth-events';
import { requireVaultAccess } from '@/lib/vault/access';
import { logVaultEvent } from '@/lib/vault/audit';
import { NONCE_BYTES } from '@/lib/vault/constants';
import {
  badRequest,
  isExactBase64,
  readJson,
  requireVaultUser,
  serverError,
  zodErrorResponse,
} from '@/lib/vault/http';
import { createAccountSchema } from '@/lib/vault/schemas';
import { validateRecipients } from '@/lib/vault/service';
import { isSealedKey } from '@/lib/vault/sharing';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const auth = await requireVaultUser();
  if (auth.response) return auth.response;
  const user = auth.user;

  const access = await requireVaultAccess(request, user);
  if (access.response) return access.response;

  const accounts = await prisma.vaultAccount.findMany({
    where: { keys: { some: { userId: user.id } } },
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      ownerId: true,
      visibility: true,
      ciphertext: true,
      nonce: true,
      revision: true,
      createdAt: true,
      updatedAt: true,
      keys: { select: { userId: true, wrappedDek: true, canEdit: true } },
    },
  });

  return jsonNoStore({
    accounts: accounts
      .map((account) => {
        const ownKey = account.keys.find((key) => key.userId === user.id);
        if (!ownKey) return null;
        return {
          id: account.id,
          ownerId: account.ownerId,
          visibility: account.visibility,
          ciphertext: account.ciphertext,
          nonce: account.nonce,
          revision: account.revision,
          canEdit: account.ownerId === user.id || ownKey.canEdit,
          wrappedDek: ownKey.wrappedDek,
          keys: account.keys.map((key) => ({
            userId: key.userId,
            canEdit: key.canEdit,
          })),
          createdAt: account.createdAt.toISOString(),
          updatedAt: account.updatedAt.toISOString(),
        };
      })
      .filter((account): account is NonNullable<typeof account> => account !== null),
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireVaultUser();
  if (auth.response) return auth.response;
  const user = auth.user;

  const access = await requireVaultAccess(request, user);
  if (access.response) return access.response;

  const parsed = createAccountSchema.safeParse(await readJson(request));
  if (!parsed.success) return zodErrorResponse(parsed.error);
  const data = parsed.data;

  if (!isExactBase64(data.nonce, NONCE_BYTES)) {
    return badRequest('El nonce de la cuenta no es válido');
  }
  if (data.keys.some((key) => !isSealedKey(key.wrappedDek))) {
    return badRequest('La clave de la cuenta no es válida');
  }

  const validation = await validateRecipients({
    ownerId: user.id,
    visibility: data.visibility,
    keys: data.keys,
  });
  if (!validation.ok) return badRequest(validation.error);

  try {
    const account = await prisma.vaultAccount.create({
      data: {
        ownerId: user.id,
        visibility: data.visibility,
        ciphertext: data.ciphertext,
        nonce: data.nonce,
        keys: {
          create: validation.keys.map((key) => ({
            userId: key.userId,
            wrappedDek: key.wrappedDek,
            canEdit: key.canEdit,
          })),
        },
      },
      select: { id: true, revision: true },
    });

    await logVaultEvent({
      userId: user.id,
      actorId: user.id,
      action: 'ACCOUNT_CREATED',
      targetId: account.id,
      ip: getClientIp(request),
    });

    return jsonNoStore({ id: account.id, revision: account.revision }, 201);
  } catch {
    return serverError();
  }
}
