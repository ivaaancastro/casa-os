/**
 * Código de recuperación legible (Crockford base32 + checksum).
 *
 * 32 bytes aleatorios → 55 caracteres en 11 grupos de 5. El checksum detecta
 * erratas al copiarlo a mano; no aporta seguridad.
 */
import sodium from 'libsodium-wrappers-sumo';

const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const GROUP_SIZE = 5;
const PREFIX = 'CASAOS';
const KEY_BYTES = 32;
const CHECKSUM_BYTES = 2;
const TOTAL_BYTES = KEY_BYTES + CHECKSUM_BYTES;

function encodeBase32(bytes: Uint8Array): string {
  let bits = 0;
  let value = 0;
  let output = '';

  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    output += ALPHABET[(value << (5 - bits)) & 31];
  }
  return output;
}

function decodeBase32(input: string): Uint8Array {
  let bits = 0;
  let value = 0;
  const output: number[] = [];

  for (const char of input) {
    const index = ALPHABET.indexOf(char);
    if (index === -1) throw new Error('Carácter no válido en el código');
    value = (value << 5) | index;
    bits += 5;
    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Uint8Array.from(output);
}

async function checksum(key: Uint8Array): Promise<Uint8Array> {
  await sodium.ready;
  const digest = sodium.crypto_hash_sha256(key);
  return digest.subarray(0, CHECKSUM_BYTES);
}

export async function encodeRecoveryKey(key: Uint8Array): Promise<string> {
  if (key.length !== KEY_BYTES) throw new Error('La clave debe tener 32 bytes');
  const sum = await checksum(key);
  const combined = new Uint8Array(TOTAL_BYTES);
  combined.set(key, 0);
  combined.set(sum, KEY_BYTES);

  const raw = encodeBase32(combined);
  const groups: string[] = [];
  for (let i = 0; i < raw.length; i += GROUP_SIZE) {
    groups.push(raw.slice(i, i + GROUP_SIZE));
  }
  return `${PREFIX}-${groups.join('-')}`;
}

export function normalizeRecoveryCode(value: string): string {
  const cleaned = value.toUpperCase().replace(/[^0-9A-Z]/g, '');
  const withoutPrefix = cleaned.startsWith(PREFIX) ? cleaned.slice(PREFIX.length) : cleaned;
  return withoutPrefix
    .replace(/O/g, '0')
    .replace(/[IL]/g, '1');
}

export async function decodeRecoveryCode(value: string): Promise<Uint8Array> {
  const normalized = normalizeRecoveryCode(value);
  if (normalized.length < 40) throw new Error('El código es demasiado corto');

  const bytes = decodeBase32(normalized);
  if (bytes.length < TOTAL_BYTES) throw new Error('El código está incompleto');

  const key = bytes.slice(0, KEY_BYTES);
  const provided = bytes.slice(KEY_BYTES, TOTAL_BYTES);
  const expected = await checksum(key);

  let diff = 0;
  for (let i = 0; i < CHECKSUM_BYTES; i += 1) {
    diff |= (provided[i] ?? 0) ^ expected[i];
  }
  if (diff !== 0) throw new Error('El código no es válido (checksum)');

  return key;
}

/** Formato de ayuda para mostrar en pantalla. */
export function groupRecoveryCode(value: string): string {
  const raw = normalizeRecoveryCode(value);
  const groups: string[] = [];
  for (let i = 0; i < raw.length; i += GROUP_SIZE) {
    groups.push(raw.slice(i, i + GROUP_SIZE));
  }
  return `${PREFIX}-${groups.join('-')}`;
}
