import { DEFAULT_AUTO_LOCK_MINUTES } from '../../lib/vault/constants';

export const AUTO_LOCK_STORAGE_KEY = 'casa-os:cuentas:auto-lock';

/** Motivo por el que se ha bloqueado la bóveda (para el aviso al usuario). */
export type VaultLockReason =
  | 'manual'
  | 'background'
  | 'inactivity'
  | 'unmount'
  | 'deleted';

/**
 * Resuelve el tiempo de auto-bloqueo guardado en el navegador.
 * El valor por defecto es 15 min (Fase 2), alineado con el TTL del grant.
 */
export function resolveAutoLockMinutes(stored: string | null): number {
  const value = Number(stored);
  return Number.isFinite(value) && value >= 1 && value <= 15
    ? value
    : DEFAULT_AUTO_LOCK_MINUTES;
}

export function readAutoLockMinutes(
  readStorage: (key: string) => string | null,
): number {
  return resolveAutoLockMinutes(readStorage(AUTO_LOCK_STORAGE_KEY));
}

export type AutoLockDeps = {
  minutes: number;
  onInactivity: () => void;
  setTimer?: (fn: () => void, ms: number) => number;
  clearTimer?: (id: number) => void;
};

/**
 * Temporizador de inactividad de la bóveda, sin dependencias de React ni del
 * navegador: el provider solo conecta eventos y el `memzero`. Así se puede
 * probar con temporizadores falsos en los tests unitarios.
 */
export class AutoLockController {
  private timer: number | null = null;
  private readonly minutes: number;
  private readonly onInactivity: () => void;
  private readonly setTimer: (fn: () => void, ms: number) => number;
  private readonly clearTimer: (id: number) => void;

  constructor({ minutes, onInactivity, setTimer, clearTimer }: AutoLockDeps) {
    this.minutes = minutes;
    this.onInactivity = onInactivity;
    this.setTimer =
      setTimer ??
      ((fn, ms) => globalThis.setTimeout(fn, ms) as unknown as number);
    this.clearTimer =
      clearTimer ??
      ((id) => globalThis.clearTimeout(id as unknown as ReturnType<typeof setTimeout>));
  }

  get delayMs(): number {
    return this.minutes * 60_000;
  }

  arm(): void {
    this.disarm();
    this.timer = this.setTimer(() => {
      this.timer = null;
      this.onInactivity();
    }, this.delayMs);
  }

  disarm(): void {
    if (this.timer !== null) {
      this.clearTimer(this.timer);
      this.timer = null;
    }
  }

  dispose(): void {
    this.disarm();
  }
}
