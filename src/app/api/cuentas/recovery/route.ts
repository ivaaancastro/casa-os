import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { jsonNoStore } from '@/lib/api-response';
import { getClientIp } from '@/lib/auth-events';
import { requireVaultAccess } from '@/lib/vault/access';
import { logVaultEvent } from '@/lib/vault/audit';
import { KDF_SALT_BYTES, NONCE_BYTES } from '@/lib/vault/constants';
import {
  badRequest,
  forbidden,
  isExactBase64,
  notFound,
  readJson,
  requireVaultUser,
  serverError,
  zodErrorResponse,
} from '@/lib/vault/http';
import { updateRecoverySchema } from '@/lib/vault/schemas';
import { isSealedKey } from '@/lib/vault/sharing';
import { memberPublicKey } from '@/lib/vault/service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * El kit de recuperación se puede descargar sin grant: es precisamente lo que
 * se usa cuando no se puede desbloquear. Sin el código es un blob inútil.
 */
export async function GET() {
  const auth = await requireVaultUser();
  if (auth.response) return auth.response;

  const dbUser = await prisma.user.findUnique({
    where: { id: auth.user.id },
    select: { twoFactorEnabled: true },
  });
  if (!dbUser?.twoFactorEnabled) return forbidden('2FA requerido');

  const recovery = await prisma.vaultRecovery.findUnique({
    where: { userId: auth.user.id },
    select: {
      kdfSalt: true,
      kdfOpsLimit: true,
      kdfMemLimit: true,
      wrappedKeyring: true,
      nonce: true,
      updatedAt: true,
    },
  });

  if (!recovery) return notFound('No hay kit de recuperación');

  return jsonNoStore({
    recovery: {
      kdfSalt: recovery.kdfSalt,
      kdfOpsLimit: recovery.kdfOpsLimit,
      kdfMemLimit: recovery.kdfMemLimit,
      wrappedKeyring: recovery.wrappedKeyring,
      nonce: recovery.nonce,
      updatedAt: recovery.updatedAt.toISOString(),
    },
  });
}

export async function PUT(request: NextRequest) {
  const auth = await requireVaultUser();
  if (auth.response) return auth.response;
  const user = auth.user;

  const access = await requireVaultAccess(request, user);
  if (access.response) return access.response;

  const parsed = updateRecoverySchema.safeParse(await readJson(request));
  if (!parsed.success) return zodErrorResponse(parsed.error);
  const data = parsed.data;

  if (!isExactBase64(data.kdfSalt, KDF_SALT_BYTES)) {
    return badRequest('La sal de recuperación no es válida');
  }
  if (!isExactBase64(data.nonce, NONCE_BYTES)) {
    return badRequest('El nonce de recuperación no es válido');
  }

  const shares = data.contactShares ?? [];
  const contactIds = shares.map((share) => share.contactId);
  if (new Set(contactIds).size !== contactIds.length) {
    return badRequest('Hay contactos duplicados');
  }

  if (shares.length > 0) {
    if (contactIds.includes(user.id)) {
      return badRequest('No puedes ser tu propio contacto de confianza');
    }
    if (shares.some((share) => !isSealedKey(share.wrappedRecoveryKey))) {
      return badRequest('La copia para el contacto no es válida');
    }

    const contacts = await prisma.user.findMany({
      where: { id: { in: contactIds }, active: true, vault: { isNot: null } },
      select: { id: true, name: true, email: true, vault: { select: { publicKey: true } } },
    });

    if (contacts.length !== contactIds.length) {
      return badRequest('Algún contacto no está activo o no tiene bóveda');
    }
    if (contacts.some((contact) => !memberPublicKey(contact))) {
      return badRequest('Algún contacto no tiene clave pública');
    }
  }

  try {
    const previous = await prisma.vaultRecovery.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });

    await prisma.$transaction(async (tx) => {
      await tx.vaultRecovery.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          kdfSalt: data.kdfSalt,
          kdfOpsLimit: data.kdfOpsLimit,
          kdfMemLimit: data.kdfMemLimit,
          wrappedKeyring: data.wrappedKeyring,
          nonce: data.nonce,
        },
        update: {
          kdfSalt: data.kdfSalt,
          kdfOpsLimit: data.kdfOpsLimit,
          kdfMemLimit: data.kdfMemLimit,
          wrappedKeyring: data.wrappedKeyring,
          nonce: data.nonce,
        },
      });

      for (const share of shares) {
        await tx.vaultRecoveryShare.upsert({
          where: {
            ownerId_contactId: { ownerId: user.id, contactId: share.contactId },
          },
          create: {
            ownerId: user.id,
            contactId: share.contactId,
            wrappedRecoveryKey: share.wrappedRecoveryKey,
            status: 'PENDING',
          },
          update: {
            wrappedRecoveryKey: share.wrappedRecoveryKey,
            status: 'PENDING',
            acceptedAt: null,
          },
        });
      }

      // Cualquier copia que no se haya renovado apunta a la clave anterior.
      await tx.vaultRecoveryShare.updateMany({
        where: {
          ownerId: user.id,
          status: { not: 'REVOKED' },
          ...(contactIds.length > 0 ? { contactId: { notIn: contactIds } } : {}),
        },
        data: { status: 'STALE' },
      });
    });

    await logVaultEvent({
      userId: user.id,
      actorId: user.id,
      action: previous ? 'RECOVERY_ROTATED' : 'RECOVERY_SET',
      ip: getClientIp(request),
    });

    return jsonNoStore({ ok: true });
  } catch {
    return serverError();
  }
}
