import { describe, it, expect } from 'vitest';
import {
  allDayReminderAt,
  buildNotificationPayload,
  dateKeyInTimeZone,
  eventCalendarDateKey,
  getReminderSchedule,
  isWithinDispatchWindow,
  isValidTimeZone,
  parseDateKey,
  reminderTargetUserId,
  scheduledForEvent,
  zonedDateTimeToUtc,
  type ReminderEvent,
} from '../src/lib/reminders';

const MADRID = 'Europe/Madrid';

function event(overrides: Partial<ReminderEvent> = {}): ReminderEvent {
  return {
    id: 'evt_1',
    title: 'Cena familiar',
    start: new Date('2026-10-26T20:00:00.000Z'),
    allDay: false,
    reminderMinutes: 60,
    ownerId: null,
    owner: null,
    ...overrides,
  };
}

describe('utilidades de recordatorios', () => {
  it('valida zonas horarias IANA', () => {
    expect(isValidTimeZone(MADRID)).toBe(true);
    expect(isValidTimeZone('UTC')).toBe(true);
    expect(isValidTimeZone('No/Existe')).toBe(false);
  });

  it('convierte 09:00 local a UTC en invierno y verano', () => {
    expect(
      zonedDateTimeToUtc(2026, 1, 15, 9, 0, MADRID).toISOString(),
    ).toBe('2026-01-15T08:00:00.000Z');
    expect(
      zonedDateTimeToUtc(2026, 7, 15, 9, 0, MADRID).toISOString(),
    ).toBe('2026-07-15T07:00:00.000Z');
  });

  it('respeta los cambios de hora de marzo y octubre', () => {
    expect(
      zonedDateTimeToUtc(2026, 3, 29, 9, 0, MADRID).toISOString(),
    ).toBe('2026-03-29T07:00:00.000Z');
    expect(
      zonedDateTimeToUtc(2026, 10, 25, 9, 0, MADRID).toISOString(),
    ).toBe('2026-10-25T08:00:00.000Z');
  });

  it('programa los eventos de todo el día a las 09:00 locales', () => {
    expect(allDayReminderAt('2026-10-25', 0, MADRID)?.toISOString()).toBe(
      '2026-10-25T08:00:00.000Z',
    );
    expect(allDayReminderAt('2026-10-25', 10, MADRID)?.toISOString()).toBe(
      '2026-10-25T07:50:00.000Z',
    );
    expect(allDayReminderAt('2026-10-25', 60, MADRID)?.toISOString()).toBe(
      '2026-10-25T07:00:00.000Z',
    );
  });

  it('para «1 día antes» resta un día de calendario, no 24 h absolutas', () => {
    // El 25/10/2026 termina el horario de verano. El aviso del día anterior
    // debe ser a las 09:00 del 24/10 (CEST, UTC+2), no a las 08:00.
    expect(allDayReminderAt('2026-10-25', 1440, MADRID)?.toISOString()).toBe(
      '2026-10-24T07:00:00.000Z',
    );
    expect(allDayReminderAt('2026-03-29', 1440, MADRID)?.toISOString()).toBe(
      '2026-03-28T08:00:00.000Z',
    );
  });

  it('rechaza fechas y minutos inválidos', () => {
    expect(parseDateKey('2026-02-30')).toBeNull();
    expect(parseDateKey('2026-10-25')).toEqual({
      year: 2026,
      month: 10,
      day: 25,
    });
    expect(allDayReminderAt('2026-02-30', 0, MADRID)).toBeNull();
    expect(allDayReminderAt('2026-10-25', -1, MADRID)).toBeNull();
    expect(allDayReminderAt('2026-10-25', 0, 'No/Existe')).toBeNull();
  });

  it('calcula el aviso de un evento con hora', () => {
    expect(scheduledForEvent(event(), MADRID)?.toISOString()).toBe(
      '2026-10-26T19:00:00.000Z',
    );
    expect(
      scheduledForEvent(event({ reminderMinutes: 0 }), MADRID)?.toISOString(),
    ).toBe('2026-10-26T20:00:00.000Z');
    expect(scheduledForEvent(event({ reminderMinutes: null }), MADRID)).toBeNull();
  });

  it('calcula el aviso de un evento de todo el día', () => {
    const allDay = event({
      start: new Date('2026-10-25T00:00:00.000Z'),
      allDay: true,
      reminderMinutes: 1440,
    });

    expect(scheduledForEvent(allDay, MADRID)?.toISOString()).toBe(
      '2026-10-24T07:00:00.000Z',
    );
  });

  it('usa la fecha UTC para todo el día y la de la casa para eventos con hora', () => {
    expect(
      eventCalendarDateKey(
        { start: new Date('2026-10-25T00:00:00.000Z'), allDay: true },
        MADRID,
      ),
    ).toBe('2026-10-25');

    expect(
      eventCalendarDateKey(
        { start: new Date('2026-10-25T23:30:00.000Z'), allDay: false },
        MADRID,
      ),
    ).toBe('2026-10-26');

    expect(
      dateKeyInTimeZone(new Date('2026-10-25T23:30:00.000Z'), MADRID),
    ).toBe('2026-10-26');
  });

  it('construye la URL y la fecha del calendario', () => {
    expect(getReminderSchedule(event(), MADRID)).toEqual({
      scheduledFor: new Date('2026-10-26T19:00:00.000Z'),
      dateKey: '2026-10-26',
      url: '/calendario?date=2026-10-26',
    });
  });

  it('calcula la ventana de 15 minutos', () => {
    const now = new Date('2026-10-26T20:00:00.000Z');
    expect(
      isWithinDispatchWindow(new Date('2026-10-26T19:45:00.000Z'), now),
    ).toBe(true);
    expect(
      isWithinDispatchWindow(new Date('2026-10-26T20:00:00.000Z'), now),
    ).toBe(true);
    expect(
      isWithinDispatchWindow(new Date('2026-10-26T19:44:59.999Z'), now),
    ).toBe(false);
    expect(
      isWithinDispatchWindow(new Date('2026-10-26T20:00:00.001Z'), now),
    ).toBe(false);
  });

  it('solo notifica al responsable si el evento lo tiene', () => {
    expect(reminderTargetUserId(event({ ownerId: 'usr_1' }))).toBe('usr_1');
    expect(reminderTargetUserId(event({ ownerId: null }))).toBeNull();
  });

  it('genera el payload de un evento con hora', () => {
    const payload = buildNotificationPayload(
      event({
        title: 'Cena familiar',
        ownerId: 'usr_1',
        owner: { id: 'usr_1', name: 'Iván' },
      }),
      MADRID,
    );

    expect(payload).toEqual({
      title: 'Recordatorio · Cena familiar',
      body: 'Lunes, 26 de octubre a las 21:00 · Para Iván',
      url: '/calendario?date=2026-10-26',
      tag: 'event-evt_1',
      eventId: 'evt_1',
    });
  });

  it('genera el payload de un evento de todo el día', () => {
    const payload = buildNotificationPayload(
      event({
        title: 'Cumpleaños de Ana',
        start: new Date('2026-10-25T00:00:00.000Z'),
        allDay: true,
        reminderMinutes: 1440,
        ownerId: null,
        owner: null,
      }),
      MADRID,
    );

    expect(payload.body).toBe('Domingo, 25 de octubre · Todo el día · Toda la casa');
    expect(payload.url).toBe('/calendario?date=2026-10-25');
  });

  it('no desplaza la fecha del payload de todo el día en otra zona', () => {
    const payload = buildNotificationPayload(
      event({
        title: 'Cumpleaños de Ana',
        start: new Date('2026-10-25T00:00:00.000Z'),
        allDay: true,
        reminderMinutes: 0,
      }),
      'Pacific/Kiritimati',
    );

    expect(payload.url).toBe('/calendario?date=2026-10-25');
    expect(payload.body).toContain('25 de octubre');
  });
});
