'use client';

import { useEffect, useMemo, useState } from 'react';
import type { CalendarEvent } from '@/lib/events';
import {
  addDays,
  addMonths,
  dateFromKey,
  dateKey,
  eventOverlapsDay,
  eventsForDay,
  formatDayLong,
  formatEventTime,
  formatMonthTitle,
  formatWeekTitle,
  monthRange,
  weekRange,
  type CalendarDay,
  type CalendarRange,
} from '@/lib/utils/calendar';
import { EventPanel, type EventPanelState } from './EventPanel';
import { MonthView } from './MonthView';
import { WeekView } from './WeekView';

interface CalendarMember {
  id: string;
  name: string | null;
}

interface CalendarAppProps {
  members: CalendarMember[];
  currentUser: { id: string; role: string };
}

type CalendarView = 'month' | 'week';

function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const query = window.matchMedia('(max-width: 767px)');
    const update = () => setIsMobile(query.matches);

    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  return isMobile;
}

export function CalendarApp({ members, currentUser }: CalendarAppProps) {
  const [anchor, setAnchor] = useState<Date | null>(null);
  const [today, setToday] = useState<Date | null>(null);
  const [view, setView] = useState<CalendarView>('month');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [panel, setPanel] = useState<EventPanelState | null>(null);
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    const now = new Date();
    setToday(now);
    setAnchor(now);
  }, []);

  const range: CalendarRange | null = useMemo(() => {
    if (!anchor || !today) return null;
    return view === 'month'
      ? monthRange(anchor, today)
      : weekRange(anchor, today);
  }, [anchor, today, view]);

  const rangeFrom = range ? range.from.getTime() : null;
  const rangeTo = range ? range.to.getTime() : null;

  useEffect(() => {
    if (rangeFrom === null || rangeTo === null) return;

    let active = true;
    const controller = new AbortController();
    const from = addDays(new Date(rangeFrom), -1).toISOString();
    const to = addDays(new Date(rangeTo), 1).toISOString();

    setLoading(true);
    setError('');

    fetch(
      `/api/events?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
      { signal: controller.signal },
    )
      .then(async (response) => {
        const payload = (await response.json().catch(() => ({}))) as {
          events?: CalendarEvent[];
          error?: string;
        };

        if (!response.ok) {
          throw new Error(payload.error ?? 'No se pudieron cargar los eventos');
        }

        return payload.events ?? [];
      })
      .then((nextEvents) => {
        if (active) setEvents(nextEvents);
      })
      .catch((fetchError: unknown) => {
        if (!active) return;
        if (
          fetchError instanceof DOMException &&
          fetchError.name === 'AbortError'
        ) {
          return;
        }
        setEvents([]);
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : 'No se pudieron cargar los eventos',
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [rangeFrom, rangeTo, refreshKey]);

  const selectedDay = selectedDayKey ? dateFromKey(selectedDayKey) : null;
  const selectedEvents = selectedDay
    ? eventsForDay(events, selectedDay)
    : [];
  const visibleCount = range
    ? events.filter((event) =>
        range.days.some((day) => eventOverlapsDay(event, day.date)),
      ).length
    : 0;

  const title =
    anchor &&
    (view === 'month' ? formatMonthTitle(anchor) : formatWeekTitle(anchor));

  function shiftPeriod(direction: number) {
    setAnchor((current) => {
      if (!current) return current;
      return view === 'month'
        ? addMonths(current, direction)
        : addDays(current, direction * 7);
    });
    setSelectedDayKey(null);
  }

  function goToday() {
    const now = new Date();
    setToday(now);
    setAnchor(now);
    setSelectedDayKey(dateKey(now));
  }

  function changeView(nextView: CalendarView) {
    setView(nextView);
    setSelectedDayKey(null);
  }

  function openCreate(defaultDate?: string, defaultAllDay = false) {
    setPanel({
      mode: 'create',
      defaultDate:
        defaultDate ?? selectedDayKey ?? (today ? dateKey(today) : undefined),
      defaultAllDay,
    });
  }

  function handleDayClick(day: CalendarDay) {
    if (isMobile) {
      setSelectedDayKey(day.key);
      return;
    }

    setPanel({ mode: 'create', defaultDate: day.key, defaultAllDay: true });
  }

  function handleOpenEvent(event: CalendarEvent) {
    setPanel({ mode: 'view', event });
  }

  function handleSaved() {
    setPanel(null);
    setRefreshKey((key) => key + 1);
  }

  function handleDeleted() {
    setPanel(null);
    setRefreshKey((key) => key + 1);
  }

  if (!anchor || !today || !range) {
    return (
      <div className="space-y-6" aria-busy="true">
        <div className="h-24 animate-pulse bg-pearl" />
        <div className="grid grid-cols-7 border border-mist">
          {Array.from({ length: 42 }, (_, index) => (
            <div
              key={index}
              className="h-20 border-b border-r border-mist bg-canvas last:border-r-0 md:h-28"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-5 border-b border-mist pb-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => shiftPeriod(-1)}
              className="date-nav"
              aria-label={
                view === 'month' ? 'Mes anterior' : 'Semana anterior'
              }
            >
              ←
            </button>
            <button
              type="button"
              onClick={goToday}
              className="btn-secondary px-3 py-2 text-xs"
            >
              Hoy
            </button>
            <button
              type="button"
              onClick={() => shiftPeriod(1)}
              className="date-nav"
              aria-label={view === 'month' ? 'Mes siguiente' : 'Semana siguiente'}
            >
              →
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div
              className="flex border border-mist"
              role="group"
              aria-label="Vista del calendario"
            >
              <button
                type="button"
                aria-pressed={view === 'month'}
                onClick={() => changeView('month')}
                className={`px-3 py-2 text-xs transition-colors active:bg-mist ${
                  view === 'month'
                    ? 'bg-ink text-canvas'
                    : 'text-ash hover:bg-pearl hover:text-ink'
                }`}
              >
                Mes
              </button>
              <button
                type="button"
                aria-pressed={view === 'week'}
                onClick={() => changeView('week')}
                className={`border-l border-mist px-3 py-2 text-xs transition-colors active:bg-mist ${
                  view === 'week'
                    ? 'bg-ink text-canvas'
                    : 'text-ash hover:bg-pearl hover:text-ink'
                }`}
              >
                Semana
              </button>
            </div>

            <button
              type="button"
              className="btn-primary"
              onClick={() => openCreate(undefined, false)}
            >
              Nuevo evento
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
          <h2 className="font-display text-4xl leading-none tracking-editorial md:text-5xl">
            {title}
          </h2>
          <p className="text-[10px] tracking-wider2 text-ash" aria-live="polite">
            {loading
              ? 'Actualizando calendario'
              : `${visibleCount} ${visibleCount === 1 ? 'evento' : 'eventos'}`}
          </p>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 border border-alarm px-4 py-3 text-sm text-alarm"
        >
          <p>{error}</p>
          <button
            type="button"
            className="text-xs underline underline-offset-4 active:opacity-60"
            onClick={() => setRefreshKey((key) => key + 1)}
          >
            Reintentar
          </button>
        </div>
      )}

      <div aria-busy={loading} className={loading ? 'opacity-70' : undefined}>
        {view === 'month' ? (
          <MonthView
            days={range.days}
            events={events}
            selectedKey={selectedDayKey}
            onDayClick={handleDayClick}
            onSelectDay={(day) => setSelectedDayKey(day.key)}
            onOpenEvent={handleOpenEvent}
          />
        ) : (
          <WeekView
            days={range.days}
            events={events}
            onOpenEvent={handleOpenEvent}
            onCreateAt={(day) => openCreate(day.key, true)}
          />
        )}
      </div>

      {selectedDay && (
        <section className="border-t border-mist pt-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[10px] tracking-wider2 text-ash">Agenda</p>
              <h3 className="mt-1 font-display text-3xl leading-none tracking-editorial">
                {formatDayLong(selectedDay)}
              </h3>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                className="btn-secondary text-xs"
                onClick={() => openCreate(selectedDayKey ?? undefined, true)}
              >
                Nuevo evento
              </button>
              <button
                type="button"
                className="text-xs text-ash underline-offset-4 transition-colors hover:text-ink hover:underline"
                onClick={() => setSelectedDayKey(null)}
              >
                Cerrar agenda
              </button>
            </div>
          </div>

          {selectedEvents.length === 0 ? (
            <p className="mt-4 border-t border-mist pt-4 text-sm text-ash">
              No hay eventos este día.
            </p>
          ) : (
            <ul className="mt-4 border-t border-mist">
              {selectedEvents.map((event) => (
                <li key={event.id} className="border-b border-mist">
                  <button
                    type="button"
                    onClick={() => handleOpenEvent(event)}
                    className="grid w-full grid-cols-[5rem_1fr] gap-3 px-1 py-3 text-left transition-colors hover:bg-pearl active:bg-mist md:grid-cols-[7rem_1fr_9rem] md:px-2"
                  >
                    <span className="text-[10px] leading-5 tracking-wide text-ash">
                      {formatEventTime(event)}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm text-ink">
                        {event.title}
                      </span>
                      {event.description && (
                        <span className="mt-0.5 block truncate text-xs text-ash">
                          {event.description}
                        </span>
                      )}
                    </span>
                    <span className="hidden text-right text-[10px] tracking-wider2 text-ash md:block">
                      {event.owner?.name ?? 'Toda la casa'}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {panel && (
        <EventPanel
          key={
            panel.mode === 'create'
              ? 'create'
              : `${panel.mode}-${panel.event.id}`
          }
          state={panel}
          members={members}
          currentUser={currentUser}
          onClose={() => setPanel(null)}
          onSaved={handleSaved}
          onDeleted={handleDeleted}
        />
      )}
    </div>
  );
}
