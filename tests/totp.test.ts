import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  buildTotpUri,
  createTotpSecret,
  generateTotpCode,
  isTotpCodeFormat,
  normalizeTotpCode,
  verifyTotpCode,
} from '../src/lib/totp';

const EPOCH = 1_800_000_000;

describe('TOTP', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('genera un secreto base32 compatible', () => {
    const secret = createTotpSecret();
    expect(secret).toMatch(/^[A-Z2-7]+=*$/);
    expect(secret.length).toBeGreaterThanOrEqual(26);
  });

  it('genera y verifica un código de 6 dígitos', async () => {
    const secret = createTotpSecret();
    vi.useFakeTimers();
    vi.setSystemTime(new Date(EPOCH * 1000));

    const code = await generateTotpCode(secret, EPOCH);
    expect(code).toMatch(/^\d{6}$/);
    expect(await verifyTotpCode(secret, code)).toBe(true);
  });

  it('acepta el paso anterior y el siguiente (ventana ±1)', async () => {
    const secret = createTotpSecret();
    vi.useFakeTimers();
    vi.setSystemTime(new Date(EPOCH * 1000));

    const previous = await generateTotpCode(secret, EPOCH - 30);
    const next = await generateTotpCode(secret, EPOCH + 30);
    expect(await verifyTotpCode(secret, previous)).toBe(true);
    expect(await verifyTotpCode(secret, next)).toBe(true);
  });

  it('rechaza un código fuera de la ventana', async () => {
    const secret = createTotpSecret();
    vi.useFakeTimers();
    vi.setSystemTime(new Date(EPOCH * 1000));

    const oldCode = await generateTotpCode(secret, EPOCH - 90);
    expect(await verifyTotpCode(secret, oldCode)).toBe(false);
  });

  it('rechaza formatos inválidos y códigos incorrectos', async () => {
    const secret = createTotpSecret();
    vi.useFakeTimers();
    vi.setSystemTime(new Date(EPOCH * 1000));

    const current = await generateTotpCode(secret, EPOCH);
    const wrong = current === '000000' ? '000001' : '000000';

    expect(await verifyTotpCode(secret, '12345')).toBe(false);
    expect(await verifyTotpCode(secret, 'abcdef')).toBe(false);
    expect(await verifyTotpCode(secret, wrong)).toBe(false);
  });

  it('normaliza espacios y valida el formato', () => {
    expect(normalizeTotpCode(' 123 456 ')).toBe('123456');
    expect(isTotpCodeFormat('123 456')).toBe(true);
    expect(isTotpCodeFormat('12345')).toBe(false);
  });

  it('genera una URI otpauth con emisor y cuenta', () => {
    const secret = createTotpSecret();
    const uri = buildTotpUri(secret, 'ivan@casa.local');
    expect(uri).toContain('otpauth://totp/');
    expect(uri).toContain('issuer=casa-os');
    expect(uri).toContain('ivan%40casa.local');
    expect(uri).toContain(`secret=${secret}`);
  });
});
