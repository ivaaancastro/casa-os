import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import {
  VAULT_COOKIE,
  VAULT_GRANT_TTL_SECONDS,
} from './constants';
import { signToken, verifyToken } from './tokens';

const PURPOSE = 'casa-os:vault-grant:v1';

export interface VaultGrant {
  sub: string;
  sv: number;
  kv: number;
  exp: number;
}

export function issueVaultGrant(input: {
  userId: string;
  sessionVersion: number;
  keyringVersion: number;
}): string {
  return signToken(
    {
      sub: input.userId,
      sv: input.sessionVersion,
      kv: input.keyringVersion,
      exp: Date.now() + VAULT_GRANT_TTL_SECONDS * 1000,
    },
    PURPOSE,
  );
}

export function readVaultGrant(request: NextRequest): VaultGrant | null {
  const token = request.cookies.get(VAULT_COOKIE)?.value;
  const payload = verifyToken<VaultGrant>(token, PURPOSE);
  if (!payload) return null;
  if (typeof payload.sub !== 'string' || typeof payload.exp !== 'number') return null;
  if (payload.exp <= Date.now()) return null;
  return payload;
}

export function setVaultGrantCookie(response: NextResponse, token: string): void {
  response.cookies.set(VAULT_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/api/cuentas',
    maxAge: VAULT_GRANT_TTL_SECONDS,
  });
}

export function clearVaultGrantCookie(response: NextResponse): void {
  response.cookies.set(VAULT_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/api/cuentas',
    maxAge: 0,
  });
}
