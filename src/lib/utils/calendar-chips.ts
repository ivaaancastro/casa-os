/**
 * Chips de eventos por día para la vista móvil del calendario.
 * `eventsForDay` ya ordena (todo el día primero, luego por hora); aquí solo se
 * limita cuántos se muestran y cuántos se resumen en «+N más».
 */
import { eventsForDay, type CalendarEventLike } from './calendar';

export interface DayChips<T extends CalendarEventLike> {
  visible: T[];
  hidden: number;
}

/** Hasta `limit` chips visibles y el número de eventos restantes. */
export function eventsForDayChips<T extends CalendarEventLike>(
  events: T[],
  day: Date,
  limit = 2,
): DayChips<T> {
  const dayEvents = eventsForDay(events, day);
  return {
    visible: dayEvents.slice(0, limit),
    hidden: Math.max(0, dayEvents.length - limit),
  };
}
