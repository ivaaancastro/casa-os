import { NextRequest } from 'next/server';
import { ZodError } from 'zod';
import { requireUser } from '@/lib/api-auth';
import { jsonNoStore } from '@/lib/api-response';
import { getClientIp, logAuthEvent } from '@/lib/auth-events';
import { enableTwoFactorSchema } from '@/lib/schemas/two-factor';
import { enableTwoFactor, isLoginRateLimited } from '@/lib/two-factor';

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
    const data = enableTwoFactorSchema.parse(await request.json());
    const result = await enableTwoFactor(auth.user.id, data.code);

    if (!result.ok) {
      if (result.error === 'ALREADY_ENABLED') {
        return jsonNoStore({ error: '2FA ya esta activo' }, 409);
      }
      if (result.error === 'INVALID_CODE') {
        await logAuthEvent({
          userId: auth.user.id,
          action: 'TOTP_FAILED',
          ip: getClientIp(request),
        });
        return jsonNoStore({ error: 'Codigo incorrecto' }, 400);
      }
      if (result.error === 'CONFIG') {
        return jsonNoStore(
          { error: 'La configuracion de cifrado no esta disponible' },
          503,
        );
      }
      return jsonNoStore({ error: 'Inicia la configuracion de nuevo' }, 400);
    }

    return jsonNoStore({
      ok: true,
      recoveryCodes: result.recoveryCodes,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return jsonNoStore({ error: 'Datos invalidos' }, 400);
    }
    return jsonNoStore({ error: 'Error del servidor' }, 500);
  }
}
