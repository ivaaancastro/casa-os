/**
 * Reglas puras de compartición. Sin Prisma ni red: fáciles de testear.
 */

/** `crypto_box_seal` de 32 B produce 80 B; el base64 ronda 108 caracteres. */
export function isSealedKey(value: string): boolean {
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(value) || value.length % 4 !== 0) return false;
  const bytes = Buffer.from(value, 'base64').length;
  return bytes >= 80 && bytes <= 256;
}

/** Dueño siempre puede editar; un destinatario solo con `canEdit`. */
export function canEditAccount(
  ownerId: string,
  userId: string,
  canEdit: boolean,
): boolean {
  return ownerId === userId || canEdit;
}

/** Diferencia de destinatarios para auditar concesiones y revocaciones. */
export function recipientChanges(
  previousIds: string[],
  nextIds: string[],
): { added: string[]; removed: string[]; rotated: boolean } {
  const previous = new Set(previousIds);
  const next = new Set(nextIds);
  const added = Array.from(next).filter((id) => !previous.has(id));
  const removed = Array.from(previous).filter((id) => !next.has(id));
  return {
    added,
    removed,
    rotated: added.length > 0 || removed.length > 0 || previous.size !== next.size,
  };
}
