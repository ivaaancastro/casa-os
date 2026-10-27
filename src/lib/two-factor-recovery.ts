import { createHash, randomInt } from 'node:crypto';
import { safeEqual } from './crypto';

export const RECOVERY_CODE_COUNT = 10;
export const RECOVERY_CODE_LENGTH = 8;

// Sin caracteres ambiguos (I, O, 0, 1) para que se puedan transcribir a mano.
const RECOVERY_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function normalizeRecoveryCode(value: string): string {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export function formatRecoveryCode(value: string): string {
  const normalized = normalizeRecoveryCode(value);
  if (normalized.length !== RECOVERY_CODE_LENGTH) return normalized;
  return `${normalized.slice(0, 4)}-${normalized.slice(4)}`;
}

export function isRecoveryCodeFormat(value: string): boolean {
  const normalized = normalizeRecoveryCode(value);
  if (normalized.length !== RECOVERY_CODE_LENGTH) return false;
  return [...normalized].every((char) => RECOVERY_ALPHABET.includes(char));
}

function createRecoveryCode(): string {
  let code = '';
  for (let i = 0; i < RECOVERY_CODE_LENGTH; i += 1) {
    code += RECOVERY_ALPHABET[randomInt(0, RECOVERY_ALPHABET.length)];
  }
  return formatRecoveryCode(code);
}

export function generateRecoveryCodes(count = RECOVERY_CODE_COUNT): string[] {
  return Array.from({ length: count }, () => createRecoveryCode());
}

/** SHA-256 del codigo normalizado. El codigo en claro nunca se guarda. */
export function hashRecoveryCode(value: string): string {
  const normalized = normalizeRecoveryCode(value);
  return createHash('sha256').update(normalized, 'utf8').digest('hex');
}

export function recoveryCodeHashesMatch(a: string, b: string): boolean {
  return safeEqual(a, b);
}
