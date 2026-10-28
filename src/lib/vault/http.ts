import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { jsonNoStore } from '@/lib/api-response';
import { requireUser, type AuthUser } from '@/lib/api-auth';

export async function readJson(request: NextRequest): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

type VaultUserResult =
  | { user: AuthUser; response?: never }
  | { user?: never; response: NextResponse };

/** Sesión válida con respuestas `no-store`, como exige `/api/cuentas/*`. */
export async function requireVaultUser(): Promise<VaultUserResult> {
  const auth = await requireUser();
  if (auth.response) {
    auth.response.headers.set('Cache-Control', 'no-store');
    return { response: auth.response };
  }
  return { user: auth.user };
}

export function zodErrorResponse(error: ZodError): NextResponse {
  const message = error.issues[0]?.message ?? 'Datos no válidos';
  return jsonNoStore({ error: message }, 400);
}

export function badRequest(message: string): NextResponse {
  return jsonNoStore({ error: message }, 400);
}

export function unauthorized(message = 'No autorizado'): NextResponse {
  return jsonNoStore({ error: message }, 401);
}

export function forbidden(message = 'Prohibido'): NextResponse {
  return jsonNoStore({ error: message }, 403);
}

export function notFound(message = 'No encontrado'): NextResponse {
  return jsonNoStore({ error: message }, 404);
}

export function conflict(message = 'Conflicto'): NextResponse {
  return jsonNoStore({ error: message }, 409);
}

export function serverError(): NextResponse {
  return jsonNoStore({ error: 'Error del servidor' }, 500);
}

export function tooManyRequests(retryAfterSeconds: number): NextResponse {
  const response = jsonNoStore(
    { error: 'Demasiados intentos. Espera antes de volver a probar.' },
    429,
  );
  response.headers.set('Retry-After', String(retryAfterSeconds));
  return response;
}

export function base64Bytes(value: string): number | null {
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(value) || value.length % 4 !== 0) return null;
  try {
    return Buffer.from(value, 'base64').length;
  } catch {
    return null;
  }
}

/** Comprueba que un valor base64 decodifica exactamente al tamaño esperado. */
export function isExactBase64(value: string, bytes: number): boolean {
  return base64Bytes(value) === bytes;
}
