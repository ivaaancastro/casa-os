/** Reglas de permisos de eventos, sin dependencias de Prisma ni React. */
export function canEditEvent(
  event: { createdById: string },
  user: { id: string; role: string },
): boolean {
  return user.role === 'ADMIN' || event.createdById === user.id;
}
