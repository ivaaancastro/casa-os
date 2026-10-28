import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Tokens firmados de corta duración para la bóveda.
 * No son JWT: solo payload + HMAC-SHA256 con `NEXTAUTH_SECRET`.
 */

function secret(): string {
  const value = process.env.NEXTAUTH_SECRET;
  if (!value) throw new Error('Falta NEXTAUTH_SECRET');
  return value;
}

function sign(purpose: string, payloadBase64: string): string {
  return createHmac('sha256', secret())
    .update(`${purpose}.${payloadBase64}`)
    .digest('base64url');
}

export function signToken(payload: Record<string, unknown>, purpose: string): string {
  const body = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  return `${body}.${sign(purpose, body)}`;
}

export function verifyToken<T extends object>(
  token: string | null | undefined,
  purpose: string,
): T | null {
  if (!token) return null;
  const [body, signature] = token.split('.');
  if (!body || !signature) return null;

  const expected = sign(purpose, body);
  const provided = Buffer.from(signature);
  const wanted = Buffer.from(expected);
  if (provided.length !== wanted.length) return null;
  if (!timingSafeEqual(provided, wanted)) return null;

  try {
    const parsed = JSON.parse(
      Buffer.from(body, 'base64url').toString('utf8'),
    ) as unknown;
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed as T;
  } catch {
    return null;
  }
}
