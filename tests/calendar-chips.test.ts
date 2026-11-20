import { describe, expect, it } from 'vitest';
import { eventsForDayChips } from '../src/lib/utils/calendar-chips';
import type { CalendarEventLike } from '../src/lib/utils/calendar';

const DAY = new Date(2026, 10, 5, 12, 0, 0, 0); // 5 nov 2026, mediodía local

function event(
  id: string,
  start: string,
  allDay = false,
  title = id,
): CalendarEventLike & { id: string; title: string } {
  return { id, title, start, end: allDay ? null : start, allDay };
}

describe('eventsForDayChips', () => {
  it('devuelve listas vacías cuando el día no tiene eventos', () => {
    expect(eventsForDayChips([], DAY)).toEqual({ visible: [], hidden: 0 });
  });

  it('muestra un evento sin ocultar ninguno', () => {
    const events = [event('a', '2026-11-05T09:00:00Z')];
    expect(eventsForDayChips(events, DAY)).toEqual({
      visible: events,
      hidden: 0,
    });
  });

  it('muestra como máximo dos chips y cuenta el resto', () => {
    const events = [
      event('a', '2026-11-05T09:00:00Z'),
      event('b', '2026-11-05T11:00:00Z'),
      event('c', '2026-11-05T13:00:00Z'),
      event('d', '2026-11-05T15:00:00Z'),
    ];
    const result = eventsForDayChips(events, DAY);
    expect(result.visible.map((item) => item.id)).toEqual(['a', 'b']);
    expect(result.hidden).toBe(2);
  });

  it('respeta un límite distinto', () => {
    const events = [
      event('a', '2026-11-05T09:00:00Z'),
      event('b', '2026-11-05T11:00:00Z'),
      event('c', '2026-11-05T13:00:00Z'),
    ];
    const result = eventsForDayChips(events, DAY, 1);
    expect(result.visible.map((item) => item.id)).toEqual(['a']);
    expect(result.hidden).toBe(2);
  });

  it('pone primero los eventos de todo el día', () => {
    const timed = event('timed', '2026-11-05T08:00:00Z');
    const allDay = event('todo', '2026-11-05', true);
    const result = eventsForDayChips([timed, allDay], DAY);
    expect(result.visible.map((item) => item.id)).toEqual(['todo', 'timed']);
  });

  it('incluye eventos que cruzan medianoche', () => {
    const overnight = {
      ...event('overnight', '2026-11-04T23:00:00Z'),
      end: '2026-11-05T01:00:00Z',
    };
    expect(eventsForDayChips([overnight], DAY).visible).toEqual([overnight]);
  });

  it('no cuenta eventos de otro día', () => {
    const otherDay = event('other', '2026-11-06T09:00:00Z');
    expect(eventsForDayChips([otherDay], DAY)).toEqual({
      visible: [],
      hidden: 0,
    });
  });
});
