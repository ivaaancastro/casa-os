import { NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { prisma } from './prisma';
import { decryptTotpSecret, encryptTotpSecret } from './crypto';
import {
  countRecentAuthFailures,
  logAuthEvent,
} from './auth-events';
import {
  buildTotpUri,
  createTotpSecret,
  isTotpCodeFormat,
  verifyTotpCode,
} from './totp';
import {
  generateRecoveryCodes,
  hashRecoveryCode,
  isRecoveryCodeFormat,
} from './two-factor-recovery';

export type TwoFactorError =
  | 'ALREADY_ENABLED'
  | 'NOT_ENABLED'
  | 'NOT_SET_UP'
  | 'INVALID_CODE'
  | 'CONFIG';

export interface TwoFactorState {
  enabled: boolean;
  confirmedAt: Date | null;
  recoveryCodesRemaining: number;
}

export async function getTwoFactorState(userId: string): Promise<TwoFactorState> {
  const [user, recoveryCodesRemaining] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        twoFactorEnabled: true,
        twoFactorConfirmedAt: true,
      },
    }),
    prisma.twoFactorRecoveryCode.count({
      where: { userId, usedAt: null },
    }),
  ]);

  return {
    enabled: user?.twoFactorEnabled ?? false,
    confirmedAt: user?.twoFactorConfirmedAt ?? null,
    recoveryCodesRemaining,
  };
}

export async function isTwoFactorEnabled(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { twoFactorEnabled: true },
  });
  return user?.twoFactorEnabled ?? false;
}

/** Guard para futuras rutas de `cuentas`: 403 si el usuario no tiene 2FA. */
export async function requireTwoFactor(user: { id: string }): Promise<NextResponse | null> {
  if (await isTwoFactorEnabled(user.id)) return null;
  return NextResponse.json({ error: '2FA requerido' }, { status: 403 });
}

export async function isLoginRateLimited(
  userId: string,
  windowMs = 15 * 60_000,
): Promise<boolean> {
  return (await countRecentAuthFailures(userId, windowMs)) >= 5;
}

export async function verifyTotpForUser(
  userId: string,
  code: string,
): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { twoFactorEnabled: true, twoFactorSecret: true },
  });

  if (!user?.twoFactorEnabled || !user.twoFactorSecret) return false;
  if (!isTotpCodeFormat(code)) return false;

  try {
    const secret = decryptTotpSecret(user.twoFactorSecret);
    return await verifyTotpCode(secret, code);
  } catch {
    return false;
  }
}

/**
 * Consume un codigo de recuperacion de un solo uso. `updateMany` con
 * `usedAt: null` evita que dos peticiones simultaneas usen el mismo codigo.
 */
export async function consumeRecoveryCode(
  userId: string,
  code: string,
): Promise<boolean> {
  if (!isRecoveryCodeFormat(code)) return false;

  const codeHash = hashRecoveryCode(code);
  const record = await prisma.twoFactorRecoveryCode.findUnique({
    where: { codeHash },
    select: { id: true, userId: true, usedAt: true },
  });

  if (!record || record.userId !== userId || record.usedAt) return false;

  const result = await prisma.twoFactorRecoveryCode.updateMany({
    where: { id: record.id, usedAt: null },
    data: { usedAt: new Date() },
  });

  return result.count === 1;
}

export async function verifySecondFactor(
  userId: string,
  code: string,
): Promise<{ valid: boolean; method: 'totp' | 'recovery' | null }> {
  if (isTotpCodeFormat(code)) {
    const valid = await verifyTotpForUser(userId, code);
    return { valid, method: valid ? 'totp' : null };
  }

  if (isRecoveryCodeFormat(code)) {
    const valid = await consumeRecoveryCode(userId, code);
    return { valid, method: valid ? 'recovery' : null };
  }

  return { valid: false, method: null };
}

async function createRecoveryCodeRows(
  tx: Prisma.TransactionClient,
  userId: string,
  codes: string[],
): Promise<void> {
  await tx.twoFactorRecoveryCode.createMany({
    data: codes.map((code) => ({
      userId,
      codeHash: hashRecoveryCode(code),
    })),
  });
}

export async function replaceRecoveryCodes(
  userId: string,
  count = 10,
): Promise<string[]> {
  const codes = generateRecoveryCodes(count);

  await prisma.$transaction(async (tx) => {
    await tx.twoFactorRecoveryCode.deleteMany({ where: { userId } });
    await createRecoveryCodeRows(tx, userId, codes);
  });

  return codes;
}

export async function countRemainingRecoveryCodes(userId: string): Promise<number> {
  return prisma.twoFactorRecoveryCode.count({
    where: { userId, usedAt: null },
  });
}

export async function createTwoFactorSetup(
  userId: string,
  accountName: string,
): Promise<
  | { ok: true; secret: string; otpauth: string }
  | { ok: false; error: TwoFactorError }
> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { twoFactorEnabled: true, email: true },
  });

  if (!user) return { ok: false, error: 'NOT_SET_UP' };
  if (user.twoFactorEnabled) return { ok: false, error: 'ALREADY_ENABLED' };

  const secret = createTotpSecret();
  const encrypted = encryptTotpSecret(secret);

  await prisma.user.update({
    where: { id: userId },
    data: {
      twoFactorSecret: encrypted,
      twoFactorEnabled: false,
      twoFactorConfirmedAt: null,
    },
  });

  await logAuthEvent({ userId, action: '2FA_SETUP' });

  return {
    ok: true,
    secret,
    otpauth: buildTotpUri(secret, accountName || user.email || 'casa-os'),
  };
}

export async function enableTwoFactor(
  userId: string,
  code: string,
): Promise<
  | { ok: true; recoveryCodes: string[] }
  | { ok: false; error: TwoFactorError }
> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      twoFactorEnabled: true,
      twoFactorSecret: true,
    },
  });

  if (!user) return { ok: false, error: 'NOT_SET_UP' };
  if (user.twoFactorEnabled) return { ok: false, error: 'ALREADY_ENABLED' };
  if (!user.twoFactorSecret) return { ok: false, error: 'NOT_SET_UP' };

  let secret: string;
  try {
    secret = decryptTotpSecret(user.twoFactorSecret);
  } catch {
    return { ok: false, error: 'CONFIG' };
  }

  const valid = await verifyTotpCode(secret, code);
  if (!valid) return { ok: false, error: 'INVALID_CODE' };

  const recoveryCodes = generateRecoveryCodes();

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: true,
        twoFactorConfirmedAt: new Date(),
        sessionVersion: { increment: 1 },
      },
    });
    await tx.twoFactorRecoveryCode.deleteMany({ where: { userId } });
    await createRecoveryCodeRows(tx, userId, recoveryCodes);
  });

  await logAuthEvent({ userId, action: '2FA_ENABLED' });

  return { ok: true, recoveryCodes };
}

export async function disableTwoFactor(
  userId: string,
): Promise<{ ok: true } | { ok: false; error: TwoFactorError }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { twoFactorEnabled: true },
  });

  if (!user?.twoFactorEnabled) return { ok: false, error: 'NOT_ENABLED' };

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorConfirmedAt: null,
        sessionVersion: { increment: 1 },
      },
    });
    await tx.twoFactorRecoveryCode.deleteMany({ where: { userId } });
  });

  await logAuthEvent({ userId, action: '2FA_DISABLED' });
  return { ok: true };
}

export async function resetTwoFactorByAdmin(
  adminId: string,
  targetId: string,
): Promise<{ ok: true } | { ok: false; error: 'NOT_FOUND' | 'SELF' | 'NOT_ENABLED' }> {
  if (adminId === targetId) return { ok: false, error: 'SELF' };

  const target = await prisma.user.findUnique({
    where: { id: targetId },
    select: { twoFactorEnabled: true },
  });

  if (!target) return { ok: false, error: 'NOT_FOUND' };
  if (!target.twoFactorEnabled) return { ok: false, error: 'NOT_ENABLED' };

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: targetId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorConfirmedAt: null,
        sessionVersion: { increment: 1 },
      },
    });
    await tx.twoFactorRecoveryCode.deleteMany({ where: { userId: targetId } });
  });

  await logAuthEvent({ userId: targetId, actorId: adminId, action: '2FA_RESET' });
  return { ok: true };
}
