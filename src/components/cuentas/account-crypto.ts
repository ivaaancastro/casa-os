import {
  decryptAccount,
  encryptAccount,
  generateKey,
  memzero,
  toBase64,
  unwrapKeyForRecipient,
  wrapKeyForRecipient,
} from '@/lib/vault/crypto';
import type { Visibility } from '@/lib/vault/constants';
import type {
  AccountPayload,
  VaultAccountRecord,
  VaultMember,
} from '@/lib/vault/types';
import type { VaultSession } from './session';

export interface DecryptedAccount {
  record: VaultAccountRecord;
  payload: AccountPayload;
}

export interface AccountRecipient {
  userId: string;
  publicKey: string;
  canEdit: boolean;
}

export interface AccountKeyInput {
  userId: string;
  wrappedDek: string;
  canEdit: boolean;
}

export function memberLabel(member: Pick<VaultMember, 'name' | 'email'>): string {
  return member.name?.trim() || member.email || 'Miembro';
}

/** Miembros con bóveda, que son los únicos que pueden recibir una DEK. */
export type VaultMemberWithKey = VaultMember & { publicKey: string };

export function membersWithVault(members: VaultMember[]): VaultMemberWithKey[] {
  return members.filter(
    (member): member is VaultMemberWithKey =>
      member.hasVault && typeof member.publicKey === 'string',
  );
}

/**
 * Destinatarios según la visibilidad elegida.
 *
 * `FAMILY` incluye a los miembros con bóveda **de ahora**; un miembro nuevo no
 * recibe retroactivamente las cuentas antiguas.
 */
export function recipientsForVisibility(input: {
  visibility: Visibility;
  ownerId: string;
  members: VaultMember[];
  customIds: string[];
  editIds: string[];
}): AccountRecipient[] {
  const withVault = membersWithVault(input.members);
  const owner = withVault.find((member) => member.id === input.ownerId);

  const selected =
    input.visibility === 'PRIVATE'
      ? []
      : input.visibility === 'FAMILY'
        ? withVault
        : withVault.filter((member) => input.customIds.includes(member.id));

  const recipients = new Map<string, AccountRecipient>();
  if (owner) {
    recipients.set(owner.id, { userId: owner.id, publicKey: owner.publicKey, canEdit: true });
  }
  for (const member of selected) {
    if (member.id === input.ownerId) continue;
    recipients.set(member.id, {
      userId: member.id,
      publicKey: member.publicKey,
      canEdit: input.editIds.includes(member.id),
    });
  }
  return Array.from(recipients.values());
}

export async function decryptRecords(
  records: VaultAccountRecord[],
  session: VaultSession,
): Promise<Array<DecryptedAccount | { record: VaultAccountRecord; payload: null }>> {
  const result: Array<DecryptedAccount | { record: VaultAccountRecord; payload: null }> = [];
  for (const record of records) {
    let dek: Uint8Array | null = null;
    try {
      dek = await unwrapKeyForRecipient(
        record.wrappedDek,
        session.pk,
        toBase64(session.sk),
      );
      const payload = await decryptAccount(record.ciphertext, record.nonce, dek);
      result.push({ record, payload });
    } catch {
      result.push({ record, payload: null });
    } finally {
      memzero(dek);
    }
  }
  return result;
}

/** Descifra una sola cuenta; devuelve `null` si el blob no es válido. */
export async function decryptRecord(
  record: VaultAccountRecord,
  session: VaultSession,
): Promise<AccountPayload | null> {
  let dek: Uint8Array | null = null;
  try {
    dek = await unwrapKeyForRecipient(record.wrappedDek, session.pk, toBase64(session.sk));
    return await decryptAccount(record.ciphertext, record.nonce, dek);
  } catch {
    return null;
  } finally {
    memzero(dek);
  }
}

async function wrapForRecipients(
  dek: Uint8Array,
  recipients: AccountRecipient[],
): Promise<AccountKeyInput[]> {
  const keys: AccountKeyInput[] = [];
  for (const recipient of recipients) {
    keys.push({
      userId: recipient.userId,
      wrappedDek: await wrapKeyForRecipient(dek, recipient.publicKey),
      canEdit: recipient.canEdit,
    });
  }
  return keys;
}

/** Cifra una cuenta nueva con una DEK recién generada. */
export async function encryptNewAccount(
  payload: AccountPayload,
  recipients: AccountRecipient[],
): Promise<{ ciphertext: string; nonce: string; keys: AccountKeyInput[] }> {
  const dek = await generateKey();
  try {
    const encrypted = await encryptAccount(payload, dek);
    return { ...encrypted, keys: await wrapForRecipients(dek, recipients) };
  } finally {
    memzero(dek);
  }
}

/** Re-cifra el contenido con la DEK existente (editar sin compartir). */
export async function encryptWithExistingDek(
  payload: AccountPayload,
  record: VaultAccountRecord,
  session: VaultSession,
): Promise<{ ciphertext: string; nonce: string }> {
  const dek = await unwrapKeyForRecipient(record.wrappedDek, session.pk, toBase64(session.sk));
  try {
    return await encryptAccount(payload, dek);
  } finally {
    memzero(dek);
  }
}

/** Rota la DEK y re-cifra el contenido para el nuevo conjunto. */
export async function rotateAccount(
  payload: AccountPayload,
  recipients: AccountRecipient[],
): Promise<{ ciphertext: string; nonce: string; keys: AccountKeyInput[] }> {
  return encryptNewAccount(payload, recipients);
}
