import { describe, it, expect } from 'vitest';
import { validateUserUpdate } from '../src/lib/utils/user-rules';

const base = {
  isSelf: false,
  currentRole: 'FAMILY',
  currentActive: true,
  activeAdminCount: 2,
};

describe('validateUserUpdate', () => {
  it('permite editar el nombre sin cambios de rol/estado', () => {
    expect(validateUserUpdate(base)).toBeNull();
  });

  it('impide que un usuario se desactive a si mismo', () => {
    const error = validateUserUpdate({ ...base, isSelf: true, currentRole: 'ADMIN', nextActive: false });
    expect(error).toMatch(/desactivar tu propia cuenta/i);
  });

  it('impide degradar al ultimo admin activo', () => {
    const error = validateUserUpdate({
      isSelf: false,
      currentRole: 'ADMIN',
      currentActive: true,
      activeAdminCount: 1,
      nextRole: 'FAMILY',
    });
    expect(error).toMatch(/al menos un administrador activo/i);
  });

  it('impide desactivar al ultimo admin activo', () => {
    const error = validateUserUpdate({
      isSelf: false,
      currentRole: 'ADMIN',
      currentActive: true,
      activeAdminCount: 1,
      nextActive: false,
    });
    expect(error).toMatch(/al menos un administrador activo/i);
  });

  it('permite degradar a un admin cuando hay mas de uno', () => {
    const error = validateUserUpdate({
      isSelf: false,
      currentRole: 'ADMIN',
      currentActive: true,
      activeAdminCount: 2,
      nextRole: 'FAMILY',
    });
    expect(error).toBeNull();
  });

  it('permite desactivar a un FAMILY', () => {
    const error = validateUserUpdate({ ...base, nextActive: false });
    expect(error).toBeNull();
  });

  it('permite promover a un FAMILY a ADMIN', () => {
    const error = validateUserUpdate({ ...base, nextRole: 'ADMIN' });
    expect(error).toBeNull();
  });

  it('permite desactivar a un admin inactivo (ya no cuenta)', () => {
    const error = validateUserUpdate({
      isSelf: false,
      currentRole: 'ADMIN',
      currentActive: false,
      activeAdminCount: 1,
      nextActive: false,
    });
    expect(error).toBeNull();
  });
});
