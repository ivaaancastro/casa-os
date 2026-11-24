'use client';

import type { CalendarEvent } from '@/lib/events';
import {
  WEEKDAY_LONG,
  eventsForDay,
  formatEventTime,
  type CalendarDay,
} from '@/lib/utils/calendar';

interface WeekViewMobileProps {
  days: CalendarDay[];
  events: CalendarEvent[];
  onOpenEvent: (event: CalendarEvent) => void;
  onCreateAt: (day: CalendarDay) => void;
}

function monthShort(date: Date): string {
  return new Intl.DateTimeFormat('es-ES', { month: 'short' }).format(date);
}

/** Semana en móvil: siete tarjetas de día con chips y alta de ≥44 px. */
export function WeekViewMobile({
  days,
  events,
  onOpenEvent,
  onCreateAt,
}: WeekViewMobileProps) {
  return (
    <div className="border-t border-mist/60" data-testid="calendar-mobile-week">
      {days.map((day) => {
        const dayEvents = eventsForDay(events, day.date);

        return (
          <section
            key={day.key}
            className={`border-b border-mist/60 px-4 py-4 ${
              day.isToday ? 'bg-pearl/40' : ''
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-baseline gap-3">
                <span
                  className={`inline-flex h-11 min-h-11 w-11 min-w-11 items-center justify-center text-sm tabular-nums ${
                    day.isToday ? 'bg-accent text-white' : 'text-ink'
                  }`}
                >
                  {day.date.getDate()}
                </span>
                <div>
                  <p className="text-xs tracking-wider2 text-ink">
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
                className="inline-flex min-h-11 min-w-11 items-center justify-center border border-mist/60 px-3 text-sm text-ink transition-colors active:bg-mist"
                aria-label={`Añadir evento el ${day.date.getDate()} de ${monthShort(day.date)}`}
              >
                +
              </button>
            </div>

            {dayEvents.length === 0 ? (
              <p className="mt-2 text-xs text-ash/60">Sin eventos.</p>
            ) : (
              <ul className="mt-3 space-y-1">
                {dayEvents.map((event) => (
                  <li key={event.id}>
                    <button
                      type="button"
                      onClick={() => onOpenEvent(event)}
                      title={event.title}
                      className="flex min-h-11 w-full items-center gap-3 border-l-2 border-ink bg-canvas px-3 py-2 text-left transition-colors active:bg-mist"
                    >
                      <span className="w-24 shrink-0 text-[10px] leading-4 tracking-wide text-ash">
                        {formatEventTime(event)}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm text-ink">
                        {event.title}
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
  );
}
