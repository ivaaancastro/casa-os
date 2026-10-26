import { z } from 'zod';

export const PUSH_ENDPOINT_MAX = 1024;
export const PUSH_KEY_MAX = 255;
export const PUSH_AUTH_MAX = 64;
export const UPCOMING_DEFAULT_LIMIT = 5;

const endpointField = z
  .string()
  .trim()
  .min(1, 'El endpoint es obligatorio')
  .max(
    PUSH_ENDPOINT_MAX,
    `El endpoint no puede superar ${PUSH_ENDPOINT_MAX} caracteres`,
  )
  .url('El endpoint no es una URL válida')
  .refine((value) => value.startsWith('https://'), {
    message: 'El endpoint debe usar HTTPS',
  });

const keyField = z
  .string()
  .trim()
  .min(1, 'La clave p256dh es obligatoria')
  .max(PUSH_KEY_MAX, `La clave p256dh no puede superar ${PUSH_KEY_MAX} caracteres`);

const authField = z
  .string()
  .trim()
  .min(1, 'La clave auth es obligatoria')
  .max(PUSH_AUTH_MAX, `La clave auth no puede superar ${PUSH_AUTH_MAX} caracteres`);

/** Resultado de `PushSubscription.toJSON()` en el navegador. */
export const pushSubscriptionSchema = z.object({
  endpoint: endpointField,
  expirationTime: z.number().nullable().optional(),
  keys: z.object({
    p256dh: keyField,
    auth: authField,
  }),
});

export const upcomingRemindersQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(10).default(UPCOMING_DEFAULT_LIMIT),
});

export const pushSubscriptionIdSchema = z.string().trim().min(1).max(64);

export type PushSubscriptionInput = z.infer<typeof pushSubscriptionSchema>;
export type UpcomingRemindersQuery = z.infer<
  typeof upcomingRemindersQuerySchema
>;
