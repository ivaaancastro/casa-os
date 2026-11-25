import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { jsonNoStore } from '@/lib/api-response';
import { readJson } from '@/lib/vault/http';
import {
  authenticationOptions,
  setChallengeCookie,
} from '@/lib/vault/webauthn';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  let email = '';
  try {
    const body = (await readJson(request)) as { email?: string };
    email = (body?.email ?? '').trim().toLowerCase();
  } catch {
    email = '';
  }

  let allowCredentials: Array<{ credentialId: string; transports: string[] }> = [];
  if (email) {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, appPasskeys: { select: { credentialId: true, transports: true } } },
    });
    if (user) {
      allowCredentials = user.appPasskeys.map((p) => ({
        credentialId: p.credentialId,
        transports: p.transports ? (JSON.parse(p.transports) as string[]) : [],
      }));
    }
  }

  // Si no hay email, usamos credenciales descubribles: allowCredentials vacío.
  const options = await authenticationOptions({ credentials: allowCredentials });

  const response = jsonNoStore({ options });
  setChallengeCookie(response, {
    challenge: options.challenge,
    sub: 'login',
    type: 'authentication',
  });
  return response;
}