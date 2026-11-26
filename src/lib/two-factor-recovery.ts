import bcrypt from 'bcryptjs';
import { randomInt } from 'node:crypto';

export const RECOVERY_CODE_COUNT = 10;
export const RECOVERY_CODE_LENGTH = 8;

// Sin caracteres ambiguos (I, O, 0, 1) para que se puedan transcribir a mano.
const RECOVERY_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

// Coste moderado: los códigos tienen ~40 bits, bcrypt ralentiza la fuerza bruta
// offline si la base de datos se filtra. Se mantiene estable para que los códigos
// existentes (hasheados con este coste) sigan verificándose.
const RECOVERY_HASH_COST = 10;

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

/** Hash bcrypt del codigo normalizado. El codigo en claro nunca se guarda. */
export async function hashRecoveryCode(value: string): Promise<string> {
  const normalized = normalizeRecoveryCode(value);
  return bcrypt.hash(normalized, RECOVERY_HASH_COST);
}

export async function recoveryCodeHashesMatch(
  code: string,
  hash: string,
): Promise<boolean> {
  const normalized = normalizeRecoveryCode(code);
  try {
    return await bcrypt.compare(normalized, hash);
  } catch {
    return false;
  }
}