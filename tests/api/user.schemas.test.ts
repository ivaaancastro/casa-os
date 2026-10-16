import { describe, it, expect } from 'vitest';
import {
  createUserSchema,
  updateUserSchema,
  updateProfileSchema,
  changePasswordSchema,
  USER_ROLES,
  PASSWORD_MIN,
} from '../../src/lib/schemas/user';

describe('schemas - createUserSchema', () => {
  it('acepta datos validos', () => {
    const result = createUserSchema.safeParse({
      name: 'Marta',
      email: 'marta@casa.local',
      role: 'FAMILY',
      password: 'contrasena123',
    });
    expect(result.success).toBe(true);
  });

  it.each(USER_ROLES)('acepta rol %s', (role) => {
    const result = createUserSchema.safeParse({
      name: 'Marta',
      email: 'marta@casa.local',
      role,
      password: 'contrasena123',
    });
    expect(result.success).toBe(true);
  });

  it('normaliza email a minusculas y recorta espacios', () => {
    const result = createUserSchema.safeParse({
      name: '  Marta  ',
      email: '  Marta@Casa.Local ',
      role: 'FAMILY',
      password: 'contrasena123',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('Marta');
      expect(result.data.email).toBe('marta@casa.local');
    }
  });

  it('rechaza email invalido', () => {
    const result = createUserSchema.safeParse({
      name: 'Marta',
      email: 'no-es-un-email',
      role: 'FAMILY',
      password: 'contrasena123',
    });
    expect(result.success).toBe(false);
  });

  it('rechaza nombre vacio', () => {
    const result = createUserSchema.safeParse({
      name: '   ',
      email: 'marta@casa.local',
      role: 'FAMILY',
      password: 'contrasena123',
    });
    expect(result.success).toBe(false);
  });

  it(`rechaza contrasena de menos de ${PASSWORD_MIN} caracteres`, () => {
    const result = createUserSchema.safeParse({
      name: 'Marta',
      email: 'marta@casa.local',
      role: 'FAMILY',
      password: 'corta',
    });
    expect(result.success).toBe(false);
  });

  it('rechaza rol invalido', () => {
    const result = createUserSchema.safeParse({
      name: 'Marta',
      email: 'marta@casa.local',
      role: 'SUPER' as never,
      password: 'contrasena123',
    });
    expect(result.success).toBe(false);
  });
});

describe('schemas - updateUserSchema', () => {
  it('acepta solo name', () => {
    expect(updateUserSchema.safeParse({ name: 'Marta' }).success).toBe(true);
  });

  it('acepta solo role', () => {
    expect(updateUserSchema.safeParse({ role: 'ADMIN' }).success).toBe(true);
  });

  it('acepta solo active', () => {
    expect(updateUserSchema.safeParse({ active: false }).success).toBe(true);
  });

  it('acepta cambio de contrasena', () => {
    expect(updateUserSchema.safeParse({ password: 'nuevacontrasena' }).success).toBe(true);
  });

  it('rechaza objeto vacio (nada que actualizar)', () => {
    expect(updateUserSchema.safeParse({}).success).toBe(false);
  });

  it(`rechaza contrasena de menos de ${PASSWORD_MIN} caracteres`, () => {
    expect(updateUserSchema.safeParse({ password: 'corta' }).success).toBe(false);
  });

  it('rechaza active no-boolean', () => {
    expect(updateUserSchema.safeParse({ active: 'si' as never }).success).toBe(false);
  });
});

describe('schemas - updateProfileSchema', () => {
  it('acepta nombre valido', () => {
    expect(updateProfileSchema.safeParse({ name: 'Ivan' }).success).toBe(true);
  });

  it('rechaza nombre vacio', () => {
    expect(updateProfileSchema.safeParse({ name: '' }).success).toBe(false);
  });
});

describe('schemas - changePasswordSchema', () => {
  it('acepta cambio valido', () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: 'admin123',
      newPassword: 'nuevacontrasena',
    });
    expect(result.success).toBe(true);
  });

  it('rechaza contrasena actual vacia', () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: '',
      newPassword: 'nuevacontrasena',
    });
    expect(result.success).toBe(false);
  });

  it(`rechaza nueva contrasena de menos de ${PASSWORD_MIN} caracteres`, () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: 'admin123',
      newPassword: 'corta',
    });
    expect(result.success).toBe(false);
  });
});
