import { z } from 'zod';
import {
  SCAN_MAX_DEVICES,
  SCAN_NAME_MAX,
  SCAN_VERSION,
  isValidCidr,
} from '../utils/scan';
import { IPV4_REGEX } from '../utils/device';

const scanDeviceSchema = z.object({
  ip: z
    .string()
    .trim()
    .min(1, 'La IP es obligatoria')
    .max(64, 'La IP no puede superar 64 caracteres'),
  mac: z
    .string()
    .trim()
    .max(64, 'La MAC no puede superar 64 caracteres')
    .nullable()
    .optional(),
  vendor: z
    .string()
    .trim()
    .max(120, 'El fabricante no puede superar 120 caracteres')
    .nullable()
    .optional(),
  name: z
    .string()
    .trim()
    .max(SCAN_NAME_MAX, `El nombre no puede superar ${SCAN_NAME_MAX} caracteres`)
    .nullable()
    .optional(),
});

/**
 * Payload que sube la UI. `dryRun` es `true` por defecto para que una petición
 * sin intención explícita solo previsualice.
 *
 * `importIps` limita qué filas `new` se crean; el resto del archivo se usa para
 * actualizar el estado de los equipos existentes.
 */
export const importScanSchema = z
  .object({
    version: z.literal(SCAN_VERSION).optional(),
    scannedAt: z
      .string()
      .trim()
      .max(40)
      .refine(
        (value) => !Number.isNaN(Date.parse(value)),
        'La fecha del escaneo no es válida',
      )
      .optional(),
    cidr: z
      .string()
      .trim()
      .max(40)
      .refine(isValidCidr, 'El CIDR no es válido')
      .optional(),
    dryRun: z.boolean().default(true),
    importIps: z
      .array(
        z
          .string()
          .trim()
          .regex(IPV4_REGEX, 'La IP de la selección no es válida'),
      )
      .max(
        SCAN_MAX_DEVICES,
        `La selección no puede superar ${SCAN_MAX_DEVICES} dispositivos`,
      )
      .optional(),
    devices: z
      .array(scanDeviceSchema)
      .min(1, 'El escaneo no contiene dispositivos')
      .max(
        SCAN_MAX_DEVICES,
        `El escaneo no puede superar ${SCAN_MAX_DEVICES} dispositivos`,
      ),
  })
  .superRefine((data, ctx) => {
    if (!data.scannedAt) return;

    const scannedAt = Date.parse(data.scannedAt);
    if (scannedAt > Date.now() + 5 * 60_000) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['scannedAt'],
        message: 'La fecha del escaneo está en el futuro',
      });
    }
  });

export type ImportScanInput = z.infer<typeof importScanSchema>;
