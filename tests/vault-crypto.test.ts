import { describe, it, expect } from 'vitest';
import {
  VaultCryptoError,
  createIdentity,
  decryptAccount,
  decryptJson,
  decryptKeyring,
  deriveMasterKeys,
  derivePasskeyKey,
  deriveRecoveryKek,
  encryptAccount,
  encryptJson,
  encryptKeyring,
  generateKey,
  generateSalt,
  randomBase64,
  toBase64,
  unwrapKeyForRecipient,
  wrapKeyForRecipient,
} from '../src/lib/vault/crypto';
import type { AccountPayload, VaultKeyring } from '../src/lib/vault/types';

const OPS = 1;
const MEM = 16 * 1024 * 1024;
const PASSWORD = 'correct horse battery staple';

const account: AccountPayload = {
  title: 'Google',
  username: 'ivan@example.com',
  password: 'secreto-123',
  url: 'https://accounts.google.com',
  notes: 'Cuenta principal',
  category: 'Google',
  customFields: [{ label: 'Recuperación', value: 'teléfono' }],
};

describe('derivación de claves', () => {
  it('deriva kek y authKey de forma determinista y separada', async () => {
    const salt = await generateSalt();
    const first = await deriveMasterKeys(PASSWORD, salt, OPS, MEM);
    const second = await deriveMasterKeys(PASSWORD, salt, OPS, MEM);

    expect(toBase64(first.kek)).toBe(toBase64(second.kek));
    expect(toBase64(first.authKey)).toBe(toBase64(second.authKey));
    expect(toBase64(first.kek)).not.toBe(toBase64(first.authKey));
    expect(first.kek).toHaveLength(32);
    expect(first.authKey).toHaveLength(32);
  });

  it('cambia con otra sal y rechaza sales inválidas', async () => {
    const salt = await generateSalt();
    const otherSalt = await generateSalt();
    const first = await deriveMasterKeys(PASSWORD, salt, OPS, MEM);
    const second = await deriveMasterKeys(PASSWORD, otherSalt, OPS, MEM);

    expect(toBase64(first.kek)).not.toBe(toBase64(second.kek));
    await expect(deriveMasterKeys(PASSWORD, 'AAAA', OPS, MEM)).rejects.toBeInstanceOf(
      VaultCryptoError,
    );
  });

  it('la clave de recuperación deriva una kek estable', async () => {
    const recoveryKey = await generateKey();
    const salt = await generateSalt();
    const first = await deriveRecoveryKek(recoveryKey, salt, OPS, MEM);
    const second = await deriveRecoveryKek(recoveryKey, salt, OPS, MEM);
    expect(toBase64(first)).toBe(toBase64(second));
  });

  it('la passkey deriva una clave estable a partir del PRF', async () => {
    const output = await generateKey();
    const first = await derivePasskeyKey(output);
    const second = await derivePasskeyKey(output);
    const other = await derivePasskeyKey(await generateKey());
    expect(toBase64(first)).toBe(toBase64(second));
    expect(toBase64(first)).not.toBe(toBase64(other));
  });
});

describe('keyring', () => {
  it('cifra y descifra el keyring con la kek correcta', async () => {
    const identity = await createIdentity();
    const keyring: VaultKeyring = {
      sk: identity.privateKey,
      pk: identity.publicKey,
      version: 1,
    };
    const salt = await generateSalt();
    const { kek } = await deriveMasterKeys(PASSWORD, salt, OPS, MEM);

    const encrypted = await encryptKeyring(keyring, kek);
    const decrypted = await decryptKeyring(
      encrypted.wrappedKeyring,
      encrypted.keyringNonce,
      kek,
    );

    expect(decrypted).toEqual(keyring);
  });

  it('no descifra con otra contraseña ni con ciphertext manipulado', async () => {
    const identity = await createIdentity();
    const keyring: VaultKeyring = { sk: identity.privateKey, pk: identity.publicKey, version: 1 };
    const salt = await generateSalt();
    const { kek } = await deriveMasterKeys(PASSWORD, salt, OPS, MEM);
    const { kek: wrong } = await deriveMasterKeys('otra contraseña larga', salt, OPS, MEM);

    const encrypted = await encryptKeyring(keyring, kek);

    await expect(
      decryptKeyring(encrypted.wrappedKeyring, encrypted.keyringNonce, wrong),
    ).rejects.toBeInstanceOf(VaultCryptoError);

    const tampered = `${encrypted.wrappedKeyring[0] === 'A' ? 'B' : 'A'}${encrypted.wrappedKeyring.slice(1)}`;
    await expect(
      decryptKeyring(tampered, encrypted.keyringNonce, kek),
    ).rejects.toBeInstanceOf(VaultCryptoError);
  });
});

describe('cuentas', () => {
  it('cifra y descifra una cuenta completa', async () => {
    const dek = await generateKey();
    const encrypted = await encryptAccount(account, dek);
    const decrypted = await decryptAccount(encrypted.ciphertext, encrypted.nonce, dek);
    expect(decrypted).toEqual(account);
  });

  it('usa un nonce distinto en cada cifrado', async () => {
    const dek = await generateKey();
    const first = await encryptAccount(account, dek);
    const second = await encryptAccount(account, dek);
    expect(first.nonce).not.toBe(second.nonce);
    expect(first.ciphertext).not.toBe(second.ciphertext);
  });

  it('detecta manipulación del contenido', async () => {
    const dek = await generateKey();
    const encrypted = await encryptAccount(account, dek);
    const tampered = `${encrypted.ciphertext[0] === 'A' ? 'B' : 'A'}${encrypted.ciphertext.slice(1)}`;
    await expect(decryptAccount(tampered, encrypted.nonce, dek)).rejects.toBeInstanceOf(
      VaultCryptoError,
    );
  });

  it('rechaza JSON que no es una cuenta', async () => {
    const key = await generateKey();
    const encrypted = await encryptJson({ hello: 'world' }, key);
    await expect(decryptAccount(encrypted.ciphertext, encrypted.nonce, key)).rejects.toBeInstanceOf(
      VaultCryptoError,
    );
  });
});

describe('sobres X25519', () => {
  it('envuelve una DEK para un destinatario y solo él la abre', async () => {
    const owner = await createIdentity();
    const recipient = await createIdentity();
    const dek = await generateKey();

    const wrapped = await wrapKeyForRecipient(dek, recipient.publicKey);
    const opened = await unwrapKeyForRecipient(
      wrapped,
      recipient.publicKey,
      recipient.privateKey,
    );
    expect(toBase64(opened)).toBe(toBase64(dek));

    await expect(
      unwrapKeyForRecipient(wrapped, owner.publicKey, owner.privateKey),
    ).rejects.toBeInstanceOf(VaultCryptoError);
  });

  it('rechaza una clave pública que no es X25519', async () => {
    const dek = await generateKey();
    await expect(wrapKeyForRecipient(dek, 'no-es-base64')).rejects.toBeInstanceOf(
      VaultCryptoError,
    );
  });
});

describe('utilidades', () => {
  it('randomBase64 devuelve longitudes distintas', async () => {
    expect(Buffer.from(await randomBase64(16), 'base64')).toHaveLength(16);
    expect(Buffer.from(await randomBase64(32), 'base64')).toHaveLength(32);
  });

  it('decryptJson rechaza un nonce inválido', async () => {
    const key = await generateKey();
    const encrypted = await encryptJson({ ok: true }, key);
    await expect(
      decryptJson(encrypted.ciphertext, 'AAAA', key),
    ).rejects.toBeInstanceOf(VaultCryptoError);
  });
});
