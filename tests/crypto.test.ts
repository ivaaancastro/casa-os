import { describe, it, expect, afterEach } from 'vitest';
import {
  DecryptionError,
  EncryptionConfigError,
  decryptString,
  decryptTotpSecret,
  encryptString,
  encryptTotpSecret,
  parseEncryptionKey,
  safeEqual,
} from '../src/lib/crypto';

const KEY = Buffer.alloc(32, 7);
const CONTEXT = 'test:context';

describe('crypto AES-256-GCM', () => {
  afterEach(() => {
    delete process.env.TOTP_ENCRYPTION_KEY;
  });

  it('cifra y descifra sin exponer el texto plano', () => {
    const payload = encryptString('JBSWY3DPEHPK3PXP', KEY, CONTEXT);
    expect(payload).not.toContain('JBSWY3DPEHPK3PXP');
    expect(decryptString(payload, KEY, CONTEXT)).toBe('JBSWY3DPEHPK3PXP');
  });

  it('usa un IV distinto en cada cifrado', () => {
    const first = encryptString('mismo-secreto', KEY, CONTEXT);
    const second = encryptString('mismo-secreto', KEY, CONTEXT);
    expect(first).not.toBe(second);
  });

  it('rechaza una clave incorrecta', () => {
    const payload = encryptString('secreto', KEY, CONTEXT);
    expect(() => decryptString(payload, Buffer.alloc(32, 8), CONTEXT)).toThrow(
      DecryptionError,
    );
  });

  it('rechaza el payload manipulado', () => {
    const payload = encryptString('secreto', KEY, CONTEXT);
    const parts = payload.split('.');
    // Flip de un bit en el ciphertext
    const rawCiphertext = Buffer.from(parts[3], 'base64url');
    rawCiphertext[rawCiphertext.length - 1] ^= 0x01;
    const tampered = [parts[0], parts[1], parts[2], rawCiphertext.toString('base64url')].join('.');
    expect(() => decryptString(tampered, KEY, CONTEXT)).toThrow(DecryptionError);
  });

  it('rechaza un contexto distinto (AAD)', () => {
    const payload = encryptString('secreto', KEY, CONTEXT);
    expect(() => decryptString(payload, KEY, 'otro:contexto')).toThrow(
      DecryptionError,
    );
  });

  it('valida la clave de 32 bytes en base64', () => {
    expect(parseEncryptionKey(KEY.toString('base64')).length).toBe(32);
    expect(() => parseEncryptionKey(undefined)).toThrow(EncryptionConfigError);
    expect(() => parseEncryptionKey(Buffer.alloc(16).toString('base64'))).toThrow(
      EncryptionConfigError,
    );
  });

  it('cifra y descifra el secreto TOTP con la variable de entorno', () => {
    process.env.TOTP_ENCRYPTION_KEY = KEY.toString('base64');
    const payload = encryptTotpSecret('BASE32SECRET');
    expect(decryptTotpSecret(payload)).toBe('BASE32SECRET');
  });

  it('falla de forma cerrada si falta TOTP_ENCRYPTION_KEY', () => {
    expect(() => encryptTotpSecret('BASE32SECRET')).toThrow(EncryptionConfigError);
  });

  it('compara cadenas en tiempo constante', () => {
    expect(safeEqual('abc', 'abc')).toBe(true);
    expect(safeEqual('abc', 'abd')).toBe(false);
    expect(safeEqual('abc', 'abcd')).toBe(false);
  });
});
