import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { prisma } from './prisma';
import type { EventInput } from './schemas/event';
export { canEditEvent } from './utils/event';

/** Include estándar de eventos con responsable y autor. */
export const eventWithPeople = {
  owner: { select: { id: true, name: true } },
  createdBy: { select: { id: true, name: true } },
} satisfies Prisma.EventInclude;

export type EventWithPeople = Prisma.EventGetPayload<{
  include: typeof eventWithPeople;
}>;

export interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  start: string;
  end: string | null;
  allDay: boolean;
  reminderMinutes: number | null;
  createdById: string;
  owner: { id: string; name: string | null } | null;
  createdBy: { id: string; name: string | null };
  createdAt: string;
  updatedAt: string;
}

/** El responsable debe ser un miembro activo. */
export async function activeMemberExists(userId: string): Promise<boolean> {
  const member = await prisma.user.findFirst({
    where: { id: userId, active: true },
    select: { id: true },
  });
  return Boolean(member);
}

/** Normaliza las fechas del formulario al modelo (`Date`). */
export function normalizeEventDates(data: EventInput): {
  start: Date;
  end: Date | null;
} {
  if (data.allDay) {
    return {
      start: new Date(`${data.start}T00:00:00.000Z`),
      end: null,
    };
  }

  return {
    start: new Date(data.start),
    end: data.end ? new Date(data.end) : null,
  };
}

/** Respuesta común para los errores de la API de eventos. */
export function eventErrorResponse(error: unknown) {
  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: error.issues[0]?.message ?? 'Datos no válidos' },
      { status: 400 },
    );
  }

  return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
}
