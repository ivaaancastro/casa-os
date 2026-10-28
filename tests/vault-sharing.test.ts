import { describe, it, expect } from 'vitest';
import {
  canEditAccount,
  isSealedKey,
  recipientChanges,
} from '../src/lib/vault/sharing';

function b64(bytes: number): string {
  return Buffer.alloc(bytes, 3).toString('base64');
}

describe('canEditAccount', () => {
  it('permite siempre al dueño', () => {
    expect(canEditAccount('owner', 'owner', false)).toBe(true);
  });

  it('permite a un destinatario solo con canEdit', () => {
    expect(canEditAccount('owner', 'reader', false)).toBe(false);
    expect(canEditAccount('owner', 'editor', true)).toBe(true);
  });
});

describe('recipientChanges', () => {
  it('detecta altas y bajas', () => {
    expect(recipientChanges(['a', 'b'], ['b', 'c'])).toEqual({
      added: ['c'],
      removed: ['a'],
      rotated: true,
    });
  });

  it('no rota si el conjunto no cambia (aunque cambie el orden)', () => {
    expect(recipientChanges(['a', 'b'], ['b', 'a'])).toEqual({
      added: [],
      removed: [],
      rotated: false,
    });
  });

  it('rota si solo cambia el tamaño', () => {
    expect(recipientChanges(['a'], ['a', 'b']).rotated).toBe(true);
  });
});

describe('isSealedKey', () => {
  it('acepta el tamaño de crypto_box_seal', () => {
    expect(isSealedKey(b64(80))).toBe(true);
  });

  it('rechaza claves sin sellar, base64 inválido y tamaños absurdos', () => {
    expect(isSealedKey(b64(32))).toBe(false);
    expect(isSealedKey('no-es-base64')).toBe(false);
    expect(isSealedKey(b64(512))).toBe(false);
    expect(isSealedKey('')).toBe(false);
  });
});
