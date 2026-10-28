import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import type { AuthUser } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { jsonNoStore } from '@/lib/api-response';
import { readVaultGrant } from './grant';

export interface VaultAccess {
  vault: {
    id: string;
    userId: string;
    kdfSalt: string;
    kdfOpsLimit: number;
    kdfMemLimit: number;
    publicKey: string;
    wrappedKeyring: string;
    keyringNonce: string;
    keyringVersion: number;
    createdAt: Date;
    updatedAt: Date;
  };
}

type AccessResult =
  | { access: VaultAccess; response?: never }
  | { access?: never; response: NextResponse };

/**
 * Exige un grant válido, ligado a la sesión, al `sessionVersion` y a la versión
 * del keyring. Un cambio de master password o de 2FA invalida los grants.
 */
export async function requireVaultAccess(
  request: NextRequest,
  user: AuthUser,
): Promise<AccessResult> {
  const grant = readVaultGrant(request);
  if (!grant || grant.sub !== user.id) {
    return { response: jsonNoStore({ error: 'Bóveda bloqueada' }, 401) };
  }
  if (grant.sv !== user.sessionVersion) {
    return { response: jsonNoStore({ error: 'Bóveda bloqueada' }, 401) };
  }

  const vault = await prisma.vault.findUnique({
    where: { userId: user.id },
    select: {
      id: true,
      userId: true,
      kdfSalt: true,
      kdfOpsLimit: true,
      kdfMemLimit: true,
      publicKey: true,
      wrappedKeyring: true,
      keyringNonce: true,
      keyringVersion: true,
      createdAt: true,
      updatedAt: true,
      user: { select: { twoFactorEnabled: true, active: true } },
    },
  });

  if (!vault || !vault.user.active || !vault.user.twoFactorEnabled) {
    return { response: jsonNoStore({ error: '2FA requerido' }, 403) };
  }
  if (grant.kv !== vault.keyringVersion) {
    return { response: jsonNoStore({ error: 'Bóveda bloqueada' }, 401) };
  }

  const { user: _user, ...rest } = vault;
  return { access: { vault: rest } };
}
