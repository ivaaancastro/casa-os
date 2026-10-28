import { prisma } from '@/lib/prisma';
import { hashIp } from '@/lib/auth-events';
import {
  RECOVERY_MAX_ATTEMPTS,
  RECOVERY_WINDOW_MS,
  UNLOCK_MAX_FAILURES,
  UNLOCK_WINDOW_MS,
} from './constants';

export type VaultEventAction =
  | 'VAULT_CREATED'
  | 'VAULT_DELETED'
  | 'UNLOCK_OK'
  | 'UNLOCK_FAILED'
  | 'RATE_LIMITED'
  | 'ACCOUNT_CREATED'
  | 'ACCOUNT_UPDATED'
  | 'ACCOUNT_DELETED'
  | 'SHARE_GRANTED'
  | 'SHARE_REVOKED'
  | 'KEY_ROTATED'
  | 'MASTER_PASSWORD_CHANGED'
  | 'RECOVERY_SET'
  | 'RECOVERY_ROTATED'
  | 'RECOVERY_USED'
  | 'RECOVERY_FAILED'
  | 'PASSKEY_ADDED'
  | 'PASSKEY_REMOVED'
  | 'CONTACT_INVITED'
  | 'CONTACT_ACCEPTED'
  | 'CONTACT_REVOKED'
  | 'CONTACT_REVEALED';

const UNLOCK_FAILURE_ACTIONS: VaultEventAction[] = [
  'UNLOCK_FAILED',
  'RATE_LIMITED',
];

interface VaultEventInput {
  userId: string;
  actorId?: string | null;
  action: VaultEventAction;
  targetId?: string | null;
  ip?: string | null;
}

/** Auditoría sin secretos: nunca guarda contenido, claves ni códigos. */
export async function logVaultEvent({
  userId,
  actorId,
  action,
  targetId,
  ip,
}: VaultEventInput): Promise<void> {
  try {
    await prisma.vaultEvent.create({
      data: {
        userId,
        actorId: actorId ?? null,
        action,
        targetId: targetId ?? null,
        ipHash: hashIp(ip),
      },
    });
  } catch {
    // La auditoría nunca debe romper el flujo principal.
  }
}

export async function countRecentUnlockFailures(userId: string): Promise<number> {
  return prisma.vaultEvent.count({
    where: {
      userId,
      action: { in: UNLOCK_FAILURE_ACTIONS },
      createdAt: { gte: new Date(Date.now() - UNLOCK_WINDOW_MS) },
    },
  });
}

export async function isUnlockRateLimited(userId: string): Promise<boolean> {
  return (await countRecentUnlockFailures(userId)) >= UNLOCK_MAX_FAILURES;
}

export async function isRecoveryRateLimited(userId: string): Promise<boolean> {
  const count = await prisma.vaultEvent.count({
    where: {
      userId,
      action: { in: ['RECOVERY_USED', 'RECOVERY_FAILED'] },
      createdAt: { gte: new Date(Date.now() - RECOVERY_WINDOW_MS) },
    },
  });
  return count >= RECOVERY_MAX_ATTEMPTS;
}

export async function listVaultEvents(userId: string, limit = 30) {
  return prisma.vaultEvent.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: {
      id: true,
      action: true,
      targetId: true,
      actorId: true,
      createdAt: true,
    },
  });
}
