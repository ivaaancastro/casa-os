import { createCipheriv, createDecipheriv, randomBytes, timingSafeEqual } from 'node:crypto';

const PAYLOAD_VERSION = 'v1';
const IV_BYTES = 12;
const KEY_BYTES = 32;
const TOTP_CONTEXT = 'casa-os:totp:v1';

export class EncryptionConfigError extends Error {
  constructor(message = 'La clave de cifrado no esta configurada correctamente') {
    super(message);
    this.name = 'EncryptionConfigError';
  }
}

export class DecryptionError extends Error {
  constructor(message = 'No se pudo descifrar el secreto') {
    super(message);
    this.name = 'DecryptionError';
  }
}

/**
 * Convierte una clave base64 (32 bytes) en un Buffer.
 * Se usa `timingSafeEqual` solo para comparar longitudes de forma explicita;
 * el valor de la clave nunca se registra ni se devuelve.
 */
export function parseEncryptionKey(raw: string | undefined, envName = 'TOTP_ENCRYPTION_KEY'): Buffer {
  if (!raw) {
    throw new EncryptionConfigError(`Falta ${envName}`);
  }

  let key: Buffer;
  try {
    key = Buffer.from(raw.trim(), 'base64');
  } catch {
    throw new EncryptionConfigError(`${envName} no es base64 valido`);
  }

  if (key.length !== KEY_BYTES) {
    throw new EncryptionConfigError(`${envName} debe tener 32 bytes en base64`);
  }

  return key;
}

export function isEncryptionConfigured(envName = 'TOTP_ENCRYPTION_KEY'): boolean {
  try {
    parseEncryptionKey(process.env[envName], envName);
    return true;
  } catch {
    return false;
  }
}

/** AES-256-GCM. El contexto (AAD) impide reutilizar un payload en otro dominio. */
export function encryptString(plaintext: string, key: Buffer, context: string): string {
  if (key.length !== KEY_BYTES) {
    throw new EncryptionConfigError(`La clave debe tener ${KEY_BYTES} bytes`);
  }
  if (!context) {
    throw new Error('El contexto de cifrado es obligatorio');
  }

  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  cipher.setAAD(Buffer.from(context, 'utf8'));

  const ciphertext = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return [
    PAYLOAD_VERSION,
    iv.toString('base64url'),
    tag.toString('base64url'),
    ciphertext.toString('base64url'),
  ].join('.');
}

export function decryptString(payload: string, key: Buffer, context: string): string {
  if (key.length !== KEY_BYTES) {
    throw new EncryptionConfigError(`La clave debe tener ${KEY_BYTES} bytes`);
  }

  const parts = payload.split('.');
  if (parts.length !== 4 || parts[0] !== PAYLOAD_VERSION) {
    throw new DecryptionError('El formato del secreto no es valido');
  }

  const [, ivPart, tagPart, ciphertextPart] = parts;
  const iv = Buffer.from(ivPart, 'base64url');
  const tag = Buffer.from(tagPart, 'base64url');
  const ciphertext = Buffer.from(ciphertextPart, 'base64url');

  if (iv.length !== IV_BYTES || tag.length !== 16) {
    throw new DecryptionError('El formato del secreto no es valido');
  }

  try {
    const decipher = createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAAD(Buffer.from(context, 'utf8'));
    decipher.setAuthTag(tag);
    return Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]).toString('utf8');
  } catch {
    throw new DecryptionError();
  }
}

export function getTotpEncryptionKey(): Buffer {
  return parseEncryptionKey(process.env.TOTP_ENCRYPTION_KEY);
}

export function encryptTotpSecret(secret: string): string {
  return encryptString(secret, getTotpEncryptionKey(), TOTP_CONTEXT);
}

export function decryptTotpSecret(payload: string): string {
  return decryptString(payload, getTotpEncryptionKey(), TOTP_CONTEXT);
}

/** Compara dos cadenas en tiempo constante (para hashes de recuperacion). */
export function safeEqual(a: string, b: string): boolean {
  const aBuffer = Buffer.from(a, 'utf8');
  const bBuffer = Buffer.from(b, 'utf8');
  if (aBuffer.length !== bBuffer.length) return false;
  return timingSafeEqual(aBuffer, bBuffer);
}

/** Cifrado AES-256‑GCM para contraseñas (contexto propio para no colisionar con el TOTP). */
export function encryptPassword(raw: string): string {
  const key = getTotpEncryptionKey();
  return encryptString(raw, key, 'casa-os:password-manager:v1');
}

/** Descifrado AES‑256‑GCM para contraseñas. */
export function decryptPassword(payload: string): string {
  const key = getTotpEncryptionKey();
  return decryptString(payload, key, 'casa-os:password-manager:v1');
}
