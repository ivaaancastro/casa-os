import type { Visibility } from './constants';

/** Contenido que solo existe en claro en el navegador. */
export interface AccountField {
  label: string;
  value: string;
}

export interface AccountPayload {
  title: string;
  username: string;
  password: string;
  url: string;
  notes: string;
  category: string;
  customFields: AccountField[];
}

export interface VaultKeyring {
  sk: string;
  pk: string;
  version: 1;
}

/** Metadatos + ciphertext que devuelve el servidor. */
export interface VaultAccountRecord {
  id: string;
  ownerId: string;
  visibility: Visibility;
  ciphertext: string;
  nonce: string;
  revision: number;
  canEdit: boolean;
  wrappedDek: string;
  keys: Array<{ userId: string; canEdit: boolean }>;
  createdAt: string;
  updatedAt: string;
}

export interface VaultMember {
  id: string;
  name: string | null;
  email: string | null;
  publicKey: string | null;
  hasVault: boolean;
}

export interface VaultPasskeySummary {
  id: string;
  createdAt: string;
  lastUsedAt: string | null;
}

export interface VaultRecoverySummary {
  configured: boolean;
  updatedAt: string | null;
}

export interface VaultContactSummary {
  id: string;
  ownerId: string;
  contactId: string;
  ownerName: string | null;
  ownerEmail: string | null;
  contactName: string | null;
  contactEmail: string | null;
  status: 'PENDING' | 'ACCEPTED' | 'STALE' | 'REVOKED';
  createdAt: string;
  acceptedAt: string | null;
  direction: 'outgoing' | 'incoming';
}

export interface VaultStatusResponse {
  twoFactorEnabled: boolean;
  grantActive: boolean;
  vault: null | {
    createdAt: string;
    updatedAt: string;
    kdfSalt: string;
    kdfOpsLimit: number;
    kdfMemLimit: number;
    publicKey: string;
    keyringVersion: number;
    passkeys: VaultPasskeySummary[];
    recovery: VaultRecoverySummary;
    contacts: VaultContactSummary[];
  };
}

export interface RecoveryKit {
  version: 1;
  email: string;
  createdAt: string;
  recoveryKey: string;
  instructions: string;
}
