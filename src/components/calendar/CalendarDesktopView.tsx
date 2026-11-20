'use client';

import {
  formatDayLong,
  formatEventTime,
} from '@/lib/utils/calendar';
import { MonthView } from './MonthView';
import { WeekView } from './WeekView';
import type { CalendarViewProps } from './types';

/** Layout de escritorio original: rejilla/semana, agenda del día y toolbar. */
export function CalendarDesktopView({
  view,
  range,
  events,
  selectedDayKey,
  selectedDay,
  selectedEvents,
  loading,
  error,
  title,
  visibleCount,
  onShiftPeriod,
  onGoToday,
  onChangeView,
  onDayClick,
  onSelectDay,
  onOpenEvent,
  onCreateAt,
  onCreate,
  onCreateForSelected,
  onCloseAgenda,
  onOpenReminders,
  onRetry,
}: CalendarViewProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-5 border-b border-mist pb-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onShiftPeriod(-1)}
              className="date-nav"
              aria-label={view === 'month' ? 'Mes anterior' : 'Semana anterior'}
            >
              ←
            </button>
            <button
              type="button"
              onClick={onGoToday}
              className="btn-secondary px-3 py-2 text-xs"
            >
              Hoy
            </button>
            <button
              type="button"
              onClick={() => onShiftPeriod(1)}
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
                onClick={() => onChangeView('month')}
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
                onClick={() => onChangeView('week')}
                className={`border-l border-mist px-3 py-2 text-xs transition-colors active:bg-mist ${
                  view === 'week'
                    ? 'bg-ink text-canvas'
                    : 'text-ash hover:bg-pearl hover:text-ink'
                }`}
              >
                Semana
              </button>
            </div>

            <button type="button" className="btn-secondary text-xs" onClick={onOpenReminders}>
              Avisos
            </button>

            <button type="button" className="btn-primary" onClick={onCreate}>
              Nuevo evento
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
          <h2 className="font-ui text-xl font-medium leading-tight text-ink md:font-display md:text-5xl md:leading-none md:tracking-editorial">
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
            onClick={onRetry}
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
            onDayClick={onDayClick}
            onSelectDay={onSelectDay}
            onOpenEvent={onOpenEvent}
          />
        ) : (
          <WeekView
            days={range.days}
            events={events}
            onOpenEvent={onOpenEvent}
            onCreateAt={onCreateAt}
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
                onClick={onCreateForSelected}
              >
                Nuevo evento
              </button>
              <button
                type="button"
                className="text-xs text-ash underline-offset-4 transition-colors hover:text-ink hover:underline"
                onClick={onCloseAgenda}
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
                    onClick={() => onOpenEvent(event)}
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
    </div>
  );
}
