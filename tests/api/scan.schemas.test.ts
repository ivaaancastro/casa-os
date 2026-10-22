import { describe, expect, it } from 'vitest';
import { importScanSchema } from '../../src/lib/schemas/scan';
import { SCAN_MAX_DEVICES } from '../../src/lib/utils/scan';

const device = { ip: '192.168.1.10' };

describe('importScanSchema', () => {
  it('acepta lo mínimo y previsualiza por defecto', () => {
    const result = importScanSchema.parse({ devices: [device] });

    expect(result.dryRun).toBe(true);
    expect(result.devices).toEqual([device]);
  });

  it('acepta versión 1 y dryRun explícito', () => {
    const result = importScanSchema.parse({
      version: 1,
      scannedAt: '2026-10-20T18:00:00.000Z',
      cidr: ' 192.168.1.0/24 ',
      dryRun: false,
      devices: [device],
    });

    expect(result.version).toBe(1);
    expect(result.dryRun).toBe(false);
    expect(result.cidr).toBe('192.168.1.0/24');
  });

  it('rechaza una versión desconocida', () => {
    expect(
      importScanSchema.safeParse({ version: 2, devices: [device] }).success,
    ).toBe(false);
  });

  it('rechaza una lista vacía', () => {
    expect(importScanSchema.safeParse({ devices: [] }).success).toBe(false);
  });

  it('acepta hasta el máximo y rechaza uno más', () => {
    const max = Array.from({ length: SCAN_MAX_DEVICES }, (_, index) => ({
      ip: `192.168.1.${(index % 254) + 1}`,
    }));

    expect(importScanSchema.safeParse({ devices: max }).success).toBe(true);
    expect(
      importScanSchema.safeParse({
        devices: [...max, { ip: '192.168.1.200' }],
      }).success,
    ).toBe(false);
  });

  it('rechaza una IP ausente y un tipo incorrecto', () => {
    expect(importScanSchema.safeParse({ devices: [{}] }).success).toBe(false);
    expect(importScanSchema.safeParse({ devices: 'no' }).success).toBe(false);
  });

  it('rechaza dryRun que no sea booleano', () => {
    expect(
      importScanSchema.safeParse({ dryRun: 'sí', devices: [device] }).success,
    ).toBe(false);
  });

  it('normaliza espacios y acepta MAC nula', () => {
    const result = importScanSchema.parse({
      devices: [
        {
          ip: ' 192.168.1.10 ',
          mac: null,
          vendor: ' Apple ',
          name: ' Salón ',
        },
      ],
    });

    expect(result.devices[0]).toEqual({
      ip: '192.168.1.10',
      mac: null,
      vendor: 'Apple',
      name: 'Salón',
    });
  });

  it('rechaza nombres demasiado largos', () => {
    expect(
      importScanSchema.safeParse({
        devices: [{ ...device, name: 'x'.repeat(81) }],
      }).success,
    ).toBe(false);
  });

  it('deja la MAC inválida a la clasificación', () => {
    const result = importScanSchema.parse({
      devices: [{ ...device, mac: 'no-es-una-mac' }],
    });

    expect(result.devices[0].mac).toBe('no-es-una-mac');
  });

  it('acepta la selección de IPs a importar', () => {
    const result = importScanSchema.parse({
      devices: [device],
      importIps: [' 192.168.1.10 ', '192.168.1.20'],
    });

    expect(result.importIps).toEqual(['192.168.1.10', '192.168.1.20']);
  });

  it('rechaza IPs de selección inválidas o demasiadas', () => {
    expect(
      importScanSchema.safeParse({
        devices: [device],
        importIps: ['no-es-ip'],
      }).success,
    ).toBe(false);

    const tooMany = Array.from(
      { length: SCAN_MAX_DEVICES + 1 },
      (_, index) => `10.0.0.${index % 254}`,
    );
    expect(
      importScanSchema.safeParse({ devices: [device], importIps: tooMany })
        .success,
    ).toBe(false);
  });

  it('valida el CIDR cuando se envía', () => {
    expect(
      importScanSchema.safeParse({
        devices: [device],
        cidr: '192.168.1.0/24',
      }).success,
    ).toBe(true);
    expect(
      importScanSchema.safeParse({ devices: [device], cidr: '192.168.1.0/99' })
        .success,
    ).toBe(false);
    expect(
      importScanSchema.safeParse({ devices: [device], cidr: 'hola' }).success,
    ).toBe(false);
  });

  it('acepta una fecha pasada y rechaza una futura o inválida', () => {
    expect(
      importScanSchema.safeParse({
        devices: [device],
        scannedAt: '2026-10-20T18:00:00.000Z',
      }).success,
    ).toBe(true);

    expect(
      importScanSchema.safeParse({
        devices: [device],
        scannedAt: '2999-01-01T00:00:00.000Z',
      }).success,
    ).toBe(false);

    expect(
      importScanSchema.safeParse({ devices: [device], scannedAt: 'ayer' })
        .success,
    ).toBe(false);
  });
});
