import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { signToken, verifyToken } from '../src/lib/vault/tokens';
import { VAULT_COOKIE } from '../src/lib/vault/constants';
import { issueVaultGrant, readVaultGrant } from '../src/lib/vault/grant';

const SECRET = 'test-secret-vault';

beforeEach(() => {
  process.env.NEXTAUTH_SECRET = SECRET;
});

afterEach(() => {
  vi.useRealTimers();
});

describe('tokens firmados', () => {
  it('firma y verifica un payload', () => {
    const token = signToken({ sub: 'user_1', n: 2 }, 'test');
    expect(verifyToken<{ sub: string; n: number }>(token, 'test')).toEqual({
      sub: 'user_1',
      n: 2,
    });
  });

  it('rechaza firma manipulada, propósito distinto y token corrupto', () => {
    const token = signToken({ sub: 'user_1' }, 'test');
    const [body, signature] = token.split('.');

    expect(verifyToken(`${body}.${signature?.slice(0, -2)}AA`, 'test')).toBeNull();
    expect(verifyToken(`${body}x.${signature}`, 'test')).toBeNull();
    expect(verifyToken(token, 'otro')).toBeNull();
    expect(verifyToken('sin-punto', 'test')).toBeNull();
    expect(verifyToken(null, 'test')).toBeNull();
  });

  it('no acepta un token firmado con otro secreto', () => {
    const token = signToken({ sub: 'user_1' }, 'test');
    process.env.NEXTAUTH_SECRET = 'otro-secreto';
    expect(verifyToken(token, 'test')).toBeNull();
  });
});

describe('grant de bóveda', () => {
  it('emite un grant ligado a usuario, sesión y keyring', () => {
    const token = issueVaultGrant({
      userId: 'user_1',
      sessionVersion: 3,
      keyringVersion: 2,
    });
    const request = new NextRequest('http://localhost/api/cuentas/accounts', {
      headers: { cookie: `${VAULT_COOKIE}=${token}` },
    });

    const grant = readVaultGrant(request);
    expect(grant?.sub).toBe('user_1');
    expect(grant?.sv).toBe(3);
    expect(grant?.kv).toBe(2);
    expect(grant?.exp).toBeGreaterThan(Date.now());
  });

  it('caduca a los 15 minutos', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-28T10:00:00Z'));

    const token = issueVaultGrant({
      userId: 'user_1',
      sessionVersion: 0,
      keyringVersion: 1,
    });
    const request = new NextRequest('http://localhost/api/cuentas/accounts', {
      headers: { cookie: `${VAULT_COOKIE}=${token}` },
    });

    expect(readVaultGrant(request)).not.toBeNull();
    vi.advanceTimersByTime(16 * 60 * 1000);
    expect(readVaultGrant(request)).toBeNull();
  });

  it('ignora un grant de otro usuario o una cookie ausente', () => {
    const token = issueVaultGrant({
      userId: 'user_1',
      sessionVersion: 0,
      keyringVersion: 1,
    });
    const other = new NextRequest('http://localhost/api/cuentas/accounts', {
      headers: { cookie: `${VAULT_COOKIE}=${token}` },
    });
    expect(readVaultGrant(other)?.sub).toBe('user_1');
    expect(readVaultGrant(new NextRequest('http://localhost/api/cuentas/accounts'))).toBeNull();
  });
});
