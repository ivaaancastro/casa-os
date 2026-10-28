import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getClientIp } from '@/lib/auth-events';
import { logVaultEvent, isUnlockRateLimited } from '@/lib/vault/audit';
import { clearVaultGrantCookie, issueVaultGrant, setVaultGrantCookie } from '@/lib/vault/grant';
import {
  badRequest,
  conflict,
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
import { KDF_SALT_BYTES, NONCE_BYTES, UNLOCK_WINDOW_MS } from '@/lib/vault/constants';
import { createVaultSchema, deleteVaultSchema } from '@/lib/vault/schemas';
import {
  hashAuthKey,
  vaultPayload,
  verifyAuthKey,
} from '@/lib/vault/service';
import { verifySecondFactor } from '@/lib/two-factor';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const KEY_BYTES = 32;

export async function POST(request: NextRequest) {
  const auth = await requireVaultUser();
  if (auth.response) return auth.response;
  const user = auth.user;

  const parsed = createVaultSchema.safeParse(await readJson(request));
  if (!parsed.success) return zodErrorResponse(parsed.error);
  const data = parsed.data;

  if (!isExactBase64(data.authKey, KEY_BYTES)) {
    return badRequest('La clave de autenticación no es válida');
  }
  if (!isExactBase64(data.publicKey, KEY_BYTES)) {
    return badRequest('La clave pública no es válida');
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
  if (!dbUser?.twoFactorEnabled) {
    return forbidden('2FA requerido');
  }

  const existing = await prisma.vault.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });
  if (existing) return conflict('La bóveda ya existe');

  try {
    const authHash = await hashAuthKey(data.authKey);

    const vault = await prisma.$transaction(async (tx) => {
      const created = await tx.vault.create({
        data: {
          userId: user.id,
          kdfSalt: data.kdfSalt,
          kdfOpsLimit: data.kdfOpsLimit,
          kdfMemLimit: data.kdfMemLimit,
          authHash,
          publicKey: data.publicKey,
          wrappedKeyring: data.wrappedKeyring,
          keyringNonce: data.keyringNonce,
        },
      });

      await tx.vaultRecovery.create({
        data: {
          userId: user.id,
          kdfSalt: data.recovery.kdfSalt,
          kdfOpsLimit: data.recovery.kdfOpsLimit,
          kdfMemLimit: data.recovery.kdfMemLimit,
          wrappedKeyring: data.recovery.wrappedKeyring,
          nonce: data.recovery.nonce,
        },
      });

      return created;
    });

    await logVaultEvent({
      userId: user.id,
      actorId: user.id,
      action: 'VAULT_CREATED',
      ip: getClientIp(request),
    });

    const response = NextResponse.json({ vault: vaultPayload(vault) }, { status: 201 });
    response.headers.set('Cache-Control', 'no-store');
    setVaultGrantCookie(
      response,
      issueVaultGrant({
        userId: user.id,
        sessionVersion: user.sessionVersion,
        keyringVersion: vault.keyringVersion,
      }),
    );
    return response;
  } catch {
    return serverError();
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireVaultUser();
  if (auth.response) return auth.response;
  const user = auth.user;

  const parsed = deleteVaultSchema.safeParse(await readJson(request));
  if (!parsed.success) return zodErrorResponse(parsed.error);
  const data = parsed.data;

  if (!isExactBase64(data.authKey, KEY_BYTES)) {
    return badRequest('La clave de autenticación no es válida');
  }

  const vault = await prisma.vault.findUnique({
    where: { userId: user.id },
    select: { id: true, authHash: true, user: { select: { twoFactorEnabled: true } } },
  });
  if (!vault) return notFound('No hay bóveda');
  if (!vault.user.twoFactorEnabled) return forbidden('2FA requerido');

  if (await isUnlockRateLimited(user.id)) {
    await logVaultEvent({
      userId: user.id,
      actorId: user.id,
      action: 'RATE_LIMITED',
      ip: getClientIp(request),
    });
    return tooManyRequests(Math.ceil(UNLOCK_WINDOW_MS / 1000));
  }

  const secondFactor = await verifySecondFactor(user.id, data.code);
  const authValid = await verifyAuthKey(data.authKey, vault.authHash);
  if (!secondFactor.valid || !authValid) {
    await logVaultEvent({
      userId: user.id,
      actorId: user.id,
      action: 'UNLOCK_FAILED',
      ip: getClientIp(request),
    });
    return unauthorized('No se pudo verificar');
  }

  await prisma.$transaction([
    prisma.vaultPasskey.deleteMany({ where: { userId: user.id } }),
    prisma.vaultRecovery.deleteMany({ where: { userId: user.id } }),
    prisma.vaultRecoveryShare.deleteMany({ where: { ownerId: user.id } }),
    prisma.vaultEvent.deleteMany({ where: { userId: user.id } }),
    prisma.vault.delete({ where: { userId: user.id } }),
  ]);

  const response = new NextResponse(null, { status: 204 });
  response.headers.set('Cache-Control', 'no-store');
  clearVaultGrantCookie(response);
  return response;
}
