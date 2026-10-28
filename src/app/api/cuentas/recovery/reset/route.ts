import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { jsonNoStore } from '@/lib/api-response';
import { getClientIp } from '@/lib/auth-events';
import {
  isRecoveryRateLimited,
  logVaultEvent,
} from '@/lib/vault/audit';
import { KDF_SALT_BYTES, NONCE_BYTES, RECOVERY_WINDOW_MS } from '@/lib/vault/constants';
import { issueVaultGrant, setVaultGrantCookie } from '@/lib/vault/grant';
import {
  badRequest,
  forbidden,
  isExactBase64,
  notFound,
  readJson,
  requireVaultUser,
  serverError,
  tooManyRequests,
  unauthorized,
  zodErrorResponse,
} from '@/lib/vault/http';
import { resetRecoverySchema } from '@/lib/vault/schemas';
import { hashAuthKey, vaultPayload } from '@/lib/vault/service';
import { verifySecondFactor } from '@/lib/two-factor';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Recuperación con kit (o con el código que entrega un contacto de confianza).
 *
 * No exige grant porque el usuario ha olvidado la master password. El cliente
 * descifra el keyring con la `recoveryKey`, lo vuelve a cifrar con la nueva
 * `kek` y envía el keyring nuevo junto con un kit re-cifrado con la misma
 * `recoveryKey`. El servidor solo comprueba TOTP y persiste blobs.
 */
export async function POST(request: NextRequest) {
  const auth = await requireVaultUser();
  if (auth.response) return auth.response;
  const user = auth.user;

  const parsed = resetRecoverySchema.safeParse(await readJson(request));
  if (!parsed.success) return zodErrorResponse(parsed.error);
  const data = parsed.data;

  if (!isExactBase64(data.authKey, 32)) {
    return badRequest('La clave de autenticación no es válida');
  }
  if (!isExactBase64(data.kdfSalt, KDF_SALT_BYTES)) {
    return badRequest('La sal de derivación no es válida');
  }
  if (!isExactBase64(data.keyringNonce, NONCE_BYTES)) {
    return badRequest('El nonce del keyring no es válido');
  }
  if (!isExactBase64(data.recovery.kdfSalt, KDF_SALT_BYTES)) {
    return badRequest('La sal de recuperación no es válida');
  }
  if (!isExactBase64(data.recovery.nonce, NONCE_BYTES)) {
    return badRequest('El nonce de recuperación no es válido');
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { twoFactorEnabled: true },
  });
  if (!dbUser?.twoFactorEnabled) return forbidden('2FA requerido');

  const vault = await prisma.vault.findUnique({
    where: { userId: user.id },
    select: { id: true, keyringVersion: true },
  });
  if (!vault) return notFound('No hay bóveda');

  if (await isRecoveryRateLimited(user.id)) {
    return tooManyRequests(Math.ceil(RECOVERY_WINDOW_MS / 1000));
  }

  const secondFactor = await verifySecondFactor(user.id, data.code);
  if (!secondFactor.valid) {
    await logVaultEvent({
      userId: user.id,
      actorId: user.id,
      action: 'RECOVERY_FAILED',
      ip: getClientIp(request),
    });
    return unauthorized('No se pudo verificar');
  }

  try {
    const authHash = await hashAuthKey(data.authKey);

    const updated = await prisma.$transaction(async (tx) => {
      const next = await tx.vault.update({
        where: { userId: user.id },
        data: {
          kdfSalt: data.kdfSalt,
          kdfOpsLimit: data.kdfOpsLimit,
          kdfMemLimit: data.kdfMemLimit,
          authHash,
          wrappedKeyring: data.wrappedKeyring,
          keyringNonce: data.keyringNonce,
          keyringVersion: vault.keyringVersion + 1,
        },
      });

      await tx.vaultRecovery.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          kdfSalt: data.recovery.kdfSalt,
          kdfOpsLimit: data.recovery.kdfOpsLimit,
          kdfMemLimit: data.recovery.kdfMemLimit,
          wrappedKeyring: data.recovery.wrappedKeyring,
          nonce: data.recovery.nonce,
        },
        update: {
          kdfSalt: data.recovery.kdfSalt,
          kdfOpsLimit: data.recovery.kdfOpsLimit,
          kdfMemLimit: data.recovery.kdfMemLimit,
          wrappedKeyring: data.recovery.wrappedKeyring,
          nonce: data.recovery.nonce,
        },
      });

      // Las passkeys envuelven el keyring anterior.
      await tx.vaultPasskey.deleteMany({ where: { userId: user.id } });

      // La recoveryKey ha cambiado: las copias de los contactos quedan obsoletas.
      await tx.vaultRecoveryShare.updateMany({
        where: { ownerId: user.id, status: { not: 'REVOKED' } },
        data: { status: 'STALE' },
      });
      return next;
    });

    await logVaultEvent({
      userId: user.id,
      actorId: user.id,
      action: 'RECOVERY_USED',
      ip: getClientIp(request),
    });

    const response = jsonNoStore({ vault: vaultPayload(updated) });
    setVaultGrantCookie(
      response,
      issueVaultGrant({
        userId: user.id,
        sessionVersion: user.sessionVersion,
        keyringVersion: updated.keyringVersion,
      }),
    );
    return response;
  } catch {
    return serverError();
  }
}
