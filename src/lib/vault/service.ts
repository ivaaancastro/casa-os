import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import type { Visibility } from './constants';

export interface RecipientInput {
  userId: string;
  wrappedDek: string;
  canEdit: boolean;
}

export type RecipientValidation =
  | { ok: true; keys: RecipientInput[] }
  | { ok: false; error: string };

/**
 * Valida el conjunto de destinatarios de una cuenta.
 *
 * - El dueño siempre está incluido y siempre puede editar.
 * - Todo destinatario debe estar activo y tener bóveda (si no, no tiene `pk`).
 * - `PRIVATE` solo admite al dueño.
 * - `FAMILY` exige exactamente los miembros activos con bóveda en este momento;
 *   así «toda la familia» no se convierte en un subconjunto silencioso.
 * - `CUSTOM` admite al dueño y a los miembros con bóveda que se elijan.
 *
 * El servidor no puede comprobar que la DEK esté bien envuelta: solo guarda el
 * blob. La validación protege la coherencia de metadatos, no el secreto.
 */
export async function validateRecipients(input: {
  ownerId: string;
  visibility: Visibility;
  keys: RecipientInput[];
}): Promise<RecipientValidation> {
  const unique = new Map(input.keys.map((key) => [key.userId, key]));
  if (!unique.has(input.ownerId)) {
    return { ok: false, error: 'El dueño debe conservar el acceso a la cuenta' };
  }

  const normalized = Array.from(unique.values()).map((key) =>
    key.userId === input.ownerId ? { ...key, canEdit: true } : key,
  );

  if (input.visibility === 'PRIVATE' && normalized.length !== 1) {
    return { ok: false, error: 'Una cuenta privada solo puede tener al dueño' };
  }

  const userIds = normalized.map((key) => key.userId).filter((id) => id !== input.ownerId);

  if (userIds.length > 0) {
    const recipients = await prisma.user.findMany({
      where: {
        id: { in: userIds },
        active: true,
        vault: { isNot: null },
      },
      select: { id: true },
    });

    if (recipients.length !== userIds.length) {
      return {
        ok: false,
        error: 'Algún destinatario no está activo o todavía no tiene bóveda',
      };
    }
  }

  if (input.visibility === 'FAMILY') {
    const family = await prisma.user.findMany({
      where: { active: true, vault: { isNot: null } },
      select: { id: true },
    });
    const expected = new Set(family.map((member) => member.id));
    const provided = new Set(normalized.map((key) => key.userId));

    if (expected.size !== provided.size || Array.from(expected).some((id) => !provided.has(id))) {
      return {
        ok: false,
        error: 'La familia cambió mientras guardabas. Vuelve a compartir la cuenta',
      };
    }
  }

  return { ok: true, keys: normalized };
}

/** Miembros activos con bóveda, con la clave pública que necesitan los demás. */
export function listMembersWithVault() {
  return prisma.user.findMany({
    where: { active: true },
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      email: true,
      vault: { select: { publicKey: true } },
    },
  });
}

export function memberPublicKey(member: {
  vault: { publicKey: string } | null;
}): string | null {
  return member.vault?.publicKey ?? null;
}

const AUTH_HASH_COST = 12;

/** El servidor solo guarda el hash del verificador; nunca la master password. */
export function hashAuthKey(authKey: string): Promise<string> {
  return bcrypt.hash(authKey, AUTH_HASH_COST);
}

export function verifyAuthKey(authKey: string, hash: string): Promise<boolean> {
  return bcrypt.compare(authKey, hash);
}

export interface VaultBlobSource {
  kdfSalt: string;
  kdfOpsLimit: number;
  kdfMemLimit: number;
  publicKey: string;
  wrappedKeyring: string;
  keyringNonce: string;
  keyringVersion: number;
}

/** Respuesta común de crear/desbloquear: blobs opacos, nunca `authHash`. */
export function vaultPayload(vault: VaultBlobSource) {
  return {
    kdfSalt: vault.kdfSalt,
    kdfOpsLimit: vault.kdfOpsLimit,
    kdfMemLimit: vault.kdfMemLimit,
    publicKey: vault.publicKey,
    wrappedKeyring: vault.wrappedKeyring,
    keyringNonce: vault.keyringNonce,
    keyringVersion: vault.keyringVersion,
  };
}
