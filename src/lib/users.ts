import type { Prisma } from '@prisma/client';

/**
 * Campos públicos de un usuario: nunca incluye `password`.
 * Se usa en todas las respuestas que devuelven usuarios.
 */
export const publicUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  active: true,
  twoFactorEnabled: true,
  createdAt: true,
} satisfies Prisma.UserSelect;
