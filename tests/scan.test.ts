import { describe, expect, it } from 'vitest';
import {
  SCAN_MAX_DEVICES,
  SCAN_STATUS_LABELS,
  buildScanPayload,
  classifyScanDevices,
  isValidCidr,
  isValidIpv4,
  parseNmapOutput,
  suggestDeviceName,
  type ExistingScanDevice,
} from '../src/lib/utils/scan';

describe('isValidIpv4', () => {
  it.each(['192.168.1.1', '10.0.0.1', '0.0.0.0', '255.255.255.255'])(
    'acepta %s',
    (ip) => {
      expect(isValidIpv4(ip)).toBe(true);
    },
  );

  it.each(['192.168.1', '192.168.1.256', '01.2.3.4', 'hola', ''])(
    'rechaza %s',
    (ip) => {
      expect(isValidIpv4(ip)).toBe(false);
    },
  );
});

describe('isValidCidr', () => {
  it.each([
    '192.168.1.0/24',
    '10.0.0.0/8',
    '0.0.0.0/0',
    '192.168.1.1/32',
  ])('acepta %s', (cidr) => {
    expect(isValidCidr(cidr)).toBe(true);
  });

  it.each([
    '192.168.1.0',
    '/24',
    '192.168.1.0/33',
    '192.168.1.0/024',
    '192.168.1.256/24',
    '01.2.3.4/24',
    'hola',
    '',
  ])('rechaza %s', (cidr) => {
    expect(isValidCidr(cidr)).toBe(false);
  });
});

describe('parseNmapOutput', () => {
  it('extrae IP, MAC y fabricante en los formatos habituales', () => {
    const output = `
Starting Nmap 7.95 ( https://nmap.org ) at 2026-10-20 18:00 CEST
Nmap scan report for 192.168.1.1
Host is up (0.0020s latency).
MAC Address: AA:BB:CC:DD:EE:01 (Router Co.)

Nmap scan report for macbook.local (192.168.1.20)
Host is up (0.010s latency).
MAC Address: aa-bb-cc-dd-ee-02 (Apple, Inc.)

Nmap scan report for 192.168.1.30
Host is up (0.030s latency).

Nmap scan report for 192.168.1.40
Host is down.
`;

    expect(parseNmapOutput(output)).toEqual([
      {
        ip: '192.168.1.1',
        mac: 'AA:BB:CC:DD:EE:01',
        vendor: 'Router Co.',
      },
      {
        ip: '192.168.1.20',
        mac: 'AA:BB:CC:DD:EE:02',
        vendor: 'Apple, Inc.',
      },
      { ip: '192.168.1.30' },
    ]);
  });

  it('deduplica por IP y por MAC', () => {
    const output = `
Nmap scan report for 192.168.1.50
Host is up.
MAC Address: AA:BB:CC:DD:EE:05 (Uno)

Nmap scan report for 192.168.1.50
Host is up.
MAC Address: AA:BB:CC:DD:EE:06 (Otro)

Nmap scan report for 192.168.1.51
Host is up.
MAC Address: AA:BB:CC:DD:EE:05 (Uno)
`;

    expect(parseNmapOutput(output)).toEqual([
      {
        ip: '192.168.1.50',
        mac: 'AA:BB:CC:DD:EE:05',
        vendor: 'Uno',
      },
    ]);
  });

  it('ignora líneas malformadas y MAC inválidas', () => {
    const output = `
Nmap scan report for 192.168.1.60
Host is up.
MAC Address: no-es-una-mac (Raro)

Nmap scan report for host.local (192.168.1.61)
Host is up.
`;

    expect(parseNmapOutput(output)).toEqual([
      { ip: '192.168.1.60' },
      { ip: '192.168.1.61' },
    ]);
  });

  it('devuelve una lista vacía si no hay informes', () => {
    expect(parseNmapOutput('Starting Nmap\nNmap done')).toEqual([]);
  });
});

describe('buildScanPayload', () => {
  it('construye el JSON versionado y recorta campos vacíos', () => {
    const payload = buildScanPayload(
      '192.168.1.0/24',
      [
        {
          ip: '192.168.1.10',
          mac: 'AA:BB:CC:DD:EE:10',
          vendor: 'Apple',
        },
        { ip: '192.168.1.11', vendor: '  ' },
      ],
      new Date('2026-10-20T18:00:00.000Z'),
    );

    expect(payload).toEqual({
      version: 1,
      scannedAt: '2026-10-20T18:00:00.000Z',
      cidr: '192.168.1.0/24',
      devices: [
        {
          ip: '192.168.1.10',
          mac: 'AA:BB:CC:DD:EE:10',
          vendor: 'Apple',
        },
        { ip: '192.168.1.11' },
      ],
    });
  });
});

describe('suggestDeviceName', () => {
  it('prioriza el nombre explícito', () => {
    expect(
      suggestDeviceName({
        ip: '192.168.1.10',
        name: '  Salón  ',
        vendor: 'Apple',
      }),
    ).toBe('Salón');
  });

  it('usa fabricante e IP cuando no hay nombre', () => {
    expect(
      suggestDeviceName({ ip: '192.168.1.10', vendor: 'Apple' }),
    ).toBe('Apple (192.168.1.10)');
  });

  it('usa un nombre genérico si no hay nada más', () => {
    expect(suggestDeviceName({ ip: '192.168.1.10' })).toBe(
      'Dispositivo 192.168.1.10',
    );
  });

  it('recorta nombres demasiado largos', () => {
    const name = suggestDeviceName({
      ip: '192.168.1.10',
      name: 'x'.repeat(100),
    });

    expect(name).toHaveLength(80);
    expect(name.endsWith('...')).toBe(true);
  });
});

describe('classifyScanDevices', () => {
  const existing: ExistingScanDevice[] = [
    {
      id: 'router',
      name: 'Router',
      ip: '192.168.1.1',
      mac: 'AA:BB:CC:DD:EE:01',
    },
    {
      id: 'tv',
      name: 'TV',
      ip: '192.168.1.2',
      mac: 'AA:BB:CC:DD:EE:02',
    },
  ];

  function classify(devices: Parameters<typeof classifyScanDevices>[0]['devices']) {
    return classifyScanDevices({ devices, existing });
  }

  it('marca como nuevo lo que no existe', () => {
    expect(
      classify([{ ip: '192.168.1.10', mac: 'AA:BB:CC:DD:EE:10' }])[0],
    ).toMatchObject({
      status: 'new',
      reason: 'No existe en el inventario',
      existingDevice: null,
    });
  });

  it('detecta existente por IP', () => {
    expect(
      classify([{ ip: '192.168.1.1', mac: 'AA:BB:CC:DD:EE:99' }])[0],
    ).toMatchObject({
      status: 'existing',
      reason: 'Ya existe un dispositivo con esa IP',
      existingDevice: { id: 'router', name: 'Router' },
    });
  });

  it('detecta existente por MAC', () => {
    expect(
      classify([{ ip: '192.168.1.99', mac: 'AA:BB:CC:DD:EE:02' }])[0],
    ).toMatchObject({
      status: 'existing',
      reason: 'Ya existe un dispositivo con esa MAC',
      existingDevice: { id: 'tv', name: 'TV' },
    });
  });

  it('detecta existente cuando coinciden IP y MAC', () => {
    expect(
      classify([{ ip: '192.168.1.1', mac: 'AA:BB:CC:DD:EE:01' }])[0],
    ).toMatchObject({
      status: 'existing',
      reason: 'Ya existe (IP y MAC coinciden)',
      existingDevice: { id: 'router' },
    });
  });

  it('detecta un conflicto entre dos dispositivos', () => {
    expect(
      classify([{ ip: '192.168.1.1', mac: 'AA:BB:CC:DD:EE:02' }])[0],
    ).toMatchObject({
      status: 'conflict',
      reason: 'La IP y la MAC pertenecen a dispositivos distintos',
      ipDevice: { id: 'router' },
      macDevice: { id: 'tv' },
    });
  });

  it('marca duplicados dentro del archivo', () => {
    const items = classify([
      { ip: '192.168.1.10', mac: 'AA:BB:CC:DD:EE:10' },
      { ip: '192.168.1.10', mac: 'AA:BB:CC:DD:EE:11' },
      { ip: '192.168.1.12', mac: 'AA:BB:CC:DD:EE:10' },
    ]);

    expect(items.map((item) => item.status)).toEqual([
      'new',
      'duplicate',
      'duplicate',
    ]);
    expect(items[1].reason).toBe('Repetido en el archivo');
  });

  it('valida IP y MAC', () => {
    const items = classify([
      { ip: '999.168.1.10', mac: 'AA:BB:CC:DD:EE:10' },
      { ip: '192.168.1.11', mac: 'no-es-una-mac' },
    ]);

    expect(items.map((item) => item.status)).toEqual(['invalid', 'invalid']);
    expect(items[0].reason).toBe('La IP no es válida');
    expect(items[1].reason).toBe('La MAC no es válida');
  });

  it('sin MAC solo compara por IP', () => {
    expect(classify([{ ip: '192.168.1.1' }])[0]).toMatchObject({
      status: 'existing',
      existingDevice: { id: 'router' },
    });
  });

  it('asigna nombres sugeridos', () => {
    const items = classify([
      { ip: '192.168.1.10', vendor: 'Apple' },
      { ip: '192.168.1.11', name: 'Portátil' },
      { ip: '192.168.1.12' },
    ]);

    expect(items.map((item) => item.suggestedName)).toEqual([
      'Apple (192.168.1.10)',
      'Portátil',
      'Dispositivo 192.168.1.12',
    ]);
  });

  it('expone etiquetas para todos los estados', () => {
    expect(Object.keys(SCAN_STATUS_LABELS)).toHaveLength(5);
    expect(SCAN_MAX_DEVICES).toBe(512);
  });
});
