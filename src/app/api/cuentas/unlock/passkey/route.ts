import type { NextRequest } from 'next/server';
import type { AuthenticationResponseJSON } from '@simplewebauthn/server';
import { prisma } from '@/lib/prisma';
import { jsonNoStore } from '@/lib/api-response';
import { getClientIp } from '@/lib/auth-events';
import { isUnlockRateLimited, logVaultEvent } from '@/lib/vault/audit';
import { UNLOCK_WINDOW_MS } from '@/lib/vault/constants';
import { issueVaultGrant, setVaultGrantCookie } from '@/lib/vault/grant';
import {
  forbidden,
  notFound,
  readJson,
  requireVaultUser,
  tooManyRequests,
  unauthorized,
  zodErrorResponse,
} from '@/lib/vault/http';
import { passkeyUnlockSchema } from '@/lib/vault/schemas';
import { vaultPayload } from '@/lib/vault/service';
import { verifySecondFactor } from '@/lib/two-factor';
import {
  clearChallengeCookie,
  parseTransports,
  readChallenge,
  verifyAuthentication,
} from '@/lib/vault/webauthn';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const auth = await requireVaultUser();
  if (auth.response) return auth.response;
  const user = auth.user;

  const parsed = passkeyUnlockSchema.safeParse(await readJson(request));
  if (!parsed.success) return zodErrorResponse(parsed.error);
  const data = parsed.data;

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

  const response = data.response as unknown as AuthenticationResponseJSON;
  const passkey = await prisma.vaultPasskey.findUnique({
    where: { credentialId: response.id },
    select: {
      id: true,
      userId: true,
      credentialId: true,
      publicKey: true,
      counter: true,
      transports: true,
      prfSalt: true,
      wrappedKeyring: true,
      nonce: true,
    },
  });

  const challenge = readChallenge(request, user.id, 'authentication');
  if (!passkey || passkey.userId !== user.id || !challenge) {
    await logVaultEvent({
      userId: user.id,
      actorId: user.id,
      action: 'UNLOCK_FAILED',
      ip: getClientIp(request),
    });
    return unauthorized('No se pudo desbloquear');
  }

  let newCounter: number;
  try {
    newCounter = await verifyAuthentication(
      response,
      challenge.challenge,
      {
        id: passkey.credentialId,
        publicKey: Buffer.from(passkey.publicKey, 'base64'),
        counter: passkey.counter,
        transports: parseTransports(passkey.transports),
      },
    );
  } catch {
    await logVaultEvent({
      userId: user.id,
      actorId: user.id,
      action: 'UNLOCK_FAILED',
      ip: getClientIp(request),
    });
    return unauthorized('No se pudo desbloquear');
  }

  const secondFactor = await verifySecondFactor(user.id, data.code);
  if (!secondFactor.valid) {
    await logVaultEvent({
      userId: user.id,
      actorId: user.id,
      action: 'UNLOCK_FAILED',
      ip: getClientIp(request),
    });
    return unauthorized('No se pudo desbloquear');
  }

  await prisma.vaultPasskey.update({
    where: { id: passkey.id },
    data: { counter: newCounter, lastUsedAt: new Date() },
  });

  await logVaultEvent({
    userId: user.id,
    actorId: user.id,
    action: 'UNLOCK_OK',
    ip: getClientIp(request),
  });

  const result = jsonNoStore({
    vault: {
      ...vaultPayload(vault),
      passkeyKeyring: {
        wrappedKeyring: passkey.wrappedKeyring,
        nonce: passkey.nonce,
      },
    },
  });
  setVaultGrantCookie(
    result,
    issueVaultGrant({
      userId: user.id,
      sessionVersion: user.sessionVersion,
      keyringVersion: vault.keyringVersion,
    }),
  );
  clearChallengeCookie(result);
  return result;
}
