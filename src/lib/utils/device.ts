/**
 * Catálogo, normalización y estado de dispositivos.
 *
 * Sin dependencias de React ni de Zod: lo comparten la API, la UI y los tests.
 */

/** IPv4 con octetos 0–255; sin ceros a la izquierda (01.2.3.4 no vale). */
export const IPV4_REGEX =
  /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;

export function isValidIpv4(value: string): boolean {
  return IPV4_REGEX.test(value);
}

export const DEVICE_TYPES = [
  'ROUTER',
  'SWITCH',
  'ACCESS_POINT',
  'NAS',
  'PRINTER',
  'TV',
  'SPEAKER',
  'CAMERA',
  'PHONE',
  'LAPTOP',
  'DESKTOP',
  'TABLET',
  'IOT',
  'OTHER',
] as const;

export type DeviceType = (typeof DEVICE_TYPES)[number];

export const DEVICE_TYPE_LABELS: Record<DeviceType, string> = {
  ROUTER: 'Router',
  SWITCH: 'Switch',
  ACCESS_POINT: 'Punto de acceso',
  NAS: 'NAS',
  PRINTER: 'Impresora',
  TV: 'TV',
  SPEAKER: 'Altavoz',
  CAMERA: 'Cámara',
  PHONE: 'Móvil',
  LAPTOP: 'Portátil',
  DESKTOP: 'Sobremesa',
  TABLET: 'Tablet',
  IOT: 'IoT',
  OTHER: 'Otro',
};

/**
 * Normaliza una MAC a `AA:BB:CC:DD:EE:FF`.
 *
 * Acepta `:`, `-`, `.`, espacios o 12 caracteres hexadecimales seguidos.
 * Devuelve `null` si no es una MAC válida.
 */
export function normalizeMac(value: string): string | null {
  const clean = value.trim().replace(/[\s:.-]/g, '').toUpperCase();

  if (!/^[0-9A-F]{12}$/.test(clean)) return null;

  return clean.match(/.{2}/g)!.join(':');
}

export interface DeviceStatusInput {
  online: boolean;
  lastSeen: Date | string | null;
}

/**
 * Texto de estado para la UI.
 *
 * `online` manda; si no, se muestra cuándo se vio por última vez. Sin datos
 * (nunca escaneado) devuelve "Sin datos".
 */
export function formatDeviceStatus(
  device: DeviceStatusInput,
  now: Date = new Date(),
): string {
  if (device.online) return 'En línea';
  if (!device.lastSeen) return 'Sin datos';

  const lastSeen =
    device.lastSeen instanceof Date ? device.lastSeen : new Date(device.lastSeen);

  if (Number.isNaN(lastSeen.getTime())) return 'Sin datos';

  const diffMs = now.getTime() - lastSeen.getTime();
  if (diffMs < 60_000) return 'Ahora';

  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 60) return `Hace ${minutes} min`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Hace ${hours} h`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `Hace ${days} ${days === 1 ? 'día' : 'días'}`;

  return new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(lastSeen);
}
