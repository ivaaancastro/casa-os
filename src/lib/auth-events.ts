import { createHash } from 'node:crypto';
import type { NextRequest } from 'next/server';
import { prisma } from './prisma';

export type AuthEventAction =
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILED'
  | 'TOTP_FAILED'
  | 'RATE_LIMITED'
  | '2FA_SETUP'
  | '2FA_ENABLED'
  | '2FA_DISABLED'
  | '2FA_RESET'
  | 'RECOVERY_CODE_USED'
  | 'RECOVERY_CODES_REGENERATED'
  | 'PASSWORD_CHANGED';

export const FAILED_AUTH_ACTIONS: AuthEventAction[] = [
  'LOGIN_FAILED',
  'TOTP_FAILED',
];

export function hashIp(ip: string | null | undefined): string | null {
  const value = ip?.trim();
  if (!value) return null;

  const secret =
    process.env.AUTH_IP_HASH_SECRET ??
    process.env.NEXTAUTH_SECRET ??
    'casa-os-ip-hash';

  return createHash('sha256')
    .update(`${secret}:${value}`, 'utf8')
    .digest('hex');
}

export function getClientIp(request: NextRequest): string | null {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0]?.trim() || null;
  }
  return request.headers.get('x-real-ip')?.trim() || null;
}

interface LogAuthEventInput {
  userId?: string | null;
  actorId?: string | null;
  action: AuthEventAction;
  ip?: string | null;
}

/** Registra auditoria sin secretos. Un fallo de auditoria nunca expone datos. */
export async function logAuthEvent({
  userId,
  actorId,
  action,
  ip,
}: LogAuthEventInput): Promise<void> {
  try {
    await prisma.authEvent.create({
      data: {
        userId: userId ?? null,
        actorId: actorId ?? null,
        action,
        ipHash: hashIp(ip),
      },
    });
  } catch {
    // La auditoria no debe romper el flujo de autenticacion.
  }
}

export async function countRecentAuthFailures(
  userId: string,
  windowMs = 15 * 60_000,
): Promise<number> {
  return prisma.authEvent.count({
    where: {
      userId,
      action: { in: FAILED_AUTH_ACTIONS },
      createdAt: { gte: new Date(Date.now() - windowMs) },
    },
  });
}

export async function listRecentAuthEvents(userId: string, limit = 10) {
  return prisma.authEvent.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: {
      id: true,
      action: true,
      actorId: true,
      ipHash: true,
      createdAt: true,
    },
  });
}
