/**
 * Cálculo de recordatorios sin dependencias externas.
 *
 * Los eventos con hora usan su instante UTC. Los eventos de todo el día se
 * interpretan como una fecha de calendario y se avisan a las 09:00 de la zona
 * horaria de la casa (`HOUSE_TIMEZONE`), no a medianoche UTC.
 */

export const DEFAULT_HOUSE_TIMEZONE = 'Europe/Madrid';
export const REMINDER_GRACE_MINUTES = 15;
export const ALL_DAY_REMINDER_HOUR = 9;
export const MAX_DELIVERY_ATTEMPTS = 3;

const MINUTE_MS = 60 * 1000;
const timeZoneCache = new Map<string, boolean>();

export interface ReminderEvent {
  id: string;
  title: string;
  start: Date;
  allDay: boolean;
  reminderMinutes: number | null;
  ownerId?: string | null;
  owner?: { id: string; name: string | null } | null;
}

export interface ReminderSchedule {
  scheduledFor: Date;
  dateKey: string;
  url: string;
}

export interface ReminderNotificationPayload {
  title: string;
  body: string;
  url: string;
  tag: string;
  eventId: string;
}

export interface ZonedParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

/** Valida una zona IANA sin lanzar en cada llamada. */
export function isValidTimeZone(timeZone: string): boolean {
  const cached = timeZoneCache.get(timeZone);
  if (cached !== undefined) return cached;

  let valid = true;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone }).format(new Date(0));
  } catch {
    valid = false;
  }

  timeZoneCache.set(timeZone, valid);
  return valid;
}

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

/** Partes de una fecha en una zona horaria concreta. */
export function getZonedParts(value: Date, timeZone: string): ZonedParts {
  if (!isValidTimeZone(timeZone)) {
    throw new Error(`Zona horaria no válida: ${timeZone}`);
  }

  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(value);

  const result: Record<string, number> = {};
  for (const part of parts) {
    if (part.type !== 'literal') result[part.type] = Number(part.value);
  }

  return {
    year: result.year,
    month: result.month,
    day: result.day,
    hour: result.hour,
    minute: result.minute,
    second: result.second,
  };
}

/**
 * Convierte una fecha/hora local de una zona IANA a UTC.
 *
 * Se ajusta en dos pasadas para resolver el offset y, si existe, el cambio de
 * hora. La hora de los avisos de todo el día (09:00) nunca cae en el salto de
 * DST, pero el helper se testea también en los cambios de hora.
 */
export function zonedDateTimeToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  timeZone: string,
): Date {
  if (!isValidTimeZone(timeZone)) {
    throw new Error(`Zona horaria no válida: ${timeZone}`);
  }

  const target = Date.UTC(year, month - 1, day, hour, minute, 0, 0);
  let timestamp = target;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const actual = getZonedParts(new Date(timestamp), timeZone);
    const actualAsUtc = Date.UTC(
      actual.year,
      actual.month - 1,
      actual.day,
      actual.hour,
      actual.minute,
      actual.second,
    );
    const diff = target - actualAsUtc;
    if (diff === 0) break;
    timestamp += diff;
  }

  return new Date(timestamp);
}

export function parseDateKey(
  raw: string,
): { year: number; month: number; day: number } | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null;

  const [year, month, day] = raw.split('-').map(Number);
  const utc = new Date(Date.UTC(year, month - 1, day));

  if (
    utc.getUTCFullYear() !== year ||
    utc.getUTCMonth() !== month - 1 ||
    utc.getUTCDate() !== day
  ) {
    return null;
  }

  return { year, month, day };
}

export function dateKeyInTimeZone(value: Date, timeZone: string): string {
  const parts = getZonedParts(value, timeZone);
  return `${parts.year}-${pad2(parts.month)}-${pad2(parts.day)}`;
}

/** Clave de calendario del evento: UTC para todo el día y casa para el resto. */
export function eventCalendarDateKey(
  event: Pick<ReminderEvent, 'start' | 'allDay'>,
  timeZone: string,
): string {
  if (event.allDay) return event.start.toISOString().slice(0, 10);
  return dateKeyInTimeZone(event.start, timeZone);
}

/**
 * Momento del aviso de un evento de todo el día.
 *
 * La fecha se interpreta en la zona de la casa a las 09:00 y después se resta
 * el recordatorio. Devuelve `null` si la fecha o los minutos no son válidos.
 */
export function allDayReminderAt(
  rawDateKey: string,
  reminderMinutes: number,
  timeZone: string,
): Date | null {
  if (
    !Number.isInteger(reminderMinutes) ||
    reminderMinutes < 0 ||
    !isValidTimeZone(timeZone)
  ) {
    return null;
  }

  const date = parseDateKey(rawDateKey);
  if (!date) return null;

  // Para «1 día antes» se resta un día de calendario, no 24 h absolutas: así
  // el aviso sigue siendo a las 09:00 locales aunque ese día cambie la hora.
  const daysBefore = Math.floor(reminderMinutes / (24 * 60));
  const minutesBefore = reminderMinutes % (24 * 60);
  const shifted = new Date(
    Date.UTC(date.year, date.month - 1, date.day) - daysBefore * 24 * 60 * MINUTE_MS,
  );

  const localStart = zonedDateTimeToUtc(
    shifted.getUTCFullYear(),
    shifted.getUTCMonth() + 1,
    shifted.getUTCDate(),
    ALL_DAY_REMINDER_HOUR,
    0,
    timeZone,
  );

  return new Date(localStart.getTime() - minutesBefore * MINUTE_MS);
}

/**
 * Instante del aviso de un evento.
 *
 * - Con hora: `start - reminderMinutes`.
 * - Todo el día: 09:00 local del día, menos `reminderMinutes`.
 */
export function scheduledForEvent(
  event: Pick<ReminderEvent, 'start' | 'allDay' | 'reminderMinutes'>,
  timeZone: string,
): Date | null {
  const minutes = event.reminderMinutes;
  if (minutes === null || !Number.isInteger(minutes) || minutes < 0) {
    return null;
  }

  if (Number.isNaN(event.start.getTime())) return null;

  if (event.allDay) {
    return allDayReminderAt(
      event.start.toISOString().slice(0, 10),
      minutes,
      timeZone,
    );
  }

  return new Date(event.start.getTime() - minutes * MINUTE_MS);
}

export function getReminderSchedule(
  event: ReminderEvent,
  timeZone: string,
): ReminderSchedule | null {
  const scheduledFor = scheduledForEvent(event, timeZone);
  if (!scheduledFor) return null;

  const dateKey = eventCalendarDateKey(event, timeZone);
  return {
    scheduledFor,
    dateKey,
    url: `/calendario?date=${dateKey}`,
  };
}

/**
 * Destinatario del evento: el responsable si existe; `null` significa toda la
 * casa.
 */
export function reminderTargetUserId(
  event: Pick<ReminderEvent, 'ownerId'>,
): string | null {
  return event.ownerId ?? null;
}

/** `true` si `scheduledFor` cae en la ventana [now - gracia, now]. */
export function isWithinDispatchWindow(
  scheduledFor: Date,
  now: Date = new Date(),
  graceMinutes: number = REMINDER_GRACE_MINUTES,
): boolean {
  if (
    Number.isNaN(scheduledFor.getTime()) ||
    Number.isNaN(now.getTime()) ||
    !Number.isInteger(graceMinutes) ||
    graceMinutes < 0
  ) {
    return false;
  }

  const from = now.getTime() - graceMinutes * MINUTE_MS;
  const to = now.getTime();
  const value = scheduledFor.getTime();
  return value >= from && value <= to;
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatZonedDay(value: Date, timeZone: string): string {
  return capitalize(
    new Intl.DateTimeFormat('es-ES', {
      timeZone,
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }).format(value),
  );
}

function formatZonedTime(value: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('es-ES', {
    timeZone,
    hourCycle: 'h23',
    hour: '2-digit',
    minute: '2-digit',
  }).format(value);
}

/** Formatea una fecha de calendario sin desplazarla por zona horaria. */
function formatCalendarDay(rawDateKey: string): string {
  const date = parseDateKey(rawDateKey);
  if (!date) return rawDateKey;

  return capitalize(
    new Intl.DateTimeFormat('es-ES', {
      timeZone: 'UTC',
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }).format(new Date(Date.UTC(date.year, date.month - 1, date.day, 12))),
  );
}

export function buildNotificationPayload(
  event: ReminderEvent,
  timeZone: string,
): ReminderNotificationPayload {
  const dateKey = eventCalendarDateKey(event, timeZone);
  const owner =
    event.owner?.name && event.owner.name.trim()
      ? ` · Para ${event.owner.name.trim()}`
      : ' · Toda la casa';

  const body = event.allDay
    ? `${formatCalendarDay(dateKey)} · Todo el día${owner}`
    : `${formatZonedDay(event.start, timeZone)} a las ${formatZonedTime(
        event.start,
        timeZone,
      )}${owner}`;

  return {
    title: `Recordatorio · ${event.title}`,
    body,
    url: `/calendario?date=${dateKey}`,
    tag: `event-${event.id}`,
    eventId: event.id,
  };
}
