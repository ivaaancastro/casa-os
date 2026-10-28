import { describe, it, expect } from 'vitest';
import {
  decodeRecoveryCode,
  encodeRecoveryKey,
  groupRecoveryCode,
  normalizeRecoveryCode,
} from '../src/lib/vault/recovery-code';
import { generateKey, toBase64 } from '../src/lib/vault/crypto';

describe('código de recuperación', () => {
  it('codifica 32 bytes en un código Crockford con checksum', async () => {
    const key = await generateKey();
    const code = await encodeRecoveryKey(key);

    expect(code).toMatch(/^CASAOS(?:-[0-9A-HJKMNP-TV-Z]{5}){11}$/);
    expect(code.split('-')).toHaveLength(12);
  });

  it('hace round-trip del código', async () => {
    const key = await generateKey();
    const code = await encodeRecoveryKey(key);
    const decoded = await decodeRecoveryCode(code);
    expect(toBase64(decoded)).toBe(toBase64(key));
  });

  it('acepta minúsculas, espacios y confusiones O/0, I/L/1', async () => {
    const key = await generateKey();
    const code = await encodeRecoveryKey(key);
    const messy = code.toLowerCase().replace(/-/g, ' ').replace(/0/g, 'O').replace(/1/g, 'I');

    const decoded = await decodeRecoveryCode(messy);
    expect(toBase64(decoded)).toBe(toBase64(key));
  });

  it('detecta un carácter cambiado con el checksum', async () => {
    const key = await generateKey();
    const code = await encodeRecoveryKey(key);
    const normalized = normalizeRecoveryCode(code);
    const index = Math.floor(normalized.length / 2);
    const replacement = normalized[index] === 'Z' ? 'Y' : 'Z';
    const tampered = `${normalized.slice(0, index)}${replacement}${normalized.slice(index + 1)}`;

    await expect(decodeRecoveryCode(tampered)).rejects.toThrow(/checksum/i);
  });

  it('rechaza códigos demasiado cortos o caracteres inválidos', async () => {
    await expect(decodeRecoveryCode('CASAOS-ABC')).rejects.toThrow(/corto/i);
    await expect(
      decodeRecoveryCode('CASAOS-AAAAA-AAAAA-AAAAA-AAAAA-AAAAA-AAAAA-AAAAA-AAAAA-AAAAA-AAAAA-AAAAU'),
    ).rejects.toThrow(/no válido/i);
  });

  it('agrupa un código ya normalizado', async () => {
    const key = await generateKey();
    const code = await encodeRecoveryKey(key);
    expect(groupRecoveryCode(code)).toBe(code);
  });
});
