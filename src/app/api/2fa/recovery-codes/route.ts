import { NextRequest } from 'next/server';
import { ZodError } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/api-auth';
import { jsonNoStore } from '@/lib/api-response';
import { getClientIp, logAuthEvent } from '@/lib/auth-events';
import { regenerateRecoveryCodesSchema } from '@/lib/schemas/two-factor';
import {
  isLoginRateLimited,
  replaceRecoveryCodes,
  verifyTotpForUser,
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
    const data = regenerateRecoveryCodesSchema.parse(await request.json());
    const ip = getClientIp(request);

    const user = await prisma.user.findUnique({
      where: { id: auth.user.id },
      select: { password: true, twoFactorEnabled: true },
    });

    if (!user?.password || !user.twoFactorEnabled) {
      return jsonNoStore({ error: '2FA no esta activo' }, 400);
    }

    const passwordValid = await bcrypt.compare(data.password, user.password);
    const codeValid = await verifyTotpForUser(auth.user.id, data.code);

    if (!passwordValid || !codeValid) {
      await logAuthEvent({
        userId: auth.user.id,
        action: 'TOTP_FAILED',
        ip,
      });
      return jsonNoStore({ error: 'Contrasena o codigo incorrectos' }, 401);
    }

    const recoveryCodes = await replaceRecoveryCodes(auth.user.id);

    await logAuthEvent({
      userId: auth.user.id,
      action: 'RECOVERY_CODES_REGENERATED',
      ip,
    });

    return jsonNoStore({ recoveryCodes });
  } catch (error) {
    if (error instanceof ZodError) {
      return jsonNoStore({ error: 'Datos invalidos' }, 400);
    }
    return jsonNoStore({ error: 'Error del servidor' }, 500);
  }
}
