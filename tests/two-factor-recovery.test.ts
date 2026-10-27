import { describe, it, expect } from 'vitest';
import {
  generateRecoveryCodes,
  formatRecoveryCode,
  isRecoveryCodeFormat,
  normalizeRecoveryCode,
  hashRecoveryCode,
  recoveryCodeHashesMatch,
} from '../src/lib/two-factor-recovery';

describe('Two Factor Recovery Codes', () => {
  it('genera 10 códigos con formato válido', () => {
    const codes = generateRecoveryCodes(10);
    expect(codes.length).toBe(10);
    for (const code of codes) {
      expect(isRecoveryCodeFormat(code)).toBe(true);
      expect(code).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/);
    }
  });

  it('normaliza y formatea correctamente los códigos', () => {
    const raw = ' abc-1234 ';
    expect(normalizeRecoveryCode(raw)).toBe('ABC1234');
    expect(formatRecoveryCode('abcdefgh')).toBe('ABCD-EFGH');
  });

  it('genera hashes SHA-256 correctos y permite la validación', () => {
    const code = 'ABCD-EFGH';
    const hash = hashRecoveryCode(code);
    expect(hash).toHaveLength(64);
    expect(recoveryCodeHashesMatch(hash, hash)).toBe(true);
  });
});
