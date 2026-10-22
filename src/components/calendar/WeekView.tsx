'use client';

import type { CalendarEvent } from '@/lib/events';
import {
  WEEKDAY_LONG,
  eventsForDay,
  formatEventTime,
  formatTime,
  type CalendarDay,
} from '@/lib/utils/calendar';

interface WeekViewProps {
  days: CalendarDay[];
  events: CalendarEvent[];
  onOpenEvent: (event: CalendarEvent) => void;
  onCreateAt: (day: CalendarDay) => void;
}

function monthShort(date: Date): string {
  return new Intl.DateTimeFormat('es-ES', { month: 'short' }).format(date);
}

function eventTimeLabel(event: CalendarEvent): string {
  return event.allDay ? 'Todo el día' : formatEventTime(event);
}

export function WeekView({
  days,
  events,
  onOpenEvent,
  onCreateAt,
}: WeekViewProps) {
  return (
    <div className="border-t border-mist">
      <div className="hidden border-l border-mist md:grid md:grid-cols-7">
        {days.map((day) => {
          const dayEvents = eventsForDay(events, day.date);

          return (
            <section
              key={day.key}
              className={`flex min-h-[380px] flex-col border-b border-r border-mist ${
                day.isToday ? 'bg-pearl/40' : ''
              }`}
            >
              <header className="border-b border-mist p-3">
                <p className="text-[10px] tracking-wider2 text-ash">
                  {WEEKDAY_LONG[(day.date.getDay() + 6) % 7]}
                </p>
                <div className="mt-2 flex items-baseline justify-between gap-2">
                  <p className="font-display text-3xl leading-none tracking-editorial text-ink">
                    {day.date.getDate()}
                  </p>
                  <p className="text-[10px] tracking-wider2 text-ash">
                    {monthShort(day.date)}
                  </p>
                </div>
              </header>

              <div className="flex-1 space-y-1 p-2">
                {dayEvents.length === 0 ? (
                  <p className="text-[10px] text-ash/60">—</p>
                ) : (
                  dayEvents.map((event) => (
                    <button
                      key={event.id}
                      type="button"
                      onClick={() => onOpenEvent(event)}
                      title={event.title}
                      className="block w-full border-l-2 border-ink bg-canvas px-2 py-1.5 text-left transition-colors hover:bg-pearl active:bg-mist"
                    >
                      <span className="block text-[9px] leading-tight tracking-wide text-ash">
                        {eventTimeLabel(event)}
                      </span>
                      <span className="mt-0.5 block truncate text-[11px] leading-snug text-ink">
                        {event.title}
                      </span>
                    </button>
                  ))
                )}
              </div>

              <button
                type="button"
                onClick={() => onCreateAt(day)}
                className="border-t border-mist py-2 text-[10px] tracking-wider2 text-ash transition-colors hover:bg-pearl hover:text-ink active:bg-mist"
              >
                + Añadir
              </button>
            </section>
          );
        })}
      </div>

      <div className="md:hidden">
        {days.map((day) => {
          const dayEvents = eventsForDay(events, day.date);

          return (
            <section
              key={day.key}
              className={`border-b border-mist py-4 ${
                day.isToday ? 'bg-pearl/40' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-baseline gap-3">
                  <span
                    className={`inline-flex h-8 w-8 items-center justify-center text-sm tabular-nums ${
                      day.isToday ? 'bg-ink text-canvas' : 'text-ink'
                    }`}
                  >
                    {day.date.getDate()}
                  </span>
                  <div>
                    <p className="text-[10px] tracking-wider2 text-ash">
                      {WEEKDAY_LONG[(day.date.getDay() + 6) % 7]}
                    </p>
                    <p className="text-[10px] tracking-wider2 text-ash">
                      {monthShort(day.date)}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onCreateAt(day)}
                  className="border border-mist px-2 py-1 text-[10px] tracking-wider2 text-ash transition-colors hover:border-ink hover:text-ink active:bg-pearl"
                  aria-label={`Añadir evento el ${day.date.getDate()} de ${monthShort(
                    day.date,
                  )}`}
                >
                  + Añadir
                </button>
              </div>

              {dayEvents.length === 0 ? (
                <p className="mt-3 text-xs text-ash/60">Sin eventos.</p>
              ) : (
                <ul className="mt-3 space-y-1">
                  {dayEvents.map((event) => (
                    <li key={event.id}>
                      <button
                        type="button"
                        onClick={() => onOpenEvent(event)}
                        className="flex w-full items-start gap-3 border-l-2 border-ink bg-canvas px-3 py-2 text-left transition-colors hover:bg-pearl active:bg-mist"
                      >
                        <span className="w-16 shrink-0 text-[10px] leading-5 tracking-wide text-ash">
                          {event.allDay ? 'Todo el día' : formatTime(event.start)}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm text-ink">
                            {event.title}
                          </span>
                          {event.owner && (
                            <span className="mt-0.5 block text-[10px] tracking-wider2 text-ash">
                              {event.owner.name ?? 'Miembro'}
                            </span>
                          )}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
