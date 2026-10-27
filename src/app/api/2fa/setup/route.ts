import QRCode from 'qrcode';
import { requireUser } from '@/lib/api-auth';
import { jsonNoStore } from '@/lib/api-response';
import { EncryptionConfigError } from '@/lib/crypto';
import { isLoginRateLimited, createTwoFactorSetup } from '@/lib/two-factor';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST() {
  const auth = await requireUser();
  if (auth.response) return auth.response;

  if (await isLoginRateLimited(auth.user.id)) {
    return jsonNoStore(
      { error: 'Demasiados intentos. Espera unos minutos.' },
      429,
    );
  }

  try {
    const setup = await createTwoFactorSetup(
      auth.user.id,
      auth.user.email ?? auth.user.name ?? 'casa-os',
    );

    if (!setup.ok) {
      if (setup.error === 'ALREADY_ENABLED') {
        return jsonNoStore({ error: '2FA ya esta activo' }, 400);
      }
      return jsonNoStore({ error: 'No se pudo iniciar la configuracion' }, 400);
    }

    const qrDataUrl = await QRCode.toDataURL(setup.otpauth, {
      width: 280,
      margin: 1,
      errorCorrectionLevel: 'M',
    });

    return jsonNoStore({
      secret: setup.secret,
      otpauth: setup.otpauth,
      qrDataUrl,
    });
  } catch (error) {
    if (error instanceof EncryptionConfigError) {
      return jsonNoStore(
        { error: 'La configuracion de cifrado no esta disponible' },
        503,
      );
    }
    return jsonNoStore({ error: 'Error del servidor' }, 500);
  }
}
