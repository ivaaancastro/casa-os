import { NextRequest } from 'next/server';
import { ZodError } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/api-auth';
import { emptyNoStore, jsonNoStore } from '@/lib/api-response';
import { getClientIp, logAuthEvent } from '@/lib/auth-events';
import { disableTwoFactorSchema } from '@/lib/schemas/two-factor';
import {
  disableTwoFactor,
  isLoginRateLimited,
  verifySecondFactor,
} from '@/lib/two-factor';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const auth = await requireUser();
  if (auth.response) return auth.response;

  if (await isLoginRateLimited(auth.user.id)) {
    return jsonNoStore(
      { error: 'Demasiados intentos. Espera unos minutos.' },
      429,
    );
  }

  try {
    const data = disableTwoFactorSchema.parse(await request.json());
    const ip = getClientIp(request);

    const user = await prisma.user.findUnique({
      where: { id: auth.user.id },
      select: { password: true },
    });

    if (!user?.password) {
      return jsonNoStore({ error: 'No se puede desactivar 2FA' }, 400);
    }

    const passwordValid = await bcrypt.compare(data.password, user.password);
    if (!passwordValid) {
      await logAuthEvent({
        userId: auth.user.id,
        action: 'TOTP_FAILED',
        ip,
      });
      return jsonNoStore({ error: 'Contrasena o codigo incorrectos' }, 401);
    }

    const code = data.code ?? data.recoveryCode ?? '';
    const secondFactor = await verifySecondFactor(auth.user.id, code);
    if (!secondFactor.valid) {
      await logAuthEvent({
        userId: auth.user.id,
        action: 'TOTP_FAILED',
        ip,
      });
      return jsonNoStore({ error: 'Contrasena o codigo incorrectos' }, 401);
    }

    const result = await disableTwoFactor(auth.user.id);
    if (!result.ok) {
      return jsonNoStore({ error: '2FA no esta activo' }, 400);
    }

    return emptyNoStore();
  } catch (error) {
    if (error instanceof ZodError) {
      return jsonNoStore({ error: 'Datos invalidos' }, 400);
    }
    return jsonNoStore({ error: 'Error del servidor' }, 500);
  }
}
