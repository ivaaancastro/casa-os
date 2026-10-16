/**
 * Reglas de integridad al modificar un usuario.
 *
 * Funciones puras (sin acceso a base de datos) para poder testearlas de forma
 * aislada: el consumidor calcula el contexto (¿es uno mismo?, ¿cuántos ADMIN
 * activos hay?) y aquí se decide si el cambio es válido.
 */

export interface UserUpdateContext {
  /** El usuario objetivo es el que hace la petición. */
  isSelf: boolean;
  /** Rol actual del usuario objetivo. */
  currentRole: string;
  /** Estado actual del usuario objetivo. */
  currentActive: boolean;
  /** Número de administradores activos en el sistema (incluyendo el objetivo). */
  activeAdminCount: number;
  /** Nuevo rol solicitado (si no se indica, no cambia). */
  nextRole?: string;
  /** Nuevo estado solicitado (si no se indica, no cambia). */
  nextActive?: boolean;
}

/**
 * Devuelve un mensaje de error si el cambio no está permitido, o `null` si es válido.
 *
 * Reglas:
 * - Un usuario no puede desactivarse a sí mismo.
 * - Debe quedar siempre al menos un ADMIN activo.
 */
export function validateUserUpdate(ctx: UserUpdateContext): string | null {
  const nextRole = ctx.nextRole ?? ctx.currentRole;
  const nextActive = ctx.nextActive ?? ctx.currentActive;

  if (ctx.isSelf && nextActive === false) {
    return 'No puedes desactivar tu propia cuenta';
  }

  const wasActiveAdmin = ctx.currentActive && ctx.currentRole === 'ADMIN';
  const willBeActiveAdmin = nextActive && nextRole === 'ADMIN';

  if (wasActiveAdmin && !willBeActiveAdmin && ctx.activeAdminCount <= 1) {
    return 'Debe quedar al menos un administrador activo';
  }

  return null;
}
