import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { jsonNoStore } from '@/lib/api-response';
import { readJson } from '@/lib/vault/http';
import {
  clearChallengeCookie,
  parseTransports,
  readChallenge,
  verifyAuthentication,
} from '@/lib/vault/webauthn';
import { signToken } from '@/lib/vault/tokens';
import { emailRateLimitKey, recordAuthFailure } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const LOGIN_TOKEN_PURPOSE = 'casa-os:webauthn-login:v1';

export async function POST(request: NextRequest) {
  const challenge = readChallenge(request, 'login', 'authentication');
  if (!challenge) {
    return jsonNoStore({ error: 'El inicio de sesión ha caducado. Vuelve a intentarlo' }, 400);
  }

  let body: { response?: unknown } = {};
  try {
    body = (await readJson(request)) as { response?: unknown };
  } catch {
    return jsonNoStore({ error: 'JSON inválido' }, 400);
  }
  const response = body.response as { id?: string } | undefined;
  if (!response?.id) {
    return jsonNoStore({ error: 'Respuesta inválida' }, 400);
  }

  const passkey = await prisma.appPasskey.findUnique({
    where: { credentialId: response.id },
    select: {
      id: true,
      userId: true,
      credentialId: true,
      publicKey: true,
      counter: true,
      transports: true,
    },
  });
  if (!passkey) {
    return jsonNoStore({ error: 'No se pudo iniciar sesión' }, 401);
  }

  const user = await prisma.user.findUnique({
    where: { id: passkey.userId },
    select: { id: true, active: true, email: true },
  });
  if (!user?.active) {
    if (user?.email) {
      await recordAuthFailure(emailRateLimitKey(user.email));
    }
    return jsonNoStore({ error: 'No se pudo iniciar sesión' }, 401);
  }

  try {
    const newCounter = await verifyAuthentication(response as never, challenge.challenge, {
      id: passkey.credentialId,
      publicKey: Buffer.from(passkey.publicKey, 'base64'),
      counter: passkey.counter,
      transports: parseTransports(passkey.transports),
    });
    await prisma.appPasskey.update({
      where: { id: passkey.id },
      data: { counter: newCounter, lastUsedAt: new Date() },
    });

    const token = signToken(
      { userId: user.id, exp: Date.now() + 60_000 },
      LOGIN_TOKEN_PURPOSE,
    );

    const result = jsonNoStore({ token });
    clearChallengeCookie(result);
    return result;
  } catch {
    if (user?.email) {
      await recordAuthFailure(emailRateLimitKey(user.email));
    }
    return jsonNoStore({ error: 'No se pudo iniciar sesión' }, 401);
  }
}