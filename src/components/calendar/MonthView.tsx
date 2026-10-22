'use client';

import type { CalendarEvent } from '@/lib/events';
import {
  WEEKDAY_LONG,
  WEEKDAY_SHORT,
  eventsForDay,
  formatTime,
  type CalendarDay,
} from '@/lib/utils/calendar';

interface MonthViewProps {
  days: CalendarDay[];
  events: CalendarEvent[];
  selectedKey: string | null;
  onDayClick: (day: CalendarDay) => void;
  onSelectDay: (day: CalendarDay) => void;
  onOpenEvent: (event: CalendarEvent) => void;
}

export function MonthView({
  days,
  events,
  selectedKey,
  onDayClick,
  onSelectDay,
  onOpenEvent,
}: MonthViewProps) {
  return (
    <div className="border-t border-mist">
      <div className="grid grid-cols-7 border-l border-mist">
        {WEEKDAY_SHORT.map((label, index) => (
          <div
            key={label}
            className="border-b border-r border-mist py-2 text-center text-[10px] tracking-wider2 text-ash"
          >
            <abbr title={WEEKDAY_LONG[index]} className="no-underline">
              {label}
            </abbr>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 border-l border-mist">
        {days.map((day) => {
          const dayEvents = eventsForDay(events, day.date);
          const visible = dayEvents.slice(0, 3);
          const isSelected = selectedKey === day.key;

          return (
            <div
              key={day.key}
              className={`relative min-h-[74px] border-b border-r border-mist p-1.5 md:min-h-[116px] md:p-2 ${
                !day.inMonth ? 'bg-pearl/45' : ''
              } ${day.isToday ? 'bg-pearl' : ''} ${
                isSelected ? 'ring-1 ring-inset ring-ink' : ''
              }`}
            >
              <button
                type="button"
                onClick={() => onDayClick(day)}
                className="absolute inset-0 z-0 text-left transition-colors hover:bg-pearl/70 active:bg-mist/60"
                aria-label={`Abrir el día ${day.date.getDate()} de ${
                  WEEKDAY_LONG[(day.date.getDay() + 6) % 7]
                }`}
              />

              <div className="pointer-events-none relative z-10 flex h-full flex-col">
                <div className="flex items-center justify-between gap-1">
                  <span
                    className={`inline-flex h-6 w-6 items-center justify-center text-xs tabular-nums ${
                      day.isToday
                        ? 'bg-ink px-1 text-canvas'
                        : day.inMonth
                          ? 'text-ink'
                          : 'text-ash/70'
                    }`}
                  >
                    {day.date.getDate()}
                  </span>
                  {dayEvents.length > 0 && (
                    <span className="text-[9px] tabular-nums text-ash md:hidden">
                      {dayEvents.length}
                    </span>
                  )}
                </div>

                <div className="mt-1 hidden flex-1 flex-col gap-1 md:flex">
                  {visible.map((event) => (
                    <button
                      key={event.id}
                      type="button"
                      onClick={(clickEvent) => {
                        clickEvent.stopPropagation();
                        onOpenEvent(event);
                      }}
                      title={event.title}
                      className="pointer-events-auto block w-full truncate border-l-2 border-ink bg-canvas/80 px-1.5 py-0.5 text-left text-[10px] leading-snug text-ink transition-colors hover:bg-mist/70 active:bg-mist"
                    >
                      {!event.allDay && (
                        <span className="mr-1 tabular-nums text-ash">
                          {formatTime(event.start)}
                        </span>
                      )}
                      {event.title}
                    </button>
                  ))}

                  {dayEvents.length > 3 && (
                    <button
                      type="button"
                      onClick={(clickEvent) => {
                        clickEvent.stopPropagation();
                        onSelectDay(day);
                      }}
                      className="pointer-events-auto mt-auto text-left text-[9px] tracking-wider2 text-ash transition-colors hover:text-ink"
                    >
                      +{dayEvents.length - 3} más
                    </button>
                  )}
                </div>

                {dayEvents.length > 0 && (
                  <div className="mt-auto flex gap-0.5 pt-2 md:hidden">
                    {dayEvents.slice(0, 3).map((event) => (
                      <span
                        key={event.id}
                        className={`h-1 w-1 ${
                          event.allDay ? 'bg-ink' : 'bg-ash'
                        }`}
                        aria-hidden="true"
                      />
                    ))}
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
