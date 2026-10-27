import { generate, generateSecret, generateURI, verify } from 'otplib';

export const TOTP_ISSUER = 'casa-os';
export const TOTP_DIGITS = 6;
export const TOTP_PERIOD_SECONDS = 30;
export const TOTP_TOLERANCE_SECONDS = TOTP_PERIOD_SECONDS;

/** Secreto base32 de 160 bits, compatible con apps autenticadoras estandar. */
export function createTotpSecret(): string {
  return generateSecret();
}

export function buildTotpUri(secret: string, accountName: string): string {
  return generateURI({
    issuer: TOTP_ISSUER,
    label: accountName,
    secret,
  });
}

export function normalizeTotpCode(value: string): string {
  return value.replace(/\s+/g, '').trim();
}

export function isTotpCodeFormat(value: string): boolean {
  return /^\d{6}$/.test(normalizeTotpCode(value));
}

export async function generateTotpCode(
  secret: string,
  epochSeconds?: number,
): Promise<string> {
  return generate({ secret, epoch: epochSeconds });
}

/**
 * Verifica un TOTP con ventana +-1 paso (30 s). Nunca registra el codigo ni
 * el secreto. Cualquier error de formato o de secreto se trata como fallo.
 */
export async function verifyTotpCode(secret: string, token: string): Promise<boolean> {
  const normalized = normalizeTotpCode(token);
  if (!isTotpCodeFormat(normalized)) return false;

  try {
    const result = await verify({
      secret,
      token: normalized,
      epochTolerance: TOTP_TOLERANCE_SECONDS,
    });
    return result.valid;
  } catch {
    return false;
  }
}
