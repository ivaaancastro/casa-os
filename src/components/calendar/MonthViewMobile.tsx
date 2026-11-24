'use client';

import type { CalendarEvent } from '@/lib/events';
import { eventsForDayChips } from '@/lib/utils/calendar-chips';
import {
  WEEKDAY_LONG,
  WEEKDAY_SHORT,
  formatTime,
  type CalendarDay,
} from '@/lib/utils/calendar';

interface MonthViewMobileProps {
  days: CalendarDay[];
  events: CalendarEvent[];
  selectedKey: string | null;
  onDayClick: (day: CalendarDay) => void;
  onSelectDay: (day: CalendarDay) => void;
  onOpenEvent: (event: CalendarEvent) => void;
}

/** Rejilla de mes para móvil: celdas amplias con chips de evento en vez de puntos. */
export function MonthViewMobile({
  days,
  events,
  selectedKey,
  onDayClick,
  onSelectDay,
  onOpenEvent,
}: MonthViewMobileProps) {
  return (
    <div className="border-t border-mist/60" data-testid="calendar-mobile-month">
      <div className="grid grid-cols-7 border-l border-mist/60">
        {WEEKDAY_SHORT.map((label, index) => (
          <div
            key={label}
            className="border-b border-r border-mist/60 py-2 text-center text-[10px] tracking-wider2 text-ash"
          >
            <abbr title={WEEKDAY_LONG[index]} className="no-underline">
              {label}
            </abbr>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 border-l border-mist/60">
        {days.map((day) => {
          const { visible, hidden } = eventsForDayChips(events, day.date);
          const isSelected = selectedKey === day.key;

          return (
            <div
              key={day.key}
              className={`relative min-h-[104px] min-w-0 border-b border-r border-mist/60 px-0.5 pb-1 pt-1 ${
                !day.inMonth ? 'bg-pearl/45' : ''
              } ${day.isToday ? 'bg-pearl' : ''} ${
                isSelected ? 'ring-1 ring-inset ring-ink' : ''
              }`}
            >
              <button
                type="button"
                onClick={() => onDayClick(day)}
                className="absolute inset-0 z-0 text-left transition-colors active:bg-mist/60"
                aria-label={`Abrir el día ${day.date.getDate()} de ${
                  WEEKDAY_LONG[(day.date.getDay() + 6) % 7]
                }`}
              />

              <div className="pointer-events-none relative z-10 flex h-full flex-col">
                <div className="flex justify-center">
                  <span
                    className={`inline-flex h-7 min-h-7 w-7 min-w-7 items-center justify-center text-xs tabular-nums ${
                      day.isToday
                        ? 'bg-accent text-white'
                        : day.inMonth
                          ? 'text-ink'
                          : 'text-ash/70'
                    }`}
                  >
                    {day.date.getDate()}
                  </span>
                </div>

                {visible.length > 0 && (
                  <div className="mt-1 flex flex-col gap-0.5">
                    {visible.map((event) => (
                      <button
                        key={event.id}
                        type="button"
                        onClick={(clickEvent) => {
                          clickEvent.stopPropagation();
                          onOpenEvent(event);
                        }}
                        title={`${!event.allDay ? formatTime(event.start) + ' · ' : ''}${event.title}`}
                        className="pointer-events-auto min-h-[26px] w-full truncate border-l-2 border-ink bg-canvas/90 px-1 text-left text-[10px] leading-tight text-ink active:bg-mist"
                      >
                        {event.title}
                      </button>
                    ))}

                    {hidden > 0 && (
                      <button
                        type="button"
                        onClick={(clickEvent) => {
                          clickEvent.stopPropagation();
                          onSelectDay(day);
                        }}
                        className="pointer-events-auto min-h-[22px] text-left text-[10px] tracking-wide text-ash active:text-ink"
                      >
                        +{hidden} más
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
