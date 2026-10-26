'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { CalendarEvent } from '@/lib/events';
import { canEditEvent } from '@/lib/utils/event';
import {
  dateFromKey,
  dateKey,
  eventDateKey,
  formatDateLong,
  formatEventTime,
  formatReminder,
  localInputToIso,
  toDateInput,
  toLocalDateTimeInput,
} from '@/lib/utils/calendar';

export type EventPanelState =
  | { mode: 'create'; defaultDate?: string; defaultAllDay?: boolean }
  | { mode: 'view' | 'edit'; event: CalendarEvent };

interface MemberOption {
  id: string;
  name: string | null;
}

interface EventPanelProps {
  state: EventPanelState;
  members: MemberOption[];
  currentUser: { id: string; role: string };
  onClose: () => void;
  onSaved: () => void;
  onDeleted: () => void;
}

const REMINDER_OPTIONS = [
  { value: '', label: 'Sin recordatorio' },
  { value: '0', label: 'A la hora' },
  { value: '10', label: '10 min antes' },
  { value: '30', label: '30 min antes' },
  { value: '60', label: '1 h antes' },
  { value: '1440', label: '1 día antes' },
];

function initialDate(state: EventPanelState): string {
  return state.mode === 'create'
    ? state.defaultDate ?? dateKey(new Date())
    : state.event.start.slice(0, 10);
}

function toFormValues(state: EventPanelState) {
  if (state.mode === 'create') {
    const day = state.defaultDate ?? dateKey(new Date());
    return {
      title: '',
      description: '',
      allDay: state.defaultAllDay ?? false,
      startDate: day,
      startLocal: `${day}T09:00`,
      endLocal: `${day}T10:00`,
      ownerId: '',
      reminder: '',
    };
  }

  const event = state.event;
  return {
    title: event.title,
    description: event.description ?? '',
    allDay: event.allDay,
    startDate: event.allDay ? eventDateKey(event) : toDateInput(event.start),
    startLocal: event.allDay
      ? `${initialDate(state)}T09:00`
      : toLocalDateTimeInput(event.start),
    endLocal: event.end
      ? toLocalDateTimeInput(event.end)
      : `${initialDate(state)}T10:00`,
    ownerId: event.owner?.id ?? '',
    reminder:
      event.reminderMinutes === null ? '' : String(event.reminderMinutes),
  };
}

function eventDate(event: CalendarEvent): Date {
  if (event.allDay) {
    return dateFromKey(eventDateKey(event)) ?? new Date(event.start);
  }
  return new Date(event.start);
}

export function EventPanel({
  state,
  members,
  currentUser,
  onClose,
  onSaved,
  onDeleted,
}: EventPanelProps) {
  const event = state.mode === 'create' ? null : state.event;
  const canEdit = event ? canEditEvent(event, currentUser) : true;
  const initial = toFormValues(state);

  const [editing, setEditing] = useState(state.mode !== 'view');
  const [title, setTitle] = useState(initial.title);
  const [description, setDescription] = useState(initial.description);
  const [allDay, setAllDay] = useState(initial.allDay);
  const [startDate, setStartDate] = useState(initial.startDate);
  const [startLocal, setStartLocal] = useState(initial.startLocal);
  const [endLocal, setEndLocal] = useState(initial.endLocal);
  const [ownerId, setOwnerId] = useState(initial.ownerId);
  const [reminder, setReminder] = useState(initial.reminder);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [closing, setClosing] = useState(false);
  const [mounted, setMounted] = useState(false);

  const titleId = useId();
  const titleRef = useRef<HTMLInputElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') requestClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  useEffect(() => {
    if (editing) titleRef.current?.focus();
    else closeRef.current?.focus();
  }, [editing]);

  function requestClose() {
    setClosing(true);
    window.setTimeout(onClose, 160);
  }

  function handleAllDayChange(checked: boolean) {
    if (checked) {
      const day = startLocal ? dateKey(new Date(startLocal)) : startDate;
      setStartDate(day);
      setAllDay(true);
    } else {
      setStartLocal(`${startDate}T09:00`);
      setEndLocal(`${startDate}T10:00`);
      setAllDay(false);
    }
  }

  async function handleSubmit(formEvent: React.FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('El título es obligatorio');
      return;
    }

    const startIso = allDay ? null : localInputToIso(startLocal);
    const endIso = allDay ? null : localInputToIso(endLocal);

    if (!allDay && (!startIso || !endIso)) {
      setError('Indica una fecha y hora de inicio y fin válidas');
      return;
    }

    if (startIso && endIso && new Date(endIso) <= new Date(startIso)) {
      setError('La hora de fin debe ser posterior a la de inicio');
      return;
    }

    setPending(true);

    try {
      const response = await fetch(
        event ? `/api/events/${event.id}` : '/api/events',
        {
          method: event ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: title.trim(),
            description: description.trim() || null,
            allDay,
            start: allDay ? startDate : startIso,
            end: allDay ? null : endIso,
            ownerId: ownerId || null,
            reminderMinutes: reminder === '' ? null : Number(reminder),
          }),
        },
      );

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        setError(data.error ?? 'No se pudo guardar el evento');
        return;
      }

      onSaved();
    } catch {
      setError('Error de red. Inténtalo de nuevo.');
    } finally {
      setPending(false);
    }
  }

  async function handleDelete() {
    if (!event) return;
    setPending(true);
    setError('');

    try {
      const response = await fetch(`/api/events/${event.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        setError(data.error ?? 'No se pudo eliminar el evento');
        return;
      }

      onDeleted();
    } catch {
      setError('Error de red. Inténtalo de nuevo.');
    } finally {
      setPending(false);
    }
  }

  const heading = event
    ? editing
      ? 'Editar evento'
      : 'Detalle del evento'
    : 'Nuevo evento';
  const dateLabel = event ? formatDateLong(eventDate(event)) : '';

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[60] flex justify-end">
      <button
        type="button"
        aria-label="Cerrar panel de evento"
        className="absolute inset-0 cursor-default bg-ink/20 backdrop-blur-[2px] animate-scrim-in"
        onClick={requestClose}
      />

      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${titleId}-heading`}
        className={`relative flex h-full w-full max-w-lg flex-col overflow-y-auto border-l border-mist bg-canvas p-6 shadow-2xl md:p-8 ${
          closing ? 'animate-panel-out' : 'animate-panel-in'
        }`}
      >
        <header className="flex items-start justify-between gap-4 border-b border-mist pb-4">
          <div>
            <p className="text-[10px] tracking-wider2 text-ash">Calendario</p>
            <h2
              id={`${titleId}-heading`}
              className="mt-1 font-display text-3xl leading-none tracking-editorial"
            >
              {heading}
            </h2>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={requestClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center border border-mist text-lg text-ash transition-colors hover:border-ink hover:text-ink active:bg-pearl"
            aria-label="Cerrar"
          >
            ×
          </button>
        </header>

        {error && (
          <p
            role="alert"
            className="mt-4 border border-alarm px-3 py-2 text-xs text-alarm"
          >
            {error}
          </p>
        )}

        {editing ? (
          <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
            <div>
              <label htmlFor={`${titleId}-title`} className="label">
                Título
              </label>
              <input
                ref={titleRef}
                id={`${titleId}-title`}
                className="input text-base"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                maxLength={120}
                required
              />
            </div>

            <label className="flex cursor-pointer items-center gap-3 border border-mist px-3 py-3 text-sm active:bg-pearl">
              <input
                type="checkbox"
                checked={allDay}
                onChange={(event) => handleAllDayChange(event.target.checked)}
                className="h-4 w-4 accent-ink"
              />
              <span>Todo el día</span>
            </label>

            {allDay ? (
              <div>
                <label htmlFor={`${titleId}-date`} className="label">
                  Fecha
                </label>
                <input
                  id={`${titleId}-date`}
                  type="date"
                  className="input"
                  value={startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                  required
                />
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor={`${titleId}-start`} className="label">
                    Inicio
                  </label>
                  <input
                    id={`${titleId}-start`}
                    type="datetime-local"
                    className="input"
                    value={startLocal}
                    onChange={(event) => setStartLocal(event.target.value)}
                    required
                  />
                </div>
                <div>
                  <label htmlFor={`${titleId}-end`} className="label">
                    Fin
                  </label>
                  <input
                    id={`${titleId}-end`}
                    type="datetime-local"
                    className="input"
                    value={endLocal}
                    onChange={(event) => setEndLocal(event.target.value)}
                    required
                  />
                </div>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor={`${titleId}-owner`} className="label">
                  Quién
                </label>
                <select
                  id={`${titleId}-owner`}
                  className="input"
                  value={ownerId}
                  onChange={(event) => setOwnerId(event.target.value)}
                >
                  <option value="">Toda la casa</option>
                  {members.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name ?? 'Miembro'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor={`${titleId}-reminder`} className="label">
                  Recordatorio
                </label>
                <select
                  id={`${titleId}-reminder`}
                  className="input"
                  value={reminder}
                  onChange={(event) => setReminder(event.target.value)}
                >
                  {REMINDER_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor={`${titleId}-description`} className="label">
                Descripción
              </label>
              <textarea
                id={`${titleId}-description`}
                className="input min-h-24 resize-y"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                maxLength={1000}
              />
            </div>

            <p className="text-[10px] tracking-wider2 text-ash">
              El aviso se enviará a los dispositivos que tengan los avisos
              activados. Puedes gestionarlos en «Avisos».
            </p>

            <div className="flex flex-wrap gap-3 border-t border-mist pt-5">
              <button
                type="submit"
                className="btn-primary"
                disabled={pending}
              >
                {pending ? 'Guardando...' : event ? 'Guardar cambios' : 'Crear evento'}
              </button>
              <button
                type="button"
                className="btn-secondary"
                disabled={pending}
                onClick={() => {
                  if (event) {
                    setEditing(false);
                    setError('');
                  } else {
                    requestClose();
                  }
                }}
              >
                Cancelar
              </button>
            </div>
          </form>
        ) : (
          <div className="mt-6 space-y-6">
            <div>
              <p className="text-[10px] tracking-wider2 text-ash">
                {dateLabel}
              </p>
              <h3 className="mt-2 font-display text-3xl leading-tight tracking-editorial">
                {event?.title}
              </h3>
              <p className="mt-2 text-sm text-ash">
                {event ? formatEventTime(event) : ''}
              </p>
            </div>

            <dl className="divide-y divide-mist border-y border-mist text-sm">
              <div className="flex justify-between gap-4 py-3">
                <dt className="text-ash">Quién</dt>
                <dd>{event?.owner?.name ?? 'Toda la casa'}</dd>
              </div>
              <div className="flex justify-between gap-4 py-3">
                <dt className="text-ash">Recordatorio</dt>
                <dd>
                  {event ? formatReminder(event.reminderMinutes) : ''}
                </dd>
              </div>
              <div className="flex justify-between gap-4 py-3">
                <dt className="text-ash">Creado por</dt>
                <dd>{event?.createdBy.name ?? 'Miembro'}</dd>
              </div>
            </dl>

            {event?.description && (
              <p className="whitespace-pre-wrap text-sm text-ash">
                {event.description}
              </p>
            )}

            {!canEdit && (
              <p className="border border-mist px-3 py-2 text-xs text-ash">
                Solo quien creó el evento o un administrador puede editarlo.
              </p>
            )}

            <div className="flex flex-wrap gap-3 border-t border-mist pt-5">
              {canEdit && (
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setEditing(true)}
                >
                  Editar
                </button>
              )}

              {canEdit && !confirmingDelete && (
                <button
                  type="button"
                  className="btn-danger"
                  onClick={() => setConfirmingDelete(true)}
                >
                  Eliminar
                </button>
              )}

              {canEdit && confirmingDelete && (
                <div className="flex items-center gap-3">
                  <span className="text-xs text-ash">¿Eliminar?</span>
                  <button
                    type="button"
                    className="btn-danger"
                    disabled={pending}
                    onClick={handleDelete}
                  >
                    {pending ? 'Eliminando...' : 'Sí'}
                  </button>
                  <button
                    type="button"
                    className="text-xs text-ash underline-offset-4 hover:text-ink hover:underline"
                    disabled={pending}
                    onClick={() => setConfirmingDelete(false)}
                  >
                    No
                  </button>
                </div>
              )}

              <button
                type="button"
                className="btn-secondary"
                onClick={requestClose}
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
      </section>
    </div>,
    document.body,
  );
}
