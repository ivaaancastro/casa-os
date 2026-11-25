import type { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { jsonNoStore } from '@/lib/api-response';
import { authOptions } from '@/lib/auth';
import {
  clearChallengeCookie,
  readChallenge,
  verifyRegistration,
} from '@/lib/vault/webauthn';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return jsonNoStore({ error: 'No autorizado' }, 401);
  }
  const passkeys = await prisma.appPasskey.findMany({
    where: { userId: session.user.id },
    select: { id: true, createdAt: true, lastUsedAt: true, transports: true },
    orderBy: { createdAt: 'desc' },
  });
  return jsonNoStore({
    passkeys: passkeys.map((p) => ({
      id: p.id,
      createdAt: p.createdAt.toISOString(),
      lastUsedAt: p.lastUsedAt?.toISOString() ?? null,
    })),
  });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return jsonNoStore({ error: 'No autorizado' }, 401);
  }
  const userId = session.user.id;

  let body: { response?: unknown } = {};
  try {
    body = (await request.json()) as { response?: unknown };
  } catch {
    return jsonNoStore({ error: 'JSON inválido' }, 400);
  }

  const challenge = readChallenge(request, userId, 'registration');
  if (!challenge) {
    return jsonNoStore({ error: 'El registro ha caducado. Vuelve a intentarlo' }, 400);
  }

  const response = body.response as Parameters<typeof verifyRegistration>[0];
  try {
    const credential = await verifyRegistration(response, challenge.challenge);

    const existing = await prisma.appPasskey.findUnique({
      where: { credentialId: credential.id },
      select: { id: true },
    });
    if (existing) {
      return jsonNoStore({ error: 'Esta passkey ya está registrada' }, 409);
    }

    const passkey = await prisma.appPasskey.create({
      data: {
        userId,
        credentialId: credential.id,
        publicKey: Buffer.from(credential.publicKey).toString('base64'),
        counter: credential.counter,
        transports: credential.transports
          ? JSON.stringify(credential.transports)
          : null,
      },
      select: { id: true, createdAt: true },
    });

    const result = jsonNoStore(
      { passkey: { id: passkey.id, createdAt: passkey.createdAt.toISOString() } },
      201,
    );
    clearChallengeCookie(result);
    return result;
  } catch {
    return jsonNoStore({ error: 'No se pudo registrar la passkey' }, 400);
  }
}