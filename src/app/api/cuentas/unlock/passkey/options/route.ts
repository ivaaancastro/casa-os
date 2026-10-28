import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { jsonNoStore } from '@/lib/api-response';
import {
  badRequest,
  forbidden,
  notFound,
  readJson,
  requireVaultUser,
  serverError,
  zodErrorResponse,
} from '@/lib/vault/http';
import { passkeyOptionsSchema } from '@/lib/vault/schemas';
import {
  authenticationOptions,
  parseTransports,
  setChallengeCookie,
} from '@/lib/vault/webauthn';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const auth = await requireVaultUser();
  if (auth.response) return auth.response;
  const user = auth.user;

  const parsed = passkeyOptionsSchema.safeParse((await readJson(request)) ?? {});
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const vault = await prisma.vault.findUnique({
    where: { userId: user.id },
    select: { userId: true, user: { select: { twoFactorEnabled: true } } },
  });
  if (!vault) return notFound('No hay bóveda');
  if (!vault.user.twoFactorEnabled) return forbidden('2FA requerido');

  const passkeys = await prisma.vaultPasskey.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'asc' },
    select: { id: true, credentialId: true, prfSalt: true, transports: true },
  });

  if (passkeys.length === 0) return notFound('No hay passkeys registradas');

  const passkey = parsed.data.passkeyId
    ? passkeys.find((item) => item.id === parsed.data.passkeyId)
    : passkeys.length === 1
      ? passkeys[0]
      : null;

  if (!passkey) {
    return badRequest('Elige una passkey para desbloquear');
  }

  try {
    const options = await authenticationOptions({
      credentials: [
        {
          credentialId: passkey.credentialId,
          transports: parseTransports(passkey.transports),
        },
      ],
    });

    const response = jsonNoStore({ options, prfSalt: passkey.prfSalt, passkeyId: passkey.id });
    setChallengeCookie(response, {
      challenge: options.challenge,
      sub: user.id,
      type: 'authentication',
      prfSalt: passkey.prfSalt,
    });
    return response;
  } catch {
    return serverError();
  }
}
