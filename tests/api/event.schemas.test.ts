import { describe, expect, it } from 'vitest';
import {
  eventInputSchema,
  listEventsQuerySchema,
} from '../../src/lib/schemas/event';

const timed = {
  title: 'Cena familiar',
  description: 'Con los abuelos',
  allDay: false,
  start: '2026-10-24T18:00:00.000Z',
  end: '2026-10-24T20:00:00.000Z',
  reminderMinutes: 60,
  ownerId: 'user-1',
};

const allDay = {
  title: 'Cumpleaños de Ana',
  allDay: true,
  start: '2026-10-25',
  end: null,
  reminderMinutes: 1440,
  ownerId: null,
};

describe('eventInputSchema', () => {
  it('acepta un evento con hora', () => {
    const data = eventInputSchema.parse(timed);
    expect(data.title).toBe('Cena familiar');
    expect(data.allDay).toBe(false);
    expect(data.reminderMinutes).toBe(60);
    expect(data.ownerId).toBe('user-1');
  });

  it('acepta un evento de todo el día', () => {
    const data = eventInputSchema.parse(allDay);
    expect(data.allDay).toBe(true);
    expect(data.end).toBeNull();
    expect(data.ownerId).toBeNull();
  });

  it('convierte descripción y responsable vacíos en null', () => {
    const data = eventInputSchema.parse({
      ...timed,
      description: '   ',
      ownerId: '',
    });
    expect(data.description).toBeNull();
    expect(data.ownerId).toBeNull();
  });

  it('acepta un evento sin recordatorio', () => {
    expect(
      eventInputSchema.parse({ ...timed, reminderMinutes: null })
        .reminderMinutes,
    ).toBeNull();
  });

  it('rechaza un título vacío o demasiado largo', () => {
    expect(() => eventInputSchema.parse({ ...timed, title: '  ' })).toThrow();
    expect(() =>
      eventInputSchema.parse({ ...timed, title: 'a'.repeat(121) }),
    ).toThrow();
  });

  it('rechaza una descripción demasiado larga', () => {
    expect(() =>
      eventInputSchema.parse({ ...timed, description: 'a'.repeat(1001) }),
    ).toThrow();
  });

  it('rechaza un recordatorio no permitido', () => {
    expect(() =>
      eventInputSchema.parse({ ...timed, reminderMinutes: 5 }),
    ).toThrow();
    expect(() =>
      eventInputSchema.parse({ ...timed, reminderMinutes: '60' }),
    ).toThrow();
  });

  it('rechaza un evento con hora sin fin', () => {
    expect(() =>
      eventInputSchema.parse({ ...timed, end: null }),
    ).toThrow();
  });

  it('rechaza un fin anterior o igual al inicio', () => {
    expect(() =>
      eventInputSchema.parse({ ...timed, end: timed.start }),
    ).toThrow();
    expect(() =>
      eventInputSchema.parse({ ...timed, end: '2026-10-24T17:00:00.000Z' }),
    ).toThrow();
  });

  it('rechaza una fecha con hora sin zona', () => {
    expect(() =>
      eventInputSchema.parse({ ...timed, start: '2026-10-24T18:00' }),
    ).toThrow();
  });

  it('rechaza un fin en un evento de todo el día', () => {
    expect(() =>
      eventInputSchema.parse({ ...allDay, end: '2026-10-26' }),
    ).toThrow();
  });

  it('rechaza una fecha de todo el día imposible', () => {
    expect(() =>
      eventInputSchema.parse({ ...allDay, start: '2026-02-30' }),
    ).toThrow();
    expect(() =>
      eventInputSchema.parse({ ...allDay, start: '2026-10-25T00:00:00Z' }),
    ).toThrow();
  });
});

describe('listEventsQuerySchema', () => {
  const from = '2026-10-01T00:00:00.000Z';
  const to = '2026-11-01T00:00:00.000Z';

  it('acepta un rango válido o ningún rango', () => {
    expect(listEventsQuerySchema.parse({ from, to })).toEqual({ from, to });
    expect(listEventsQuerySchema.parse({})).toEqual({
      from: undefined,
      to: undefined,
    });
  });

  it('exige ambos extremos', () => {
    expect(() => listEventsQuerySchema.parse({ from })).toThrow();
    expect(() => listEventsQuerySchema.parse({ to })).toThrow();
  });

  it('rechaza un rango invertido o inválido', () => {
    expect(() =>
      listEventsQuerySchema.parse({ from: to, to: from }),
    ).toThrow();
    expect(() =>
      listEventsQuerySchema.parse({ from: 'hola', to }),
    ).toThrow();
  });
});
