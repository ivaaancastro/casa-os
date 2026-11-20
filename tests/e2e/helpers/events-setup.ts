import { prisma } from '../../../src/lib/prisma';

export const EVENT_ALLDAY_TITLE = 'Evento E2E todo el día';
export const EVENT_TIMED_TITLE = 'Evento E2E con hora';

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

/** Clave local `YYYY-MM-DD` del día de hoy, para el deep link y las fixtures. */
export function todayKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
}

/**
 * Deja dos eventos conocidos en el mes actual para el E2E de Calendario, con
 * ids fijos para no acumular datos entre ejecuciones. Solo BD local sembrada.
 */
export async function ensureEventsForE2E(): Promise<{ dateKey: string }> {
  const user = await prisma.user.findUnique({
    where: { email: process.env.E2E_EMAIL ?? 'admin@casa.local' },
  });
  if (!user) throw new Error('No existe el usuario E2E; ejecuta npm run db:seed');

  const dateKey = todayKey();
  const fixtures = [
    {
      id: 'e2e-event-allday',
      title: EVENT_ALLDAY_TITLE,
      start: new Date(`${dateKey}T00:00:00.000Z`),
      end: null,
      allDay: true,
    },
    {
      id: 'e2e-event-timed',
      title: EVENT_TIMED_TITLE,
      start: new Date(`${dateKey}T10:00:00.000Z`),
      end: new Date(`${dateKey}T11:00:00.000Z`),
      allDay: false,
    },
  ];

  for (const event of fixtures) {
    await prisma.event.upsert({
      where: { id: event.id },
      create: { ...event, createdById: user.id },
      update: {
        title: event.title,
        start: event.start,
        end: event.end,
        allDay: event.allDay,
      },
    });
  }

  await prisma.$disconnect();
  return { dateKey };
}
