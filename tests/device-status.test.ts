import { describe, expect, it } from 'vitest';
import {
  formatRelativeTime,
  isIpInCidr,
  parseCidr,
  planStatusUpdates,
  type DeviceStatusRecord,
} from '../src/lib/utils/deviceStatus';

function device(
  overrides: Partial<DeviceStatusRecord> = {},
): DeviceStatusRecord {
  return {
    id: 'dev-1',
    name: 'Router',
    ip: '192.168.1.1',
    mac: null,
    online: false,
    lastSeen: null,
    ...overrides,
  };
}

const scannedAt = new Date('2026-10-22T10:00:00.000Z');
const earlier = new Date('2026-10-22T09:00:00.000Z');
const later = new Date('2026-10-22T11:00:00.000Z');

describe('parseCidr', () => {
  it('calcula la red y el prefijo', () => {
    expect(parseCidr('192.168.1.0/24')).toEqual({
      network: 3232235776,
      prefix: 24,
    });
    expect(parseCidr(' 10.0.0.0/8 ')).toEqual({ network: 167772160, prefix: 8 });
    expect(parseCidr('0.0.0.0/0')).toEqual({ network: 0, prefix: 0 });
  });

  it.each([
    '192.168.1.0',
    '192.168.1.0/33',
    '192.168.1.0/024',
    '192.168.1.256/24',
    'hola/24',
    '',
  ])('rechaza %s', (cidr) => {
    expect(parseCidr(cidr)).toBeNull();
  });
});

describe('isIpInCidr', () => {
  it('detecta dentro y fuera de la red', () => {
    expect(isIpInCidr('192.168.1.1', '192.168.1.0/24')).toBe(true);
    expect(isIpInCidr('192.168.1.255', '192.168.1.0/24')).toBe(true);
    expect(isIpInCidr('192.168.2.1', '192.168.1.0/24')).toBe(false);
    expect(isIpInCidr('10.1.2.3', '10.0.0.0/8')).toBe(true);
  });

  it('soporta /32, /0 e inválidos', () => {
    expect(isIpInCidr('192.168.1.10', '192.168.1.10/32')).toBe(true);
    expect(isIpInCidr('192.168.1.11', '192.168.1.10/32')).toBe(false);
    expect(isIpInCidr('8.8.8.8', '0.0.0.0/0')).toBe(true);
    expect(isIpInCidr('192.168.1.1', 'no-es-cidr')).toBe(false);
    expect(isIpInCidr('no-es-ip', '192.168.1.0/24')).toBe(false);
  });
});

describe('planStatusUpdates', () => {
  const cidr = '192.168.1.0/24';

  it('marca en línea un equipo observado que estaba ausente', () => {
    const plan = planStatusUpdates({
      devices: [device({ id: 'a', online: false, lastSeen: earlier })],
      observedIds: ['a'],
      scannedAt,
      cidr,
    });

    expect(plan.onlineIds).toEqual(['a']);
    expect(plan.connected).toEqual([{ id: 'a', name: 'Router' }]);
    expect(plan.disconnected).toEqual([]);
    expect(plan.stale).toEqual([]);
  });

  it('actualiza lastSeen sin contarlo como alta si ya estaba en línea', () => {
    const plan = planStatusUpdates({
      devices: [device({ id: 'a', online: true, lastSeen: earlier })],
      observedIds: ['a'],
      scannedAt,
      cidr,
    });

    expect(plan.onlineIds).toEqual(['a']);
    expect(plan.connected).toEqual([]);
  });

  it('un equipo nunca visto que aparece cuenta como alta', () => {
    const plan = planStatusUpdates({
      devices: [device({ id: 'a' })],
      observedIds: ['a'],
      scannedAt,
      cidr,
    });

    expect(plan.onlineIds).toEqual(['a']);
    expect(plan.connected).toHaveLength(1);
  });

  it('ignora un escaneo anterior al lastSeen del equipo observado', () => {
    const plan = planStatusUpdates({
      devices: [device({ id: 'a', online: true, lastSeen: later })],
      observedIds: ['a'],
      scannedAt,
      cidr,
    });

    expect(plan.onlineIds).toEqual([]);
    expect(plan.stale).toEqual([
      { id: 'a', name: 'Router', lastSeen: later },
    ]);
  });

  it('marca ausente un equipo dentro del CIDR que ya se había visto', () => {
    const plan = planStatusUpdates({
      devices: [
        device({ id: 'a', online: true, lastSeen: earlier }),
        device({ id: 'b', name: 'TV', ip: '192.168.1.20', online: true, lastSeen: earlier }),
      ],
      observedIds: ['a'],
      scannedAt,
      cidr,
    });

    expect(plan.offlineIds).toEqual(['b']);
    expect(plan.disconnected).toEqual([{ id: 'b', name: 'TV' }]);
  });

  it('no marca ausentes equipos nunca vistos, ya ausentes ni fuera del CIDR', () => {
    const plan = planStatusUpdates({
      devices: [
        device({ id: 'never', lastSeen: null }),
        device({ id: 'offline', online: false, lastSeen: earlier }),
        device({
          id: 'outside',
          ip: '10.0.0.5',
          online: true,
          lastSeen: earlier,
        }),
      ],
      observedIds: [],
      scannedAt,
      cidr,
    });

    expect(plan.offlineIds).toEqual([]);
    expect(plan.disconnected).toEqual([]);
    expect(plan.offlineChecked).toBe(true);
  });

  it('ignora un ausente cuyo lastSeen es posterior al escaneo', () => {
    const plan = planStatusUpdates({
      devices: [device({ id: 'a', online: true, lastSeen: later })],
      observedIds: [],
      scannedAt,
      cidr,
    });

    expect(plan.offlineIds).toEqual([]);
    expect(plan.stale).toHaveLength(1);
  });

  it('sin CIDR actualiza vistos pero no evalúa ausencias', () => {
    const plan = planStatusUpdates({
      devices: [
        device({ id: 'a', online: false, lastSeen: earlier }),
        device({ id: 'b', ip: '192.168.1.20', online: true, lastSeen: earlier }),
      ],
      observedIds: ['a'],
      scannedAt,
      cidr: null,
    });

    expect(plan.onlineIds).toEqual(['a']);
    expect(plan.offlineIds).toEqual([]);
    expect(plan.offlineChecked).toBe(false);
  });

  it('un CIDR inválido no se usa para marcar ausencias', () => {
    const plan = planStatusUpdates({
      devices: [device({ id: 'a', online: true, lastSeen: earlier })],
      observedIds: [],
      scannedAt,
      cidr: '192.168.1.0/99',
    });

    expect(plan.offlineIds).toEqual([]);
    expect(plan.offlineChecked).toBe(false);
  });

  it('no duplica un equipo observado varias veces', () => {
    const plan = planStatusUpdates({
      devices: [device({ id: 'a', online: false })],
      observedIds: ['a', 'a'],
      scannedAt,
      cidr,
    });

    expect(plan.onlineIds).toEqual(['a']);
    expect(plan.connected).toHaveLength(1);
  });

  it('protege de ausencias los equipos con filas ambiguas', () => {
    const plan = planStatusUpdates({
      devices: [device({ id: 'a', online: true, lastSeen: earlier })],
      observedIds: [],
      protectedIds: ['a'],
      scannedAt,
      cidr,
    });

    expect(plan.offlineIds).toEqual([]);
    expect(plan.disconnected).toEqual([]);
    expect(plan.stale).toEqual([]);
  });

  it('un equipo observado se actualiza aunque esté protegido', () => {
    const plan = planStatusUpdates({
      devices: [device({ id: 'a', online: false, lastSeen: earlier })],
      observedIds: ['a'],
      protectedIds: ['a'],
      scannedAt,
      cidr,
    });

    expect(plan.onlineIds).toEqual(['a']);
    expect(plan.connected).toHaveLength(1);
  });
});

describe('formatRelativeTime', () => {
  const now = new Date('2026-10-22T12:00:00.000Z');
  const ago = (ms: number) => new Date(now.getTime() - ms);

  it('formatea ahora, minutos, horas y días', () => {
    expect(formatRelativeTime(ago(30_000), now)).toBe('ahora');
    expect(formatRelativeTime(ago(5 * 60_000), now)).toBe('hace 5 min');
    expect(formatRelativeTime(ago(3 * 3_600_000), now)).toBe('hace 3 h');
    expect(formatRelativeTime(ago(86_400_000), now)).toBe('hace 1 día');
    expect(formatRelativeTime(ago(2 * 86_400_000), now)).toBe('hace 2 días');
  });

  it('a partir de una semana muestra la fecha', () => {
    expect(formatRelativeTime(ago(30 * 86_400_000), now)).toContain('2026');
  });

  it('una fecha inválida devuelve "sin datos"', () => {
    expect(formatRelativeTime('no-es-fecha', now)).toBe('sin datos');
  });
});
