import { describe, it, expect } from 'vitest';
import {
  createDeviceSchema,
  updateDeviceSchema,
  DEVICE_NAME_MAX,
  DEVICE_NOTES_MAX,
} from '../../src/lib/schemas/device';

const base = { name: 'Router', ip: '192.168.1.1' };

describe('createDeviceSchema', () => {
  it('acepta lo mínimo y aplica el tipo por defecto', () => {
    const data = createDeviceSchema.parse(base);

    expect(data.name).toBe('Router');
    expect(data.ip).toBe('192.168.1.1');
    expect(data.type).toBe('OTHER');
    expect(data.mac ?? null).toBeNull();
    expect(data.notes ?? null).toBeNull();
    expect(data.ownerId ?? null).toBeNull();
  });

  it('recorta campos y normaliza la MAC', () => {
    const data = createDeviceSchema.parse({
      name: '  Router Principal  ',
      ip: '  192.168.1.1  ',
      mac: 'aa-bb-cc-dd-ee-ff',
      type: 'ROUTER',
      notes: '  Salón  ',
    });

    expect(data.name).toBe('Router Principal');
    expect(data.ip).toBe('192.168.1.1');
    expect(data.mac).toBe('AA:BB:CC:DD:EE:FF');
    expect(data.notes).toBe('Salón');
  });

  it.each([
    'AA:BB:CC:DD:EE:FF',
    'aa:bb:cc:dd:ee:ff',
    'AA-BB-CC-DD-EE-FF',
    'aabb.ccdd.eeff',
    'AABBCCDDEEFF',
  ])('acepta y normaliza la MAC %s', (mac) => {
    expect(createDeviceSchema.parse({ ...base, mac }).mac).toBe(
      'AA:BB:CC:DD:EE:FF',
    );
  });

  it.each(['AA:BB:CC:DD:EE', 'GG:BB:CC:DD:EE:FF', 'no-es-mac', 'AABBCCDDEEFFF'])(
    'rechaza la MAC inválida %s',
    (mac) => {
      expect(() => createDeviceSchema.parse({ ...base, mac })).toThrow();
    },
  );

  it.each([
    '192.168.1.256',
    '256.1.1.1',
    '192.168.1',
    '192.168.1.1.1',
    '192.168.01.1',
    'no-es-ip',
    '::1',
  ])('rechaza la IP inválida %s', (ip) => {
    expect(() => createDeviceSchema.parse({ ...base, ip })).toThrow();
  });

  it.each(['0.0.0.0', '192.168.1.1', '255.255.255.255'])(
    'acepta la IP válida %s',
    (ip) => {
      expect(createDeviceSchema.parse({ ...base, ip }).ip).toBe(ip);
    },
  );

  it('rechaza un nombre vacío', () => {
    expect(() => createDeviceSchema.parse({ ...base, name: '   ' })).toThrow();
  });

  it('rechaza un nombre demasiado largo', () => {
    expect(() =>
      createDeviceSchema.parse({ ...base, name: 'a'.repeat(DEVICE_NAME_MAX + 1) }),
    ).toThrow();
  });

  it('rechaza un tipo fuera del catálogo', () => {
    expect(() =>
      createDeviceSchema.parse({ ...base, type: 'TOASTER' }),
    ).toThrow();
  });

  it('rechaza notas demasiado largas', () => {
    expect(() =>
      createDeviceSchema.parse({
        ...base,
        notes: 'a'.repeat(DEVICE_NOTES_MAX + 1),
      }),
    ).toThrow();
  });

  it('convierte MAC y notas vacías en null', () => {
    const data = createDeviceSchema.parse({ ...base, mac: '', notes: '' });
    expect(data.mac).toBeNull();
    expect(data.notes).toBeNull();
  });

  it('descarta online y lastSeen (los gestiona el escáner)', () => {
    const data = createDeviceSchema.parse({
      ...base,
      online: true,
      lastSeen: '2026-01-01T00:00:00.000Z',
    });

    expect('online' in data).toBe(false);
    expect('lastSeen' in data).toBe(false);
  });
});

describe('updateDeviceSchema', () => {
  it('acepta un cambio parcial sin tocar el resto', () => {
    const data = updateDeviceSchema.parse({ name: 'Router nuevo' });

    expect(data.name).toBe('Router nuevo');
    expect(data.mac).toBeUndefined();
    expect(data.notes).toBeUndefined();
    expect(data.ip).toBeUndefined();
    expect(data.type).toBeUndefined();
  });

  it('rechaza un objeto vacío', () => {
    expect(() => updateDeviceSchema.parse({})).toThrow();
  });

  it('rechaza un objeto con solo campos desconocidos', () => {
    expect(() => updateDeviceSchema.parse({ online: true })).toThrow();
  });

  it('permite limpiar MAC y notas con null', () => {
    expect(updateDeviceSchema.parse({ mac: null }).mac).toBeNull();
    expect(updateDeviceSchema.parse({ notes: null }).notes).toBeNull();
    expect(updateDeviceSchema.parse({ notes: '' }).notes).toBeNull();
  });

  it('normaliza la MAC y valida la IP en la edición', () => {
    const data = updateDeviceSchema.parse({
      mac: 'aa:bb:cc:dd:ee:ff',
      ip: '10.0.0.2',
    });

    expect(data.mac).toBe('AA:BB:CC:DD:EE:FF');
    expect(data.ip).toBe('10.0.0.2');
    expect(() => updateDeviceSchema.parse({ ip: '10.0.0.999' })).toThrow();
  });

  it('descarta online y lastSeen', () => {
    const data = updateDeviceSchema.parse({
      name: 'Router nuevo',
      online: true,
      lastSeen: '2026-01-01T00:00:00.000Z',
    });

    expect('online' in data).toBe(false);
    expect('lastSeen' in data).toBe(false);
  });
});
