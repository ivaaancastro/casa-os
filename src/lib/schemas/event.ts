import { z } from 'zod';

export const EVENT_TITLE_MAX = 120;
export const EVENT_DESCRIPTION_MAX = 1000;
export const REMINDER_OPTIONS = [0, 10, 30, 60, 1440] as const;

const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const DATE_TIME_REGEX =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2})$/;

export function isDateOnly(value: string): boolean {
  if (!DATE_ONLY_REGEX.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return (
    !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
}

export function parseDateTime(value: string): Date | null {
  if (!DATE_TIME_REGEX.test(value)) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

const titleField = z
  .string()
  .trim()
  .min(1, 'El título es obligatorio')
  .max(
    EVENT_TITLE_MAX,
    `El título no puede superar ${EVENT_TITLE_MAX} caracteres`,
  );

const descriptionField = z
  .string()
  .trim()
  .max(
    EVENT_DESCRIPTION_MAX,
    `La descripción no puede superar ${EVENT_DESCRIPTION_MAX} caracteres`,
  )
  .nullable()
  .optional()
  .transform((value) => (value ? value : null));

const ownerIdField = z
  .string()
  .trim()
  .nullable()
  .optional()
  .transform((value) => (value ? value : null));

const reminderField = z
  .union([
    z.literal(0),
    z.literal(10),
    z.literal(30),
    z.literal(60),
    z.literal(1440),
  ])
  .nullable()
  .optional()
  .transform((value) => value ?? null);

const endField = z
  .string()
  .trim()
  .max(40)
  .nullable()
  .optional()
  .transform((value) => (value ? value : null));

/**
 * Alta y edición comparten contrato: el formulario envía el evento completo.
 *
 * - Todo el día: `start` es `YYYY-MM-DD` y `end` debe ser `null`.
 * - Con hora: `start` y `end` son ISO 8601 con zona; `end > start`.
 */
export const eventInputSchema = z
  .object({
    title: titleField,
    description: descriptionField,
    allDay: z.boolean().default(false),
    start: z.string().trim().min(1, 'La fecha es obligatoria').max(40),
    end: endField,
    reminderMinutes: reminderField,
    ownerId: ownerIdField,
  })
  .superRefine((data, ctx) => {
    if (data.allDay) {
      if (!isDateOnly(data.start)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['start'],
          message: 'La fecha no es válida (se espera YYYY-MM-DD)',
        });
      }

      if (data.end !== null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['end'],
          message: 'Un evento de todo el día no lleva hora de fin',
        });
      }
      return;
    }

    const start = parseDateTime(data.start);
    if (!start) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['start'],
        message: 'La fecha y hora de inicio no son válidas',
      });
      return;
    }

    if (!data.end) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['end'],
        message: 'La hora de fin es obligatoria',
      });
      return;
    }

    const end = parseDateTime(data.end);
    if (!end) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['end'],
        message: 'La fecha y hora de fin no son válidas',
      });
      return;
    }

    if (end.getTime() <= start.getTime()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['end'],
        message: 'La hora de fin debe ser posterior a la de inicio',
      });
    }
  });

export const updateEventSchema = eventInputSchema;

export const listEventsQuerySchema = z
  .object({
    from: z.string().trim().max(40).optional(),
    to: z.string().trim().max(40).optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.from && !data.to) return;

    if (!data.from || !data.to) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['from'],
        message: 'Debes indicar el inicio y el fin del rango',
      });
      return;
    }

    const from = parseDateTime(data.from);
    const to = parseDateTime(data.to);

    if (!from) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['from'],
        message: 'El inicio del rango no es válido',
      });
    }
    if (!to) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['to'],
        message: 'El fin del rango no es válido',
      });
    }
    if (from && to && to.getTime() <= from.getTime()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['to'],
        message: 'El fin del rango debe ser posterior al inicio',
      });
    }
  });

export type EventInput = z.infer<typeof eventInputSchema>;
export type ListEventsQuery = z.infer<typeof listEventsQuerySchema>;
