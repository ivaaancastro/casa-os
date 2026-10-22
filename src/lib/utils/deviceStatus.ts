/**
 * Estado de los dispositivos: pertenencia a la red escaneada y transiciones
 * `online`/`lastSeen` al aplicar un escaneo.
 *
 * Sin dependencias de React, Prisma ni Zod: se puede testear con datos puros.
 */
import { isValidIpv4 } from './device';

export { formatRelativeTime } from './device';

export interface DeviceStatusRecord {
  id: string;
  name: string;
  ip: string;
  mac: string | null;
  online: boolean;
  lastSeen: Date | null;
}

export interface StatusChange {
  id: string;
  name: string;
}

export interface StaleStatusChange extends StatusChange {
  lastSeen: Date;
}

export interface StatusPlan {
  /** Equipos vistos: hay que ponerlos en línea con el nuevo `lastSeen`. */
  onlineIds: string[];
  /** Equipos que dejan de estar en línea. */
  offlineIds: string[];
  /** Transiciones a en línea (incluye los que nunca se habían visto). */
  connected: StatusChange[];
  /** Transiciones a ausente. */
  disconnected: StatusChange[];
  /** Equipos ignorados porque el escaneo es anterior a su `lastSeen`. */
  stale: StaleStatusChange[];
  /** Si el escaneo traía una red válida y se evaluaron ausencias. */
  offlineChecked: boolean;
}

function ipToInt(ip: string): number | null {
  if (!isValidIpv4(ip)) return null;

  const [a, b, c, d] = ip.split('.').map(Number);
  return ((a << 24) | (b << 16) | (c << 8) | d) >>> 0;
}

/** Convierte `192.168.1.0/24` en red y máscara; `null` si no es válido. */
export function parseCidr(
  value: string,
): { network: number; prefix: number } | null {
  const parts = value.trim().split('/');
  if (parts.length !== 2) return null;

  const [ip, rawPrefix] = parts;
  if (!/^(3[0-2]|[12]?\d)$/.test(rawPrefix)) return null;

  const address = ipToInt(ip);
  if (address === null) return null;

  const prefix = Number(rawPrefix);
  const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;

  return { network: (address & mask) >>> 0, prefix };
}

/** `true` si `ip` pertenece a la red indicada por `cidr`. */
export function isIpInCidr(ip: string, cidr: string): boolean {
  const parsed = parseCidr(cidr);
  const address = ipToInt(ip);
  if (!parsed || address === null) return false;

  const mask =
    parsed.prefix === 0 ? 0 : (0xffffffff << (32 - parsed.prefix)) >>> 0;
  return ((address & mask) >>> 0) === parsed.network;
}

/**
 * Calcula qué equipos cambian de estado con un escaneo.
 *
 * - `observedIds`: equipos del inventario que aparecen en el escaneo sin
 *   conflicto (los resuelve `classifyScanDevices`).
 * - Un escaneo anterior al `lastSeen` de un equipo nunca lo modifica.
 * - Solo se marcan ausentes equipos dentro del CIDR, ya vistos y que no
 *   aparezcan en el archivo.
 */
export function planStatusUpdates(input: {
  devices: DeviceStatusRecord[];
  observedIds: string[];
  /** Equipos ambiguos (conflicto/fila inválida): no se marcan ausentes. */
  protectedIds?: string[];
  scannedAt: Date;
  cidr: string | null;
}): StatusPlan {
  const observed = new Set(input.observedIds);
  const protectedIds = new Set(input.protectedIds ?? []);
  const staleIds = new Set<string>();

  const plan: StatusPlan = {
    onlineIds: [],
    offlineIds: [],
    connected: [],
    disconnected: [],
    stale: [],
    offlineChecked: Boolean(input.cidr && parseCidr(input.cidr)),
  };

  function markStale(device: DeviceStatusRecord) {
    if (staleIds.has(device.id)) return;
    staleIds.add(device.id);
    plan.stale.push({
      id: device.id,
      name: device.name,
      lastSeen: device.lastSeen!,
    });
  }

  for (const device of input.devices) {
    const isStale = Boolean(
      device.lastSeen && input.scannedAt.getTime() < device.lastSeen.getTime(),
    );

    if (observed.has(device.id)) {
      if (isStale) {
        markStale(device);
        continue;
      }

      plan.onlineIds.push(device.id);
      if (!device.online) {
        plan.connected.push({ id: device.id, name: device.name });
      }
      continue;
    }

    // Sin CIDR válido no se puede saber si la ausencia es real.
    if (!plan.offlineChecked || !input.cidr) continue;
    if (protectedIds.has(device.id)) continue;
    if (!isIpInCidr(device.ip, input.cidr)) continue;
    if (!device.lastSeen || !device.online) continue;

    if (isStale) {
      markStale(device);
      continue;
    }

    plan.offlineIds.push(device.id);
    plan.disconnected.push({ id: device.id, name: device.name });
  }

  return plan;
}
