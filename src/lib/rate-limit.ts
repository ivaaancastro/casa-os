import { createHash } from 'node:crypto';
import { prisma } from './prisma';

export const AUTH_FAILURE_LIMIT = 5;
export const AUTH_FAILURE_WINDOW_MS = 15 * 60_000;

/** Clave estable para limitar por email sin guardar el email en claro. */
export function emailRateLimitKey(email: string): string {
  return createHash('sha256')
    .update(email.trim().toLowerCase(), 'utf8')
    .digest('hex');
}

/** Registra un intento fallido para el email (persistente entre instancias). */
export async function recordAuthFailure(
  key: string,
  now = Date.now(),
): Promise<void> {
  try {
    await prisma.loginAttempt.create({
      data: { emailHash: key, createdAt: new Date(now) },
    });
    // Limpieza best-effort de intentos antiguos para no crecer sin límite.
    await prisma.loginAttempt.deleteMany({
      where: {
        emailHash: key,
        createdAt: { lt: new Date(now - AUTH_FAILURE_WINDOW_MS) },
      },
    });
  } catch {
    // La auditoría no debe romper el flujo de autenticación.
  }
}

/** Comprueba si el email ha superado el límite en la ventana actual. */
export async function isAuthRateLimited(
  key: string,
  now = Date.now(),
): Promise<boolean> {
  try {
    const count = await prisma.loginAttempt.count({
      where: {
        emailHash: key,
        createdAt: { gte: new Date(now - AUTH_FAILURE_WINDOW_MS) },
      },
    });
    return count >= AUTH_FAILURE_LIMIT;
  } catch {
    return false;
  }
}

export async function retryAfterSeconds(
  key: string,
  now = Date.now(),
): Promise<number> {
  try {
    const oldest = await prisma.loginAttempt.findFirst({
      where: { emailHash: key },
      orderBy: { createdAt: 'asc' },
      select: { createdAt: true },
    });
    if (!oldest) return 0;
    return Math.max(
      1,
      Math.ceil(
        (AUTH_FAILURE_WINDOW_MS - (now - oldest.createdAt.getTime())) / 1000,
      ),
    );
  } catch {
    return 0;
  }
}

/** Solo para tests: limpia las ventanas en memoria/base de datos. */
export async function resetRateLimitStore(): Promise<void> {
  try {
    await prisma.loginAttempt.deleteMany({});
  } catch {
    // ignorar en entornos sin BD
  }
}