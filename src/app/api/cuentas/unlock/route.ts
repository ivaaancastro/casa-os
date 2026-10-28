import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { jsonNoStore } from '@/lib/api-response';
import { getClientIp } from '@/lib/auth-events';
import { isUnlockRateLimited, logVaultEvent } from '@/lib/vault/audit';
import { issueVaultGrant, setVaultGrantCookie } from '@/lib/vault/grant';
import { UNLOCK_WINDOW_MS } from '@/lib/vault/constants';
import {
  badRequest,
  forbidden,
  isExactBase64,
  notFound,
  readJson,
  requireVaultUser,
  tooManyRequests,
  unauthorized,
  zodErrorResponse,
} from '@/lib/vault/http';
import { unlockSchema } from '@/lib/vault/schemas';
import { vaultPayload, verifyAuthKey } from '@/lib/vault/service';
import { verifySecondFactor } from '@/lib/two-factor';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const auth = await requireVaultUser();
  if (auth.response) return auth.response;
  const user = auth.user;

  const parsed = unlockSchema.safeParse(await readJson(request));
  if (!parsed.success) return zodErrorResponse(parsed.error);
  const data = parsed.data;

  if (!isExactBase64(data.authKey, 32)) {
    return badRequest('La clave de autenticación no es válida');
  }

  const vault = await prisma.vault.findUnique({
    where: { userId: user.id },
    select: {
      kdfSalt: true,
      kdfOpsLimit: true,
      kdfMemLimit: true,
      publicKey: true,
      wrappedKeyring: true,
      keyringNonce: true,
      keyringVersion: true,
      authHash: true,
      user: { select: { twoFactorEnabled: true } },
    },
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
  const authValid = secondFactor.valid
    ? await verifyAuthKey(data.authKey, vault.authHash)
    : false;

  if (!secondFactor.valid || !authValid) {
    await logVaultEvent({
      userId: user.id,
      actorId: user.id,
      action: 'UNLOCK_FAILED',
      ip: getClientIp(request),
    });
    return unauthorized('No se pudo desbloquear');
  }

  await logVaultEvent({
    userId: user.id,
    actorId: user.id,
    action: 'UNLOCK_OK',
    ip: getClientIp(request),
  });

  const { authHash: _authHash, user: _user, ...blob } = vault;
  const response = jsonNoStore({ vault: vaultPayload(blob) });
  setVaultGrantCookie(
    response,
    issueVaultGrant({
      userId: user.id,
      sessionVersion: user.sessionVersion,
      keyringVersion: vault.keyringVersion,
    }),
  );
  return response;
}
