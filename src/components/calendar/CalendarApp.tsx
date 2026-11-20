'use client';

import { useEffect, useMemo, useState } from 'react';
import { useIsMobile } from '@/components/mobile/useIsMobile';
import type { CalendarEvent } from '@/lib/events';
import {
  addDays,
  addMonths,
  dateFromKey,
  dateKey,
  eventOverlapsDay,
  eventsForDay,
  formatMonthTitle,
  formatWeekTitle,
  monthRange,
  weekRange,
  type CalendarDay,
  type CalendarRange,
} from '@/lib/utils/calendar';
import { CalendarDesktopView } from './CalendarDesktopView';
import { CalendarMobileView } from './CalendarMobileView';
import { EventPanel, type EventPanelState } from './EventPanel';
import { ReminderPanel } from './ReminderPanel';
import type { CalendarMember, CalendarViewMode } from './types';

interface CalendarAppProps {
  members: CalendarMember[];
  currentUser: { id: string; role: string };
}

/** Dueño del estado del calendario; delega el render en una vista por breakpoint. */
export function CalendarApp({ members, currentUser }: CalendarAppProps) {
  const [anchor, setAnchor] = useState<Date | null>(null);
  const [today, setToday] = useState<Date | null>(null);
  const [view, setView] = useState<CalendarViewMode>('month');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [panel, setPanel] = useState<EventPanelState | null>(null);
  const [remindersOpen, setRemindersOpen] = useState(false);
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    const now = new Date();
    const requested = new URLSearchParams(window.location.search).get('date');
    const requestedDate = requested ? dateFromKey(requested) : null;

    setToday(now);
    setAnchor(requestedDate ?? now);

    if (requestedDate) {
      setSelectedDayKey(dateKey(requestedDate));
    }
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
  const selectedEvents = selectedDay ? eventsForDay(events, selectedDay) : [];
  const visibleCount = range
    ? events.filter((event) =>
        range.days.some((day) => eventOverlapsDay(event, day.date)),
      ).length
    : 0;

  const title = anchor
    ? view === 'month'
      ? formatMonthTitle(anchor)
      : formatWeekTitle(anchor)
    : '';

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

  function changeView(nextView: CalendarViewMode) {
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

  const viewProps = {
    view,
    range,
    events,
    selectedDayKey,
    selectedDay,
    selectedEvents,
    loading,
    error,
    title: title ?? '',
    visibleCount,
    onShiftPeriod: shiftPeriod,
    onGoToday: goToday,
    onChangeView: changeView,
    onDayClick: handleDayClick,
    onSelectDay: (day: CalendarDay) => setSelectedDayKey(day.key),
    onOpenEvent: handleOpenEvent,
    onCreateAt: (day: CalendarDay) => openCreate(day.key, true),
    onCreate: () => openCreate(undefined, false),
    onCreateForSelected: () => openCreate(selectedDayKey ?? undefined, true),
    onCloseAgenda: () => setSelectedDayKey(null),
    onOpenReminders: () => setRemindersOpen(true),
    onRetry: () => setRefreshKey((key) => key + 1),
  };

  return (
    <>
      {isMobile ? (
        <CalendarMobileView {...viewProps} />
      ) : (
        <CalendarDesktopView {...viewProps} />
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
          mobile={isMobile}
          onClose={() => setPanel(null)}
          onSaved={handleSaved}
          onDeleted={handleDeleted}
        />
      )}

      {remindersOpen && (
        <ReminderPanel mobile={isMobile} onClose={() => setRemindersOpen(false)} />
      )}
    </>
  );
}
