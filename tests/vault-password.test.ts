import { describe, it, expect } from 'vitest';
import {
  generatePassword,
  isMasterPasswordAcceptable,
  passwordStrength,
} from '../src/lib/vault/password';

describe('generador de contraseñas', () => {
  it('genera 20 caracteres por defecto con todas las familias', () => {
    const password = generatePassword();
    expect(password).toHaveLength(20);
    expect(password).toMatch(/[a-z]/);
    expect(password).toMatch(/[A-Z]/);
    expect(password).toMatch(/[0-9]/);
    expect(password).toMatch(/[^a-zA-Z0-9]/);
  });

  it('respeta longitud y familias desactivadas', () => {
    const password = generatePassword({
      length: 32,
      symbols: false,
      digits: false,
    });
    expect(password).toHaveLength(32);
    expect(password).toMatch(/^[a-zA-Z]+$/);
  });

  it('limita la longitud entre 12 y 64 y exige al menos una familia', () => {
    expect(generatePassword({ length: 1 })).toHaveLength(12);
    expect(generatePassword({ length: 500 })).toHaveLength(64);
    expect(() =>
      generatePassword({ lowercase: false, uppercase: false, digits: false, symbols: false }),
    ).toThrow(/al menos/i);
  });

  it('no repite la misma contraseña', () => {
    expect(generatePassword()).not.toBe(generatePassword());
  });
});

describe('fortaleza de la master password', () => {
  it('marca como muy débil una contraseña corta o común', () => {
    expect(passwordStrength('corta').score).toBe(0);
    expect(passwordStrength('password').score).toBe(0);
  });

  it('marca como fuerte una frase larga', () => {
    const result = passwordStrength('correct horse battery staple 42');
    expect(result.score).toBeGreaterThanOrEqual(3);
    expect(result.entropyBits).toBeGreaterThan(80);
  });

  it('sugiere longitud cuando falta', () => {
    expect(passwordStrength('abc123').suggestions.join(' ')).toMatch(/12/);
  });

  it('rechaza repetidos y acepta frases', () => {
    expect(isMasterPasswordAcceptable('aaaaaaaaaaaa')).toBe(false);
    expect(isMasterPasswordAcceptable('corta')).toBe(false);
    expect(isMasterPasswordAcceptable('correct horse battery staple')).toBe(true);
  });
});
