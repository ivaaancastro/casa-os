import type { CalendarEvent } from '@/lib/events';
import type { CalendarDay, CalendarRange } from '@/lib/utils/calendar';

export type CalendarViewMode = 'month' | 'week';

export interface CalendarMember {
  id: string;
  name: string | null;
}

/** Props compartidas por la vista móvil y la de escritorio. `CalendarApp` es
 * el único dueño del estado; las vistas solo renderizan y avisan de la accion. */
export interface CalendarViewProps {
  view: CalendarViewMode;
  range: CalendarRange;
  events: CalendarEvent[];
  selectedDayKey: string | null;
  selectedDay: Date | null;
  selectedEvents: CalendarEvent[];
  loading: boolean;
  error: string;
  title: string;
  visibleCount: number;
  onShiftPeriod: (direction: number) => void;
  onGoToday: () => void;
  onChangeView: (view: CalendarViewMode) => void;
  onDayClick: (day: CalendarDay) => void;
  onSelectDay: (day: CalendarDay) => void;
  onOpenEvent: (event: CalendarEvent) => void;
  onCreateAt: (day: CalendarDay) => void;
  onCreate: () => void;
  onCreateForSelected: () => void;
  onCloseAgenda: () => void;
  onOpenReminders: () => void;
  onRetry: () => void;
}
