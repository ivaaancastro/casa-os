import type { NextRequest } from 'next/server';
import type { RegistrationResponseJSON } from '@simplewebauthn/server';
import { prisma } from '@/lib/prisma';
import { jsonNoStore } from '@/lib/api-response';
import { getClientIp } from '@/lib/auth-events';
import { requireVaultAccess } from '@/lib/vault/access';
import { logVaultEvent } from '@/lib/vault/audit';
import {
  badRequest,
  conflict,
  readJson,
  requireVaultUser,
  serverError,
  zodErrorResponse,
} from '@/lib/vault/http';
import { passkeyRegisterSchema } from '@/lib/vault/schemas';
import {
  clearChallengeCookie,
  readChallenge,
  verifyRegistration,
} from '@/lib/vault/webauthn';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const auth = await requireVaultUser();
  if (auth.response) return auth.response;
  const user = auth.user;

  const access = await requireVaultAccess(request, user);
  if (access.response) return access.response;

  const parsed = passkeyRegisterSchema.safeParse(await readJson(request));
  if (!parsed.success) return zodErrorResponse(parsed.error);
  const data = parsed.data;

  const challenge = readChallenge(request, user.id, 'registration');
  if (!challenge) return badRequest('El registro ha caducado. Vuelve a intentarlo');
  if (challenge.prfSalt !== data.prfSalt) {
    return badRequest('La sal del PRF no coincide con el registro');
  }

  const response = data.response as unknown as RegistrationResponseJSON;
  if (response.clientExtensionResults?.prf?.enabled !== true) {
    return badRequest(
      'Este dispositivo no permite desbloquear con passkey. Usa la master password',
    );
  }

  try {
    const credential = await verifyRegistration(response, challenge.challenge);

    const existing = await prisma.vaultPasskey.findUnique({
      where: { credentialId: credential.id },
      select: { id: true },
    });
    if (existing) return conflict('Esta passkey ya está registrada');

    const passkey = await prisma.vaultPasskey.create({
      data: {
        userId: user.id,
        credentialId: credential.id,
        publicKey: Buffer.from(credential.publicKey).toString('base64'),
        counter: credential.counter,
        transports: credential.transports
          ? JSON.stringify(credential.transports)
          : null,
        prfSalt: data.prfSalt,
        wrappedKeyring: data.wrappedKeyring,
        nonce: data.keyringNonce,
      },
      select: { id: true, createdAt: true, lastUsedAt: true },
    });

    await logVaultEvent({
      userId: user.id,
      actorId: user.id,
      action: 'PASSKEY_ADDED',
      targetId: passkey.id,
      ip: getClientIp(request),
    });

    const result = jsonNoStore(
      {
        passkey: {
          id: passkey.id,
          createdAt: passkey.createdAt.toISOString(),
          lastUsedAt: null,
        },
      },
      201,
    );
    clearChallengeCookie(result);
    return result;
  } catch {
    return serverError();
  }
}
