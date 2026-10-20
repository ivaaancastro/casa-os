import { z } from 'zod';
import { SCAN_MAX_DEVICES, SCAN_NAME_MAX, SCAN_VERSION } from '../utils/scan';

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
 */
export const importScanSchema = z.object({
  version: z.literal(SCAN_VERSION).optional(),
  scannedAt: z.string().trim().max(40).optional(),
  cidr: z.string().trim().max(40).optional(),
  dryRun: z.boolean().default(true),
  devices: z
    .array(scanDeviceSchema)
    .min(1, 'El escaneo no contiene dispositivos')
    .max(
      SCAN_MAX_DEVICES,
      `El escaneo no puede superar ${SCAN_MAX_DEVICES} dispositivos`,
    ),
});

export type ImportScanInput = z.infer<typeof importScanSchema>;
