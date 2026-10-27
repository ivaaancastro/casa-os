import { describe, it, expect } from 'vitest';
import {
  enableTwoFactorSchema,
  disableTwoFactorSchema,
  regenerateRecoveryCodesSchema,
} from '../../src/lib/schemas/two-factor';

describe('Two Factor Zod Schemas', () => {
  it('valida el esquema de activación', () => {
    expect(enableTwoFactorSchema.safeParse({ code: '123456' }).success).toBe(true);
    expect(enableTwoFactorSchema.safeParse({ code: '12345' }).success).toBe(false);
  });

  it('valida el esquema de desactivación', () => {
    // Caso con código TOTP
    expect(
      disableTwoFactorSchema.safeParse({
        password: 'password123',
        code: '123456',
      }).success
    ).toBe(true);

    // Caso con código de recuperación (asumiendo formato ABCD-EFGH)
    expect(
      disableTwoFactorSchema.safeParse({
        password: 'password123',
        recoveryCode: 'ABCD-EFGH',
      }).success
    ).toBe(true);

    // Falla sin ninguno
    expect(
      disableTwoFactorSchema.safeParse({
        password: 'password123',
      }).success
    ).toBe(false);

    // Falla con ambos
    expect(
      disableTwoFactorSchema.safeParse({
        password: 'password123',
        code: '123456',
        recoveryCode: 'ABCD-EFGH',
      }).success
    ).toBe(false);
  });

  it('valida el esquema de regeneración', () => {
    expect(
      regenerateRecoveryCodesSchema.safeParse({
        password: 'password123',
        code: '123456',
      }).success
    ).toBe(true);
  });
});
