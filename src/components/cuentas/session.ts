import {
  fromBase64,
  memzero,
  toBase64,
} from '@/lib/vault/crypto';
import type { VaultKeyring } from '@/lib/vault/types';

/** Claves desbloqueadas, solo en memoria. Nunca se persisten. */
export interface VaultSession {
  pk: string;
  sk: Uint8Array;
  kdfSalt: string;
  kdfOpsLimit: number;
  kdfMemLimit: number;
  keyringVersion: number;
  /** Keyring tal y como lo guarda el servidor (para verificar la password). */
  wrappedKeyring: string;
  keyringNonce: string;
}

export interface VaultBlobPayload {
  kdfSalt: string;
  kdfOpsLimit: number;
  kdfMemLimit: number;
  publicKey: string;
  wrappedKeyring: string;
  keyringNonce: string;
  keyringVersion: number;
}

export function createSession(
  keyring: VaultKeyring,
  blob: VaultBlobPayload,
): VaultSession {
  if (keyring.pk !== blob.publicKey) {
    throw new Error('El keyring no corresponde a esta bóveda');
  }
  return {
    pk: keyring.pk,
    sk: fromBase64(keyring.sk),
    kdfSalt: blob.kdfSalt,
    kdfOpsLimit: blob.kdfOpsLimit,
    kdfMemLimit: blob.kdfMemLimit,
    keyringVersion: blob.keyringVersion,
    wrappedKeyring: blob.wrappedKeyring,
    keyringNonce: blob.keyringNonce,
  };
}

export function sessionKeyring(session: VaultSession): VaultKeyring {
  return {
    sk: toBase64(session.sk),
    pk: session.pk,
    version: 1,
  };
}

export function destroySession(session: VaultSession | null): void {
  if (session) memzero(session.sk);
}
