import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getClientIp } from '@/lib/auth-events';
import { jsonNoStore } from '@/lib/api-response';
import { requireVaultAccess } from '@/lib/vault/access';
import { logVaultEvent } from '@/lib/vault/audit';
import { KDF_SALT_BYTES, NONCE_BYTES } from '@/lib/vault/constants';
import { issueVaultGrant, setVaultGrantCookie } from '@/lib/vault/grant';
import {
  badRequest,
  isExactBase64,
  readJson,
  requireVaultUser,
  serverError,
  zodErrorResponse,
} from '@/lib/vault/http';
import { updateKeyringSchema } from '@/lib/vault/schemas';
import { hashAuthKey, vaultPayload } from '@/lib/vault/service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function PUT(request: NextRequest) {
  const auth = await requireVaultUser();
  if (auth.response) return auth.response;
  const user = auth.user;

  const access = await requireVaultAccess(request, user);
  if (access.response) return access.response;

  const parsed = updateKeyringSchema.safeParse(await readJson(request));
  if (!parsed.success) return zodErrorResponse(parsed.error);
  const data = parsed.data;

  if (!isExactBase64(data.authKey, 32)) {
    return badRequest('La clave de autenticación no es válida');
  }
  if (!isExactBase64(data.kdfSalt, KDF_SALT_BYTES)) {
    return badRequest('La sal de derivación no es válida');
  }
  if (!isExactBase64(data.keyringNonce, NONCE_BYTES)) {
    return badRequest('El nonce del keyring no es válido');
  }

  try {
    const authHash = await hashAuthKey(data.authKey);
    const keyringVersion = access.access.vault.keyringVersion + 1;

    const vault = await prisma.$transaction(async (tx) => {
      const updated = await tx.vault.update({
        where: { userId: user.id },
        data: {
          kdfSalt: data.kdfSalt,
          kdfOpsLimit: data.kdfOpsLimit,
          kdfMemLimit: data.kdfMemLimit,
          authHash,
          wrappedKeyring: data.wrappedKeyring,
          keyringNonce: data.keyringNonce,
          keyringVersion,
        },
      });

      // Las passkeys envuelven el keyring anterior: dejan de ser válidas.
      await tx.vaultPasskey.deleteMany({ where: { userId: user.id } });
      return updated;
    });

    await logVaultEvent({
      userId: user.id,
      actorId: user.id,
      action: 'MASTER_PASSWORD_CHANGED',
      ip: getClientIp(request),
    });

    const response = jsonNoStore({ vault: vaultPayload(vault) });
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
