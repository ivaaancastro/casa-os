import { z } from 'zod';

export const NOTE_TYPES = ['SHOPPING', 'GENERAL', 'TODO'] as const;
export type NoteType = (typeof NOTE_TYPES)[number];

export const createNoteSchema = z.object({
  title: z
    .string()
    .min(3, 'El titulo debe tener al menos 3 caracteres')
    .max(100, 'El titulo no puede superar 100 caracteres'),
  content: z
    .string()
    .min(1, 'El contenido no puede estar vacio')
    .max(2000, 'El contenido no puede superar 2000 caracteres'),
  type: z.enum(NOTE_TYPES, {
    errorMap: () => ({ message: 'Tipo debe ser SHOPPING, GENERAL o TODO' }),
  }),
});

export const updateNoteSchema = z.object({
  title: z
    .string()
    .min(3, 'El titulo debe tener al menos 3 caracteres')
    .max(100, 'El titulo no puede superar 100 caracteres')
    .optional(),
  content: z
    .string()
    .min(1, 'El contenido no puede estar vacio')
    .max(2000, 'El contenido no puede superar 2000 caracteres')
    .optional(),
  type: z.enum(NOTE_TYPES).optional(),
  completed: z.boolean().optional(),
});

export const listNotesSchema = z.object({
  type: z.enum(NOTE_TYPES).optional(),
  completed: z
    .enum(['true', 'false'])
    .transform((val) => val === 'true')
    .optional(),
});

export type CreateNoteInput = z.infer<typeof createNoteSchema>;
export type UpdateNoteInput = z.infer<typeof updateNoteSchema>;
export type ListNotesQuery = z.infer<typeof listNotesSchema>;
