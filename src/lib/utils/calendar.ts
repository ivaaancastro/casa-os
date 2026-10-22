/**
 * Utilidades de calendario sin dependencias externas.
 *
 * Los eventos con hora se guardan como instantes UTC y se muestran en la zona
 * horaria local. Los eventos de todo el día usan su clave `YYYY-MM-DD` en UTC
 * para que no se desplacen de día.
 */

export const WEEKDAY_SHORT = ['L', 'M', 'X', 'J', 'V', 'S', 'D'] as const;
export const WEEKDAY_LONG = [
  'lunes',
  'martes',
  'miércoles',
  'jueves',
  'viernes',
  'sábado',
  'domingo',
] as const;

export const REMINDER_LABELS: Record<number, string> = {
  0: 'A la hora',
  10: '10 min antes',
  30: '30 min antes',
  60: '1 h antes',
  1440: '1 día antes',
};

export interface CalendarDay {
  date: Date;
  key: string;
  inMonth: boolean;
  isToday: boolean;
}

export interface CalendarEventLike {
  id?: string;
  title?: string;
  start: string;
  end: string | null;
  allDay: boolean;
}

export interface CalendarRange {
  from: Date;
  to: Date;
  days: CalendarDay[];
}

export function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

/** Clave `YYYY-MM-DD` en la zona horaria local. */
export function dateKey(value: Date): string {
  return `${value.getFullYear()}-${pad2(value.getMonth() + 1)}-${pad2(
    value.getDate(),
  )}`;
}

/** Fecha local a mediodía: evita saltos de día en los cambios de hora. */
export function dateFromKey(key: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return null;

  const [year, month, day] = key.split('-').map(Number);
  const date = new Date(year, month - 1, day, 12, 0, 0, 0);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

export function startOfDay(value: Date): Date {
  return new Date(
    value.getFullYear(),
    value.getMonth(),
    value.getDate(),
    0,
    0,
    0,
    0,
  );
}

export function addDays(value: Date, days: number): Date {
  const date = new Date(value);
  date.setDate(date.getDate() + days);
  return date;
}

export function addMonths(value: Date, months: number): Date {
  return new Date(value.getFullYear(), value.getMonth() + months, 1, 12, 0, 0, 0);
}

/** Lunes de la semana de `value`, a mediodía local. */
export function startOfWeek(value: Date): Date {
  const date = new Date(
    value.getFullYear(),
    value.getMonth(),
    value.getDate(),
    12,
    0,
    0,
    0,
  );
  const offset = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - offset);
  return date;
}

export function isSameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

export function monthGrid(anchor: Date, today: Date = new Date()): CalendarDay[] {
  const first = new Date(
    anchor.getFullYear(),
    anchor.getMonth(),
    1,
    12,
    0,
    0,
    0,
  );
  const start = startOfWeek(first);
  const todayKey = dateKey(today);

  return Array.from({ length: 42 }, (_, index) => {
    const date = addDays(start, index);
    const key = dateKey(date);
    return {
      date,
      key,
      inMonth: isSameMonth(date, anchor),
      isToday: key === todayKey,
    };
  });
}

export function weekDays(anchor: Date, today: Date = new Date()): CalendarDay[] {
  const start = startOfWeek(anchor);
  const todayKey = dateKey(today);

  return Array.from({ length: 7 }, (_, index) => {
    const date = addDays(start, index);
    const key = dateKey(date);
    return {
      date,
      key,
      inMonth: isSameMonth(date, anchor),
      isToday: key === todayKey,
    };
  });
}

export function monthRange(anchor: Date, today: Date = new Date()): CalendarRange {
  const days = monthGrid(anchor, today);
  const from = startOfDay(days[0].date);
  const to = startOfDay(addDays(days[days.length - 1].date, 1));
  return { from, to, days };
}

export function weekRange(anchor: Date, today: Date = new Date()): CalendarRange {
  const days = weekDays(anchor, today);
  const from = startOfDay(days[0].date);
  const to = startOfDay(addDays(days[days.length - 1].date, 1));
  return { from, to, days };
}

/** Fecha en UTC de un evento de todo el día (`YYYY-MM-DD`). */
export function eventDateKey(event: Pick<CalendarEventLike, 'start' | 'allDay'>): string {
  return event.start.slice(0, 10);
}

/** `true` si el evento se pinta en el día indicado (hora local). */
export function eventOverlapsDay(event: CalendarEventLike, day: Date): boolean {
  if (event.allDay) return eventDateKey(event) === dateKey(day);

  const start = new Date(event.start);
  const end = event.end ? new Date(event.end) : start;
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return false;

  const dayStart = startOfDay(day);
  const dayEnd = startOfDay(addDays(day, 1));

  return start < dayEnd && end > dayStart;
}

/** Los de todo el día primero; después por hora y título. */
export function sortEvents<T extends CalendarEventLike>(events: T[]): T[] {
  return [...events].sort((a, b) => {
    if (a.allDay !== b.allDay) return a.allDay ? -1 : 1;

    const startDiff = new Date(a.start).getTime() - new Date(b.start).getTime();
    if (startDiff !== 0) return startDiff;

    return (a.title ?? '').localeCompare(b.title ?? '', 'es');
  });
}

export function eventsForDay<T extends CalendarEventLike>(
  events: T[],
  day: Date,
): T[] {
  return sortEvents(events.filter((event) => eventOverlapsDay(event, day)));
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function formatMonthTitle(anchor: Date): string {
  return capitalize(
    new Intl.DateTimeFormat('es-ES', {
      month: 'long',
      year: 'numeric',
    }).format(anchor),
  );
}

export function formatWeekTitle(anchor: Date): string {
  const start = startOfWeek(anchor);
  const end = addDays(start, 6);
  const short = new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'short',
  });

  if (isSameMonth(start, end)) {
    const month = new Intl.DateTimeFormat('es-ES', { month: 'short' }).format(
      end,
    );
    return `${start.getDate()} – ${end.getDate()} ${month} ${end.getFullYear()}`;
  }

  if (start.getFullYear() === end.getFullYear()) {
    return `${short.format(start)} – ${short.format(end)} ${end.getFullYear()}`;
  }

  return `${short.format(start)} ${start.getFullYear()} – ${short.format(
    end,
  )} ${end.getFullYear()}`;
}

export function formatDayLong(day: Date): string {
  return capitalize(
    new Intl.DateTimeFormat('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }).format(day),
  );
}

export function formatDateLong(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  return capitalize(
    new Intl.DateTimeFormat('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date),
  );
}

export function formatTime(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

export function formatEventTime(
  event: Pick<CalendarEventLike, 'start' | 'end' | 'allDay'>,
): string {
  if (event.allDay) return 'Todo el día';
  if (!event.end) return formatTime(event.start);
  return `${formatTime(event.start)} – ${formatTime(event.end)}`;
}

export function formatReminder(minutes: number | null): string {
  if (minutes === null) return 'Sin recordatorio';
  return REMINDER_LABELS[minutes] ?? `${minutes} min antes`;
}

/** Valor para `<input type="datetime-local">` en hora local. */
export function toLocalDateTimeInput(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  return `${dateKey(date)}T${pad2(date.getHours())}:${pad2(
    date.getMinutes(),
  )}`;
}

/** Valor para `<input type="date">` de un evento de todo el día. */
export function toDateInput(value: Date | string): string {
  return value instanceof Date ? dateKey(value) : value.slice(0, 10);
}

/** Convierte un `datetime-local` local a ISO UTC; `null` si no es válido. */
export function localInputToIso(value: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}
