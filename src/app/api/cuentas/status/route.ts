import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { jsonNoStore } from '@/lib/api-response';
import { readVaultGrant } from '@/lib/vault/grant';
import { requireVaultUser } from '@/lib/vault/http';
import type { VaultContactSummary } from '@/lib/vault/types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const auth = await requireVaultUser();
  if (auth.response) return auth.response;
  const user = auth.user;

  const [dbUser, vault, passkeys] = await Promise.all([
    prisma.user.findUnique({
      where: { id: user.id },
      select: { twoFactorEnabled: true },
    }),
    prisma.vault.findUnique({
      where: { userId: user.id },
      select: {
        createdAt: true,
        updatedAt: true,
        kdfSalt: true,
        kdfOpsLimit: true,
        kdfMemLimit: true,
        publicKey: true,
        keyringVersion: true,
      },
    }),
    prisma.vaultPasskey.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'asc' },
      select: { id: true, createdAt: true, lastUsedAt: true },
    }),
  ]);

  const recovery = vault
    ? await prisma.vaultRecovery.findUnique({
        where: { userId: user.id },
        select: { updatedAt: true },
      })
    : null;

  const shares = vault
    ? await prisma.vaultRecoveryShare.findMany({
        where: { OR: [{ ownerId: user.id }, { contactId: user.id }] },
        orderBy: { createdAt: 'desc' },
        include: {
          owner: { select: { name: true, email: true } },
          contact: { select: { name: true, email: true } },
        },
      })
    : [];

  const contacts: VaultContactSummary[] = shares.map((share) => ({
    id: share.id,
    ownerId: share.ownerId,
    contactId: share.contactId,
    ownerName: share.owner.name,
    ownerEmail: share.owner.email,
    contactName: share.contact.name,
    contactEmail: share.contact.email,
    status: share.status as VaultContactSummary['status'],
    createdAt: share.createdAt.toISOString(),
    acceptedAt: share.acceptedAt?.toISOString() ?? null,
    direction: share.ownerId === user.id ? 'outgoing' : 'incoming',
  }));

  const grant = readVaultGrant(request);
  const grantActive =
    !!vault &&
    !!grant &&
    grant.sub === user.id &&
    grant.sv === user.sessionVersion &&
    grant.kv === vault.keyringVersion;

  return jsonNoStore({
    twoFactorEnabled: dbUser?.twoFactorEnabled ?? false,
    grantActive,
    vault: vault
      ? {
          createdAt: vault.createdAt.toISOString(),
          updatedAt: vault.updatedAt.toISOString(),
          kdfSalt: vault.kdfSalt,
          kdfOpsLimit: vault.kdfOpsLimit,
          kdfMemLimit: vault.kdfMemLimit,
          publicKey: vault.publicKey,
          keyringVersion: vault.keyringVersion,
          passkeys: passkeys.map((passkey) => ({
            id: passkey.id,
            createdAt: passkey.createdAt.toISOString(),
            lastUsedAt: passkey.lastUsedAt?.toISOString() ?? null,
          })),
          recovery: {
            configured: !!recovery,
            updatedAt: recovery?.updatedAt.toISOString() ?? null,
          },
          contacts,
        }
      : null,
  });
}
