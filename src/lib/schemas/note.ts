import { z } from 'zod';

export const NOTE_TYPES = ['SHOPPING', 'GENERAL', 'TODO'] as const;
export type NoteType = (typeof NOTE_TYPES)[number];

// Limites amplios: el titulo es la primera linea del contenido (tipo Apple Notas)
// y el contenido admite formatos ricos (listas, tablas, etc.).
export const NOTE_TITLE_MAX = 200;
export const NOTE_CONTENT_MAX = 100000;

export const createNoteSchema = z.object({
  title: z
    .string()
    .max(NOTE_TITLE_MAX, `El titulo no puede superar ${NOTE_TITLE_MAX} caracteres`)
    .default(''),
  content: z
    .string()
    .max(NOTE_CONTENT_MAX, `El contenido no puede superar ${NOTE_CONTENT_MAX} caracteres`)
    .default(''),
  type: z.enum(NOTE_TYPES, {
    errorMap: () => ({ message: 'Tipo debe ser SHOPPING, GENERAL o TODO' }),
  }),
});

export const updateNoteSchema = z.object({
  title: z
    .string()
    .max(NOTE_TITLE_MAX, `El titulo no puede superar ${NOTE_TITLE_MAX} caracteres`)
    .optional(),
  content: z
    .string()
    .max(NOTE_CONTENT_MAX, `El contenido no puede superar ${NOTE_CONTENT_MAX} caracteres`)
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
