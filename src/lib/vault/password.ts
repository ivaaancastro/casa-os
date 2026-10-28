/**
 * Generador de contraseñas y estimación de fortaleza, siempre en el cliente.
 * No se envía nada a ningún servidor.
 */
import { MASTER_PASSWORD_MIN_LENGTH } from './constants';

const LOWER = 'abcdefghijkmnopqrstuvwxyz';
const UPPER = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const DIGITS = '23456789';
const SYMBOLS = '!@#$%^&*()-_=+[]{};:,.?';

const COMMON_PASSWORDS = new Set([
  '123456',
  '123456789',
  '12345678',
  'password',
  'contraseña',
  'qwerty',
  'abc123',
  'iloveyou',
  'admin123',
  'bienvenido',
  'casaos',
  'casa-os',
  'familia',
  'espanol',
  'español',
  '000000',
  '111111',
  '121212',
  'letmein',
  'welcome',
  'monkey',
  'dragon',
  'master',
  'sunshine',
  'princess',
  'football',
  'baseball',
  'superman',
  'trustno1',
  'passw0rd',
]);

export interface PasswordOptions {
  length?: number;
  lowercase?: boolean;
  uppercase?: boolean;
  digits?: boolean;
  symbols?: boolean;
}

export interface PasswordStrength {
  score: 0 | 1 | 2 | 3 | 4;
  label: 'Muy débil' | 'Débil' | 'Aceptable' | 'Fuerte' | 'Muy fuerte';
  entropyBits: number;
  suggestions: string[];
}

function randomIndex(max: number): number {
  if (max <= 0) throw new Error('Rango no válido');
  const buffer = new Uint32Array(1);
  const limit = Math.floor(0x100000000 / max) * max;
  let value = 0;
  do {
    globalThis.crypto.getRandomValues(buffer);
    value = buffer[0];
  } while (value >= limit);
  return value % max;
}

function shuffle<T>(items: T[]): T[] {
  for (let i = items.length - 1; i > 0; i -= 1) {
    const j = randomIndex(i + 1);
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

export function generatePassword(options: PasswordOptions = {}): string {
  const length = Math.min(64, Math.max(12, options.length ?? 20));
  const sets: string[] = [];

  if (options.lowercase !== false) sets.push(LOWER);
  if (options.uppercase !== false) sets.push(UPPER);
  if (options.digits !== false) sets.push(DIGITS);
  if (options.symbols !== false) sets.push(SYMBOLS);

  if (sets.length === 0) throw new Error('Selecciona al menos un tipo de carácter');

  const pool = sets.join('');
  const chars: string[] = sets.map((set) => set[randomIndex(set.length)]);

  while (chars.length < length) {
    chars.push(pool[randomIndex(pool.length)]);
  }

  return shuffle(chars).join('');
}

function characterPool(password: string): number {
  let pool = 0;
  if (/[a-z]/.test(password)) pool += 26;
  if (/[A-Z]/.test(password)) pool += 26;
  if (/[0-9]/.test(password)) pool += 10;
  if (/[^a-zA-Z0-9]/.test(password)) pool += 33;
  return pool || 1;
}

export function passwordStrength(password: string): PasswordStrength {
  const suggestions: string[] = [];
  const lower = password.toLowerCase();

  if (password.length < MASTER_PASSWORD_MIN_LENGTH) {
    suggestions.push(`Usa al menos ${MASTER_PASSWORD_MIN_LENGTH} caracteres`);
  }
  if (COMMON_PASSWORDS.has(lower)) {
    suggestions.push('Esta contraseña es demasiado común');
  }
  if (/^(.)\1+$/.test(password)) {
    suggestions.push('No repitas el mismo carácter');
  }
  if (/^(?:0123|1234|abcd|qwer)/i.test(password)) {
    suggestions.push('Evita secuencias predecibles');
  }

  const entropyBits = Math.round(password.length * Math.log2(characterPool(password)));
  const isCommon = COMMON_PASSWORDS.has(lower);
  const penalized = isCommon ? Math.min(entropyBits, 20) : entropyBits;

  let score: PasswordStrength['score'] = 0;
  if (penalized >= 100) score = 4;
  else if (penalized >= 80) score = 3;
  else if (penalized >= 60) score = 2;
  else if (penalized >= 40) score = 1;

  if (password.length < MASTER_PASSWORD_MIN_LENGTH) score = 0;

  const labels: Record<PasswordStrength['score'], PasswordStrength['label']> = {
    0: 'Muy débil',
    1: 'Débil',
    2: 'Aceptable',
    3: 'Fuerte',
    4: 'Muy fuerte',
  };

  if (score < 3 && suggestions.length === 0) {
    suggestions.push('Añade más longitud o combina mayúsculas, números y símbolos');
  }

  return { score, label: labels[score], entropyBits, suggestions };
}

export function isMasterPasswordAcceptable(password: string): boolean {
  return (
    password.length >= MASTER_PASSWORD_MIN_LENGTH &&
    !COMMON_PASSWORDS.has(password.toLowerCase()) &&
    !/^(.)\1+$/.test(password)
  );
}
