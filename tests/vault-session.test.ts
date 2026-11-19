import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  AutoLockController,
  readAutoLockMinutes,
  resolveAutoLockMinutes,
} from '../src/components/cuentas/session-lifecycle';
import { DEFAULT_AUTO_LOCK_MINUTES } from '../src/lib/vault/constants';

describe('resolveAutoLockMinutes', () => {
  it('usa 15 minutos por defecto cuando no hay valor guardado', () => {
    expect(resolveAutoLockMinutes(null)).toBe(15);
    expect(DEFAULT_AUTO_LOCK_MINUTES).toBe(15);
  });

  it('acepta valores entre 1 y 15 minutos', () => {
    for (const value of [1, 2, 5, 10, 15]) {
      expect(resolveAutoLockMinutes(String(value))).toBe(value);
    }
  });

  it('descarta valores fuera de rango o no numéricos', () => {
    for (const value of ['0', '16', '-3', 'abc', '']) {
      expect(resolveAutoLockMinutes(value)).toBe(15);
    }
  });

  it('lee la clave correcta del almacenamiento', () => {
    const read = vi.fn(() => '10');
    expect(readAutoLockMinutes(read)).toBe(10);
    expect(read).toHaveBeenCalledWith('casa-os:cuentas:auto-lock');
  });
});

describe('AutoLockController', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('bloquea tras los minutos configurados', () => {
    const onInactivity = vi.fn();
    const controller = new AutoLockController({ minutes: 15, onInactivity });

    controller.arm();
    expect(controller.delayMs).toBe(15 * 60_000);
    vi.advanceTimersByTime(14 * 60_000);
    expect(onInactivity).not.toHaveBeenCalled();
    vi.advanceTimersByTime(60_000);
    expect(onInactivity).toHaveBeenCalledTimes(1);
  });

  it('reinicia la cuenta con cada actividad', () => {
    const onInactivity = vi.fn();
    const controller = new AutoLockController({ minutes: 15, onInactivity });

    controller.arm();
    vi.advanceTimersByTime(10 * 60_000);
    controller.arm();
    vi.advanceTimersByTime(10 * 60_000);
    expect(onInactivity).not.toHaveBeenCalled();
    vi.advanceTimersByTime(5 * 60_000);
    expect(onInactivity).toHaveBeenCalledTimes(1);
  });

  it('no dispara después de desarmar o disponer', () => {
    const onInactivity = vi.fn();
    const controller = new AutoLockController({ minutes: 15, onInactivity });

    controller.arm();
    controller.disarm();
    vi.advanceTimersByTime(20 * 60_000);
    expect(onInactivity).not.toHaveBeenCalled();

    controller.arm();
    controller.dispose();
    vi.advanceTimersByTime(20 * 60_000);
    expect(onInactivity).not.toHaveBeenCalled();
  });

  it('usa las funciones de temporizador inyectadas', () => {
    const setTimer = vi.fn(() => 42);
    const clearTimer = vi.fn();
    const controller = new AutoLockController({
      minutes: 1,
      onInactivity: vi.fn(),
      setTimer,
      clearTimer,
    });

    controller.arm();
    expect(setTimer).toHaveBeenCalledWith(expect.any(Function), 60_000);
    controller.disarm();
    expect(clearTimer).toHaveBeenCalledWith(42);
  });
});
