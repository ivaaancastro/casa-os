import { z } from 'zod';
import { DEVICE_TYPES, IPV4_REGEX, normalizeMac } from '../utils/device';

export const DEVICE_NAME_MAX = 80;
export const DEVICE_NOTES_MAX = 1000;

const nameField = z
  .string()
  .trim()
  .min(1, 'El nombre es obligatorio')
  .max(DEVICE_NAME_MAX, `El nombre no puede superar ${DEVICE_NAME_MAX} caracteres`);

const ipField = z
  .string()
  .trim()
  .regex(IPV4_REGEX, 'La IP no es válida (se espera IPv4)');

const macField = z
  .string()
  .trim()
  .nullable()
  .optional()
  .transform((value, ctx) => {
    // `undefined` = no enviado (en PATCH no se toca); `null`/'' = limpiar.
    if (value === undefined) return undefined;
    if (value === null || value === '') return null;

    const mac = normalizeMac(value);
    if (!mac) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'La MAC no es válida (AA:BB:CC:DD:EE:FF)',
      });
      return z.NEVER;
    }
    return mac;
  });

const notesField = z
  .string()
  .trim()
  .max(
    DEVICE_NOTES_MAX,
    `Las notas no pueden superar ${DEVICE_NOTES_MAX} caracteres`,
  )
  .nullable()
  .optional()
  .transform((value) => {
    if (value === undefined) return undefined;
    return value ? value : null;
  });

const typeField = z.enum(DEVICE_TYPES, {
  errorMap: () => ({ message: 'El tipo de dispositivo no es válido' }),
});

const ownerIdField = z
  .string()
  .trim()
  .min(1, 'El propietario no es válido')
  .nullable()
  .optional();

/**
 * Alta de dispositivo.
 *
 * `online` y `lastSeen` no se aceptan: los gestiona el escáner, no el cliente.
 */
export const createDeviceSchema = z.object({
  name: nameField,
  ip: ipField,
  mac: macField,
  type: typeField.default('OTHER'),
  ownerId: ownerIdField,
  notes: notesField,
});

/** Edición parcial. Un objeto vacío no es un cambio válido. */
export const updateDeviceSchema = z
  .object({
    name: nameField,
    ip: ipField,
    mac: macField,
    type: typeField,
    ownerId: ownerIdField,
    notes: notesField,
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'No hay cambios que aplicar',
  });

export type CreateDeviceInput = z.infer<typeof createDeviceSchema>;
export type UpdateDeviceInput = z.infer<typeof updateDeviceSchema>;
