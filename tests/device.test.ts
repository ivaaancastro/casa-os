import { describe, it, expect } from 'vitest';
import {
  DEVICE_TYPES,
  DEVICE_TYPE_LABELS,
  normalizeMac,
  formatDeviceStatus,
} from '../src/lib/utils/device';

describe('normalizeMac', () => {
  it.each([
    ['AA:BB:CC:DD:EE:FF', 'AA:BB:CC:DD:EE:FF'],
    ['aa:bb:cc:dd:ee:ff', 'AA:BB:CC:DD:EE:FF'],
    ['AA-BB-CC-DD-EE-FF', 'AA:BB:CC:DD:EE:FF'],
    ['aabb.ccdd.eeff', 'AA:BB:CC:DD:EE:FF'],
    ['AABBCCDDEEFF', 'AA:BB:CC:DD:EE:FF'],
    ['  aa bb cc dd ee ff  ', 'AA:BB:CC:DD:EE:FF'],
  ])('normaliza %s', (input, expected) => {
    expect(normalizeMac(input)).toBe(expected);
  });

  it.each(['', '   ', 'AA:BB:CC:DD:EE', 'GG:BB:CC:DD:EE:FF', 'hola'])(
    'devuelve null para %s',
    (input) => {
      expect(normalizeMac(input)).toBeNull();
    },
  );
});

describe('formatDeviceStatus', () => {
  const now = new Date('2026-10-20T12:00:00.000Z');
  const ago = (ms: number) => new Date(now.getTime() - ms);

  it('prioriza el estado en línea', () => {
    expect(
      formatDeviceStatus({ online: true, lastSeen: ago(86_400_000) }, now),
    ).toBe('En línea');
  });

  it('sin lastSeen devuelve "Sin datos"', () => {
    expect(formatDeviceStatus({ online: false, lastSeen: null }, now)).toBe(
      'Sin datos',
    );
  });

  it('menos de un minuto es "Ahora"', () => {
    expect(
      formatDeviceStatus({ online: false, lastSeen: ago(30_000) }, now),
    ).toBe('Ahora');
  });

  it('formatea minutos, horas y días', () => {
    expect(
      formatDeviceStatus({ online: false, lastSeen: ago(5 * 60_000) }, now),
    ).toBe('Hace 5 min');
    expect(
      formatDeviceStatus({ online: false, lastSeen: ago(3 * 3_600_000) }, now),
    ).toBe('Hace 3 h');
    expect(
      formatDeviceStatus({ online: false, lastSeen: ago(2 * 86_400_000) }, now),
    ).toBe('Hace 2 días');
    expect(
      formatDeviceStatus({ online: false, lastSeen: ago(86_400_000) }, now),
    ).toBe('Hace 1 día');
  });

  it('a partir de una semana muestra la fecha', () => {
    const status = formatDeviceStatus(
      { online: false, lastSeen: ago(30 * 86_400_000) },
      now,
    );

    expect(status).toContain('2026');
    expect(status).not.toContain('Hace');
  });

  it('acepta fechas ISO', () => {
    expect(
      formatDeviceStatus(
        { online: false, lastSeen: ago(10 * 60_000).toISOString() },
        now,
      ),
    ).toBe('Hace 10 min');
  });

  it('una fecha inválida se trata como sin datos', () => {
    expect(
      formatDeviceStatus({ online: false, lastSeen: 'no-es-fecha' }, now),
    ).toBe('Sin datos');
  });
});

describe('catálogo de tipos', () => {
  it('todos los tipos tienen etiqueta', () => {
    for (const type of DEVICE_TYPES) {
      expect(DEVICE_TYPE_LABELS[type]).toBeTruthy();
    }
  });
});
