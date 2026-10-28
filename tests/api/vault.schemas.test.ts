import { describe, it, expect } from 'vitest';
import {
  createAccountSchema,
  createVaultSchema,
  deleteVaultSchema,
  resetRecoverySchema,
  updateAccountKeysSchema,
  updateAccountSchema,
  updateRecoverySchema,
} from '../../src/lib/vault/schemas';

function b64(bytes: number): string {
  return Buffer.alloc(bytes, 7).toString('base64');
}

const recovery = {
  kdfSalt: b64(16),
  kdfOpsLimit: 3,
  kdfMemLimit: 64 * 1024 * 1024,
  wrappedKeyring: b64(120),
  nonce: b64(24),
};

const vault = {
  kdfSalt: b64(16),
  kdfOpsLimit: 3,
  kdfMemLimit: 64 * 1024 * 1024,
  authKey: b64(32),
  publicKey: b64(32),
  wrappedKeyring: b64(120),
  keyringNonce: b64(24),
  recovery,
};

const keys = [{ userId: 'user_1', wrappedDek: b64(80), canEdit: false }];

describe('createVaultSchema', () => {
  it('acepta una bóveda completa', () => {
    const parsed = createVaultSchema.parse(vault);
    expect(parsed.kdfOpsLimit).toBe(3);
    expect(parsed.recovery.kdfMemLimit).toBe(64 * 1024 * 1024);
  });

  it('rechaza base64 inválido y parámetros fuera de rango', () => {
    expect(createVaultSchema.safeParse({ ...vault, authKey: 'no base64' }).success).toBe(false);
    expect(createVaultSchema.safeParse({ ...vault, kdfOpsLimit: 0 }).success).toBe(false);
    expect(createVaultSchema.safeParse({ ...vault, kdfMemLimit: 1024 }).success).toBe(false);
    expect(
      createVaultSchema.safeParse({ ...vault, kdfMemLimit: 1024 * 1024 * 1024 }).success,
    ).toBe(false);
  });

  it('exige el kit de recuperación', () => {
    const { recovery: _recovery, ...withoutRecovery } = vault;
    expect(createVaultSchema.safeParse(withoutRecovery).success).toBe(false);
  });
});

describe('cuentas', () => {
  it('acepta una cuenta con destinatarios', () => {
    const parsed = createAccountSchema.parse({
      visibility: 'FAMILY',
      ciphertext: b64(200),
      nonce: b64(24),
      keys,
    });
    expect(parsed.visibility).toBe('FAMILY');
    expect(parsed.keys[0].canEdit).toBe(false);
  });

  it('rechaza visibilidad desconocida, sin claves y duplicados', () => {
    const base = { visibility: 'FAMILY', ciphertext: b64(200), nonce: b64(24) };
    expect(createAccountSchema.safeParse({ ...base, visibility: 'TODO' }).success).toBe(false);
    expect(createAccountSchema.safeParse({ ...base, keys: [] }).success).toBe(false);
    expect(
      createAccountSchema.safeParse({
        ...base,
        keys: [...keys, { userId: 'user_1', wrappedDek: b64(80), canEdit: true }],
      }).success,
    ).toBe(false);
  });

  it('exige revisión entera positiva al editar', () => {
    const base = { ciphertext: b64(200), nonce: b64(24) };
    expect(updateAccountSchema.safeParse({ ...base, revision: 1 }).success).toBe(true);
    expect(updateAccountSchema.safeParse({ ...base, revision: 0 }).success).toBe(false);
    expect(updateAccountSchema.safeParse({ ...base, revision: 1.5 }).success).toBe(false);
  });

  it('valida el reemplazo de destinatarios', () => {
    const base = {
      visibility: 'CUSTOM',
      ciphertext: b64(200),
      nonce: b64(24),
      revision: 2,
      keys,
    };
    expect(updateAccountKeysSchema.safeParse(base).success).toBe(true);
    expect(updateAccountKeysSchema.safeParse({ ...base, revision: 0 }).success).toBe(false);
  });
});

describe('recuperación y borrado', () => {
  it('acepta un kit y un reset completos', () => {
    expect(updateRecoverySchema.safeParse(recovery).success).toBe(true);
    expect(
      resetRecoverySchema.safeParse({
        ...vault,
        code: '123456',
        recovery,
      }).success,
    ).toBe(true);
    expect(
      updateRecoverySchema.safeParse({
        ...recovery,
        contactShares: [{ contactId: 'user_2', wrappedRecoveryKey: b64(80) }],
      }).success,
    ).toBe(true);
  });

  it('exige el código en el reset', () => {
    expect(resetRecoverySchema.safeParse({ ...vault, recovery }).success).toBe(false);
  });

  it('solo borra con la confirmación literal', () => {
    const base = { authKey: b64(32), code: '123456' };
    expect(deleteVaultSchema.safeParse({ ...base, confirm: 'BORRAR' }).success).toBe(true);
    expect(deleteVaultSchema.safeParse({ ...base, confirm: 'borrar' }).success).toBe(false);
    expect(deleteVaultSchema.safeParse({ ...base, confirm: 'BORRA' }).success).toBe(false);
  });
});
