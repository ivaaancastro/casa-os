import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from './auth';
import { prisma } from './prisma';

export interface AuthUser {
  id: string;
  role: string;
  sessionVersion: number;
  name?: string | null;
  email?: string | null;
}

/**
 * Devuelve el usuario de la sesion actual si el token sigue siendo valido.
 * Comprueba en base de datos que la cuenta sigue activa y que `sessionVersion`
 * coincide; un cambio de contrasena o de 2FA invalida los JWT anteriores.
 */
export async function getSessionUser(): Promise<AuthUser | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true, active: true, sessionVersion: true },
  });

  if (!dbUser?.active) return null;

  const tokenVersion = session.user.sessionVersion ?? 0;
  if (tokenVersion !== dbUser.sessionVersion) return null;

  return {
    id: dbUser.id,
    role: dbUser.role,
    sessionVersion: dbUser.sessionVersion,
    name: session.user.name,
    email: session.user.email,
  };
}

export function isAdmin(user: Pick<AuthUser, 'role'> | null | undefined): boolean {
  return user?.role === 'ADMIN';
}

type GuardResult = { user: AuthUser; response?: never } | { user?: never; response: NextResponse };

/** Exige sesion valida. Devuelve `{ user }` o `{ response }` con el 401 listo. */
export async function requireUser(): Promise<GuardResult> {
  const user = await getSessionUser();
  if (!user) {
    return { response: NextResponse.json({ error: 'No autorizado' }, { status: 401 }) };
  }
  return { user };
}

/** Exige sesion con rol ADMIN. Devuelve `{ user }` o `{ response }` con el error listo. */
export async function requireAdmin(): Promise<GuardResult> {
  const auth = await requireUser();
  if (auth.response) return auth;

  if (!isAdmin(auth.user)) {
    return { response: NextResponse.json({ error: 'Prohibido' }, { status: 403 }) };
  }
  return { user: auth.user };
}
