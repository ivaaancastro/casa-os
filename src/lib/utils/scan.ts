/**
 * Escaneo de red: parseo de nmap, validación y clasificación.
 *
 * Sin dependencias de React, Prisma ni `child_process`: se puede testear con
 * fixtures y lo comparten el CLI y la API.
 */
import { isValidIpv4, normalizeMac } from './device';

export { isValidIpv4 };

export const SCAN_VERSION = 1 as const;
export const SCAN_MAX_DEVICES = 512;
export const SCAN_NAME_MAX = 80;

export interface ScannedDevice {
  ip: string;
  mac?: string;
  vendor?: string;
}

export interface ScanPayload {
  version: 1;
  scannedAt: string;
  cidr: string;
  devices: ScannedDevice[];
}

export type ScanStatus =
  | 'new'
  | 'existing'
  | 'conflict'
  | 'duplicate'
  | 'invalid';

export const SCAN_STATUS_LABELS: Record<ScanStatus, string> = {
  new: 'Nuevo',
  existing: 'Ya existe',
  conflict: 'Conflicto',
  duplicate: 'Duplicado',
  invalid: 'Inválido',
};

export interface ExistingScanDevice {
  id: string;
  name: string;
  ip: string;
  mac: string | null;
}

export interface ScanCandidate {
  ip: string;
  mac?: string | null;
  vendor?: string | null;
  name?: string | null;
}

export interface ScanClassification {
  index: number;
  ip: string;
  mac: string | null;
  vendor: string | null;
  suggestedName: string;
  status: ScanStatus;
  reason: string;
  existingDevice: ExistingScanDevice | null;
  ipDevice: ExistingScanDevice | null;
  macDevice: ExistingScanDevice | null;
}

/** CIDR IPv4, con prefijo 0–32 sin ceros a la izquierda. */
export function isValidCidr(value: string): boolean {
  const parts = value.trim().split('/');
  if (parts.length !== 2) return false;

  const [ip, prefix] = parts;
  return isValidIpv4(ip) && /^(3[0-2]|[12]?\d)$/.test(prefix);
}

/**
 * Extrae los equipos de la salida de `nmap -sn`.
 *
 * Soporta `Nmap scan report for 192.168.1.1` y
 * `Nmap scan report for router.local (192.168.1.1)`. Ignora hosts caídos,
 * normaliza MAC y deduplica por IP y MAC.
 */
export function parseNmapOutput(stdout: string): ScannedDevice[] {
  interface PendingDevice extends ScannedDevice {
    up?: boolean;
  }

  const devices: ScannedDevice[] = [];
  const seenIps = new Set<string>();
  const seenMacs = new Set<string>();
  let current: PendingDevice | null = null;

  function pushCurrent() {
    if (!current) return;

    if (
      current.up !== false &&
      isValidIpv4(current.ip) &&
      !seenIps.has(current.ip) &&
      (!current.mac || !seenMacs.has(current.mac))
    ) {
      devices.push({
        ip: current.ip,
        ...(current.mac ? { mac: current.mac } : {}),
        ...(current.vendor ? { vendor: current.vendor } : {}),
      });
      seenIps.add(current.ip);
      if (current.mac) seenMacs.add(current.mac);
    }

    current = null;
  }

  for (const line of stdout.split(/\r?\n/)) {
    const report = line.match(
      /^Nmap scan report for (?:.+ \()?(\d{1,3}(?:\.\d{1,3}){3})\)?\s*$/,
    );

    if (report) {
      pushCurrent();
      current = { ip: report[1] };
      continue;
    }

    if (!current) continue;

    if (/^Host is down\b/.test(line)) {
      current.up = false;
      continue;
    }

    if (/^Host is up\b/.test(line)) {
      current.up = true;
      continue;
    }

    const mac = line.match(
      /^MAC Address:\s+([0-9A-Fa-f:.-]+)(?:\s+\((.+)\))?\s*$/,
    );
    if (mac) {
      const normalized = normalizeMac(mac[1]);
      if (normalized) current.mac = normalized;
      if (mac[2]?.trim()) current.vendor = mac[2].trim();
    }
  }

  pushCurrent();
  return devices;
}

/** Construye el JSON que se sube a `/api/devices/import`. */
export function buildScanPayload(
  cidr: string,
  devices: ScannedDevice[],
  scannedAt: Date = new Date(),
): ScanPayload {
  return {
    version: SCAN_VERSION,
    scannedAt: scannedAt.toISOString(),
    cidr: cidr.trim(),
    devices: devices.map((device) => ({
      ip: device.ip.trim(),
      ...(device.mac ? { mac: device.mac } : {}),
      ...(device.vendor?.trim() ? { vendor: device.vendor.trim() } : {}),
    })),
  };
}

/** Nombre inicial para un equipo importado. */
export function suggestDeviceName(
  candidate: Pick<ScanCandidate, 'ip' | 'vendor' | 'name'>,
): string {
  const explicit = candidate.name?.trim();
  const vendor = candidate.vendor?.trim();
  const ip = candidate.ip.trim();

  const name = explicit || (vendor ? `${vendor} (${ip})` : `Dispositivo ${ip}`);

  if (name.length <= SCAN_NAME_MAX) return name;
  return `${name.slice(0, SCAN_NAME_MAX - 3).trimEnd()}...`;
}

/**
 * Clasifica cada fila del escaneo contra el inventario.
 *
 * No escribe nada: la API decide si crear las filas `new`.
 */
export function classifyScanDevices(input: {
  devices: ScanCandidate[];
  existing: ExistingScanDevice[];
}): ScanClassification[] {
  const byIp = new Map<string, ExistingScanDevice>();
  const byMac = new Map<string, ExistingScanDevice>();

  for (const device of input.existing) {
    if (isValidIpv4(device.ip)) byIp.set(device.ip, device);

    const mac = device.mac ? normalizeMac(device.mac) : null;
    if (mac) byMac.set(mac, device);
  }

  const seenIps = new Set<string>();
  const seenMacs = new Set<string>();

  return input.devices.map((candidate, index) => {
    const ip = candidate.ip.trim();
    const rawMac = candidate.mac?.trim() || null;
    const mac = rawMac ? normalizeMac(rawMac) : null;
    const vendor = candidate.vendor?.trim() || null;
    const base = {
      index,
      ip,
      mac,
      vendor,
      suggestedName: suggestDeviceName({ ip, vendor, name: candidate.name }),
      existingDevice: null,
      ipDevice: null,
      macDevice: null,
    };

    if (!isValidIpv4(ip)) {
      return {
        ...base,
        status: 'invalid' as const,
        reason: 'La IP no es válida',
      };
    }

    if (rawMac && !mac) {
      return {
        ...base,
        status: 'invalid' as const,
        reason: 'La MAC no es válida',
      };
    }

    if (seenIps.has(ip) || (mac && seenMacs.has(mac))) {
      return {
        ...base,
        status: 'duplicate' as const,
        reason: 'Repetido en el archivo',
      };
    }

    seenIps.add(ip);
    if (mac) seenMacs.add(mac);

    const ipDevice = byIp.get(ip) ?? null;
    const macDevice = mac ? (byMac.get(mac) ?? null) : null;

    if (ipDevice && macDevice && ipDevice.id !== macDevice.id) {
      return {
        ...base,
        status: 'conflict' as const,
        reason: 'La IP y la MAC pertenecen a dispositivos distintos',
        ipDevice,
        macDevice,
      };
    }

    if (ipDevice || macDevice) {
      const existingDevice = ipDevice ?? macDevice!;
      const reason =
        ipDevice && macDevice
          ? 'Ya existe (IP y MAC coinciden)'
          : ipDevice
            ? 'Ya existe un dispositivo con esa IP'
            : 'Ya existe un dispositivo con esa MAC';

      return {
        ...base,
        status: 'existing' as const,
        reason,
        existingDevice,
        ipDevice,
        macDevice,
      };
    }

    return {
      ...base,
      status: 'new' as const,
      reason: 'No existe en el inventario',
    };
  });
}
