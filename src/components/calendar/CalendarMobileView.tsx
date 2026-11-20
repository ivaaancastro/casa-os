'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { formatDayLong, formatEventTime } from '@/lib/utils/calendar';
import { MonthViewMobile } from './MonthViewMobile';
import { WeekViewMobile } from './WeekViewMobile';
import type { CalendarViewProps } from './types';

/** Vista móvil del calendario: mes/semana táctiles, agenda del día y FAB. */
export function CalendarMobileView({
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      <div className="relative pb-28">
      <header className="border-b border-mist px-4 pb-3 pt-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onShiftPeriod(-1)}
            className="date-nav inline-flex min-h-11 min-w-11"
            aria-label={view === 'month' ? 'Mes anterior' : 'Semana anterior'}
          >
            ←
          </button>
          <h2 className="min-w-0 flex-1 truncate text-center font-ui text-base font-medium text-ink">
            {title}
          </h2>
          <button
            type="button"
            onClick={() => onShiftPeriod(1)}
            className="date-nav inline-flex min-h-11 min-w-11"
            aria-label={view === 'month' ? 'Mes siguiente' : 'Semana siguiente'}
          >
            →
          </button>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <div
            className="flex border border-mist"
            role="group"
            aria-label="Vista del calendario"
          >
            <button
              type="button"
              aria-pressed={view === 'month'}
              onClick={() => onChangeView('month')}
              className={`inline-flex min-h-11 min-w-14 items-center justify-center px-3 text-sm transition-colors active:bg-mist ${
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
              className={`inline-flex min-h-11 min-w-14 items-center justify-center border-l border-mist px-3 text-sm transition-colors active:bg-mist ${
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
            onClick={onGoToday}
            className="inline-flex min-h-11 items-center border border-mist px-3 text-sm text-ink active:bg-mist"
          >
            Hoy
          </button>

          <button
            type="button"
            onClick={onOpenReminders}
            className="inline-flex min-h-11 items-center border border-mist px-3 text-sm text-ink active:bg-mist"
          >
            Avisos
          </button>
        </div>

        <p className="mt-2 text-[13px] text-ash" aria-live="polite">
          {loading
            ? 'Actualizando'
            : `${visibleCount} ${visibleCount === 1 ? 'evento' : 'eventos'}`}
        </p>
      </header>

      {error && (
        <div
          role="alert"
          className="mx-4 mt-4 flex flex-wrap items-center justify-between gap-3 border border-alarm px-4 py-3 text-sm text-alarm"
        >
          <p>{error}</p>
          <button
            type="button"
            className="min-h-11 text-xs underline underline-offset-4 active:opacity-60"
            onClick={onRetry}
          >
            Reintentar
          </button>
        </div>
      )}

      <div aria-busy={loading} className={loading ? 'opacity-70' : undefined}>
        {view === 'month' ? (
          <MonthViewMobile
            days={range.days}
            events={events}
            selectedKey={selectedDayKey}
            onDayClick={onDayClick}
            onSelectDay={onSelectDay}
            onOpenEvent={onOpenEvent}
          />
        ) : (
          <WeekViewMobile
            days={range.days}
            events={events}
            onOpenEvent={onOpenEvent}
            onCreateAt={onCreateAt}
          />
        )}
      </div>

      {selectedDay && (
        <section className="border-t border-mist px-4 pb-4 pt-4" data-testid="calendar-mobile-agenda">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] tracking-wider2 text-ash">Agenda</p>
              <h3 className="mt-1 font-ui text-lg font-medium leading-tight text-ink">
                {formatDayLong(selectedDay)}
              </h3>
            </div>
            <button
              type="button"
              onClick={onCloseAgenda}
              className="min-h-11 shrink-0 text-xs text-ash underline-offset-4 active:text-ink"
            >
              Cerrar
            </button>
          </div>

          {selectedEvents.length === 0 ? (
            <p className="mt-3 text-sm text-ash">No hay eventos este día.</p>
          ) : (
            <ul className="mt-3 border-t border-mist">
              {selectedEvents.map((event) => (
                <li key={event.id} className="border-b border-mist">
                  <button
                    type="button"
                    onClick={() => onOpenEvent(event)}
                    className="flex min-h-14 w-full items-center gap-3 px-1 py-2 text-left active:bg-pearl"
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

          <button
            type="button"
            onClick={onCreateForSelected}
            className="mt-4 inline-flex min-h-11 w-full items-center justify-center border border-mist text-sm text-ink active:bg-mist"
          >
            Añadir evento este día
          </button>
        </section>
      )}

      </div>

      {/* El contenedor de la página tiene `animate-fade-rise`, que deja un
          transform y rompe `position: fixed`. El FAB se porta a body, igual
          que los paneles, para que flote sobre la tab bar de verdad. */}
      {mounted &&
        createPortal(
          <button
            type="button"
            onClick={onCreate}
            aria-label="Nuevo evento"
            title="Nuevo evento"
            className="fixed right-4 z-30 flex h-14 w-14 items-center justify-center bg-ink text-canvas transition-colors active:bg-black"
            style={{ bottom: 'calc(4.5rem + env(safe-area-inset-bottom))' }}
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="square" strokeWidth={1.5} d="M12 5v14M5 12h14" />
            </svg>
          </button>,
          document.body,
        )}
    </>
  );
}
