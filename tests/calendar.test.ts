import { describe, expect, it } from 'vitest';
import {
  dateFromKey,
  dateKey,
  eventOverlapsDay,
  eventsForDay,
  formatDayLong,
  formatEventTime,
  formatMonthTitle,
  formatReminder,
  formatTime,
  formatWeekTitle,
  localInputToIso,
  monthGrid,
  monthRange,
  sortEvents,
  startOfWeek,
  toLocalDateTimeInput,
  weekDays,
  weekRange,
} from '../src/lib/utils/calendar';
import { canEditEvent } from '../src/lib/utils/event';

describe('claves de fecha', () => {
  it('convierte una fecha local a YYYY-MM-DD', () => {
    expect(dateKey(new Date(2026, 9, 5, 18, 30))).toBe('2026-10-05');
  });

  it('parsea una clave a mediodía local', () => {
    const date = dateFromKey('2026-10-22');
    expect(date?.getFullYear()).toBe(2026);
    expect(date?.getMonth()).toBe(9);
    expect(date?.getDate()).toBe(22);
    expect(date?.getHours()).toBe(12);
  });

  it('rechaza fechas imposibles y formatos raros', () => {
    expect(dateFromKey('2026-02-30')).toBeNull();
    expect(dateFromKey('2026-2-3')).toBeNull();
    expect(dateFromKey('hola')).toBeNull();
  });
});

describe('rejilla de mes', () => {
  it('empieza en lunes y siempre tiene 42 días', () => {
    const grid = monthGrid(new Date(2026, 9, 22), new Date(2026, 9, 22));
    expect(grid).toHaveLength(42);
    expect(grid[0].key).toBe('2026-09-28');
    expect(grid[41].key).toBe('2026-11-08');
    expect(grid[0].date.getDay()).toBe(1);
  });

  it('marca el día de hoy y los días fuera del mes', () => {
    const grid = monthGrid(new Date(2026, 9, 22), new Date(2026, 9, 22));
    const today = grid.find((day) => day.key === '2026-10-22');
    expect(today?.isToday).toBe(true);
    expect(today?.inMonth).toBe(true);
    expect(grid[0].inMonth).toBe(false);
  });

  it('incluye el 29 de febrero en un año bisiesto', () => {
    const grid = monthGrid(new Date(2028, 1, 12), new Date(2028, 1, 12));
    expect(grid.some((day) => day.key === '2028-02-29')).toBe(true);
  });

  it('calcula el rango completo de la rejilla', () => {
    const range = monthRange(new Date(2026, 9, 22), new Date(2026, 9, 22));
    expect(dateKey(range.from)).toBe('2026-09-28');
    expect(dateKey(range.to)).toBe('2026-11-09');
  });
});

describe('semana', () => {
  it('va de lunes a domingo', () => {
    const days = weekDays(new Date(2026, 9, 22), new Date(2026, 9, 22));
    expect(days).toHaveLength(7);
    expect(days[0].key).toBe('2026-10-19');
    expect(days[6].key).toBe('2026-10-25');
  });

  it('normaliza cualquier día a su lunes', () => {
    expect(dateKey(startOfWeek(new Date(2026, 9, 25)))).toBe('2026-10-19');
    expect(dateKey(startOfWeek(new Date(2026, 9, 19)))).toBe('2026-10-19');
  });

  it('calcula el rango de la semana', () => {
    const range = weekRange(new Date(2026, 9, 22), new Date(2026, 9, 22));
    expect(dateKey(range.from)).toBe('2026-10-19');
    expect(dateKey(range.to)).toBe('2026-10-26');
  });
});

describe('eventos por día', () => {
  const day = new Date(2026, 9, 24);

  it('pinta un evento de todo el día en su fecha UTC', () => {
    expect(
      eventOverlapsDay(
        {
          start: '2026-10-24T00:00:00.000Z',
          end: null,
          allDay: true,
        },
        day,
      ),
    ).toBe(true);
  });

  it('pinta un evento con hora en su día local', () => {
    const start = new Date(2026, 9, 24, 18, 0).toISOString();
    const end = new Date(2026, 9, 24, 20, 0).toISOString();
    expect(eventOverlapsDay({ start, end, allDay: false }, day)).toBe(true);
  });

  it('pinta un evento que cruza medianoche en ambos días', () => {
    const start = new Date(2026, 9, 24, 23, 0).toISOString();
    const end = new Date(2026, 9, 25, 1, 0).toISOString();
    const event = { start, end, allDay: false };
    expect(eventOverlapsDay(event, day)).toBe(true);
    expect(eventOverlapsDay(event, new Date(2026, 9, 25))).toBe(true);
    expect(eventOverlapsDay(event, new Date(2026, 9, 26))).toBe(false);
  });

  it('respeta los límites del día', () => {
    const start = new Date(2026, 9, 23, 23, 0).toISOString();
    const end = new Date(2026, 9, 24, 0, 0).toISOString();
    expect(eventOverlapsDay({ start, end, allDay: false }, day)).toBe(false);
  });

  it('ordena todo el día primero y luego por hora', () => {
    const events = [
      {
        title: 'Tarde',
        start: new Date(2026, 9, 24, 18, 0).toISOString(),
        end: new Date(2026, 9, 24, 19, 0).toISOString(),
        allDay: false,
      },
      {
        title: 'Todo el día',
        start: '2026-10-24T00:00:00.000Z',
        end: null,
        allDay: true,
      },
      {
        title: 'Mañana',
        start: new Date(2026, 9, 24, 9, 0).toISOString(),
        end: new Date(2026, 9, 24, 10, 0).toISOString(),
        allDay: false,
      },
    ];

    expect(sortEvents(events).map((event) => event.title)).toEqual([
      'Todo el día',
      'Mañana',
      'Tarde',
    ]);
    expect(eventsForDay(events, day)).toHaveLength(3);
  });
});

describe('formatos', () => {
  it('formatea mes y semana en español', () => {
    expect(formatMonthTitle(new Date(2026, 9, 22))).toContain('Octubre');
    expect(formatMonthTitle(new Date(2026, 9, 22))).toContain('2026');
    expect(formatWeekTitle(new Date(2026, 9, 22))).toContain('oct');
    expect(formatWeekTitle(new Date(2026, 9, 22))).toContain('2026');
    expect(formatDayLong(new Date(2026, 9, 22))).toContain('Jueves');
  });

  it('formatea horas y eventos', () => {
    expect(formatTime(new Date(2026, 9, 24, 9, 5))).toBe('09:05');
    expect(
      formatEventTime({
        start: new Date(2026, 9, 24, 9, 5).toISOString(),
        end: new Date(2026, 9, 24, 10, 0).toISOString(),
        allDay: false,
      }),
    ).toContain('09:05');
    expect(
      formatEventTime({
        start: '2026-10-24T00:00:00.000Z',
        end: null,
        allDay: true,
      }),
    ).toBe('Todo el día');
  });

  it('traduce recordatorios', () => {
    expect(formatReminder(null)).toBe('Sin recordatorio');
    expect(formatReminder(0)).toBe('A la hora');
    expect(formatReminder(60)).toBe('1 h antes');
    expect(formatReminder(1440)).toBe('1 día antes');
  });
});

describe('inputs de formulario', () => {
  it('convierte datetime-local a ISO y vuelve', () => {
    const iso = localInputToIso('2026-10-24T18:30');
    expect(iso).not.toBeNull();
    expect(toLocalDateTimeInput(iso!)).toBe('2026-10-24T18:30');
  });

  it('rechaza un datetime-local vacío', () => {
    expect(localInputToIso('')).toBeNull();
  });
});

describe('permisos de evento', () => {
  it('permite al creador y al ADMIN', () => {
    expect(
      canEditEvent({ createdById: 'u1' }, { id: 'u1', role: 'FAMILY' }),
    ).toBe(true);
    expect(
      canEditEvent({ createdById: 'u2' }, { id: 'u1', role: 'ADMIN' }),
    ).toBe(true);
  });

  it('bloquea a otro miembro', () => {
    expect(
      canEditEvent({ createdById: 'u2' }, { id: 'u1', role: 'FAMILY' }),
    ).toBe(false);
  });
});
