import type { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { jsonNoStore } from '@/lib/api-response';
import { authOptions } from '@/lib/auth';
import {
  newPrfSalt,
  registrationOptions,
  setChallengeCookie,
} from '@/lib/vault/webauthn';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return jsonNoStore({ error: 'No autorizado' }, 401);
  }
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, name: true },
  });
  if (!user?.email) {
    return jsonNoStore({ error: 'La cuenta no tiene email' }, 403);
  }

  try {
    const existing = await prisma.appPasskey.findMany({
      where: { userId: user.id },
      select: { credentialId: true },
    });
    const options = await registrationOptions({
      userId: user.id,
      email: user.email,
      name: user.name ?? null,
      existingCredentialIds: existing.map((p) => p.credentialId),
    });
    const response = jsonNoStore({ options });
    setChallengeCookie(response, {
      challenge: options.challenge,
      sub: user.id,
      type: 'registration',
    });
    return response;
  } catch {
    return jsonNoStore({ error: 'Error del servidor' }, 500);
  }
}