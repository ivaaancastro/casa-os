import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { jsonNoStore } from '@/lib/api-response';
import { requireVaultAccess } from '@/lib/vault/access';
import {
  forbidden,
  requireVaultUser,
  serverError,
} from '@/lib/vault/http';
import {
  newPrfSalt,
  registrationOptions,
  setChallengeCookie,
} from '@/lib/vault/webauthn';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const auth = await requireVaultUser();
  if (auth.response) return auth.response;
  const user = auth.user;

  const access = await requireVaultAccess(request, user);
  if (access.response) return access.response;

  if (!user.email) return forbidden('La cuenta no tiene email');

  try {
    const existing = await prisma.vaultPasskey.findMany({
      where: { userId: user.id },
      select: { credentialId: true },
    });

    const options = await registrationOptions({
      userId: user.id,
      email: user.email,
      name: user.name ?? null,
      existingCredentialIds: existing.map((passkey) => passkey.credentialId),
    });

    const prfSalt = newPrfSalt();
    const response = jsonNoStore({ options, prfSalt });
    setChallengeCookie(response, {
      challenge: options.challenge,
      sub: user.id,
      type: 'registration',
      prfSalt,
    });
    return response;
  } catch {
    return serverError();
  }
}
