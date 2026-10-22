import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/api-auth';
import { importScanSchema } from '@/lib/schemas/scan';
import {
  classifyScanDevices,
  type ScanClassification,
} from '@/lib/utils/scan';
import {
  planStatusUpdates,
  type StatusPlan,
} from '@/lib/utils/deviceStatus';
import { normalizeMac } from '@/lib/utils/device';

const EMPTY_PLAN: StatusPlan = {
  onlineIds: [],
  offlineIds: [],
  connected: [],
  disconnected: [],
  stale: [],
  offlineChecked: false,
};

function summarize(items: ScanClassification[], plan: StatusPlan) {
  const count = (status: ScanClassification['status']) =>
    items.filter((item) => item.status === status).length;

  return {
    total: items.length,
    new: count('new'),
    existing: count('existing'),
    conflict: count('conflict'),
    duplicate: count('duplicate'),
    invalid: count('invalid'),
    created: 0,
    skipped: 0,
    connected: plan.connected.length,
    disconnected: plan.disconnected.length,
    stale: plan.stale.length,
  };
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

  try {
    const data = importScanSchema.parse(await request.json());

    const existing = await prisma.device.findMany({
      select: {
        id: true,
        name: true,
        ip: true,
        mac: true,
        online: true,
        lastSeen: true,
      },
      orderBy: { name: 'asc' },
    });

    const items = classifyScanDevices({ devices: data.devices, existing });
    const scannedAt = data.scannedAt ? new Date(data.scannedAt) : null;
    const statusApplied = scannedAt !== null;
    const observedIds = [
      ...new Set(
        items
          .filter((item) => item.status === 'existing' && item.existingDevice)
          .map((item) => item.existingDevice!.id),
      ),
    ];

    // Un conflicto o una fila inválida no son prueba de que el equipo se haya
    // ido: se protegen de la detección de ausencias.
    const byIp = new Map(existing.map((device) => [device.ip, device.id]));
    const byMac = new Map(
      existing.flatMap((device) => {
        const mac = device.mac ? normalizeMac(device.mac) : null;
        return mac ? [[mac, device.id] as const] : [];
      }),
    );
    const protectedIds = new Set<string>();

    for (const item of items) {
      if (item.status === 'existing' || item.status === 'new') continue;

      const ipDeviceId = byIp.get(item.ip);
      if (ipDeviceId) protectedIds.add(ipDeviceId);

      const mac = item.mac ? normalizeMac(item.mac) : null;
      const macDeviceId = mac ? byMac.get(mac) : undefined;
      if (macDeviceId) protectedIds.add(macDeviceId);

      if (item.ipDevice) protectedIds.add(item.ipDevice.id);
      if (item.macDevice) protectedIds.add(item.macDevice.id);
    }

    const plan =
      scannedAt !== null
        ? planStatusUpdates({
            devices: existing,
            observedIds,
            protectedIds: [...protectedIds],
            scannedAt,
            cidr: data.cidr ?? null,
          })
        : EMPTY_PLAN;

    const metadata = {
      scannedAt: data.scannedAt ?? null,
      cidr: data.cidr ?? null,
      statusApplied,
      offlineChecked: plan.offlineChecked,
    };
    const changes = {
      connected: plan.connected,
      disconnected: plan.disconnected,
      stale: plan.stale,
    };

    if (data.dryRun) {
      return NextResponse.json({
        dryRun: true,
        ...metadata,
        summary: summarize(items, plan),
        changes,
        items,
      });
    }

    const newItems = items.filter((item) => item.status === 'new');
    const importIps = data.importIps ? new Set(data.importIps) : null;
    const toCreate = importIps
      ? newItems.filter((item) => importIps.has(item.ip))
      : newItems;

    const result = await prisma.$transaction(async (tx) => {
      const created = await tx.device.createMany({
        data: toCreate.map((item) => ({
          name: item.suggestedName,
          ip: item.ip,
          mac: item.mac,
          type: 'OTHER',
          online: statusApplied,
          lastSeen: scannedAt,
        })),
        skipDuplicates: true,
      });

      if (scannedAt !== null && plan.onlineIds.length > 0) {
        await tx.device.updateMany({
          where: { id: { in: plan.onlineIds } },
          data: { online: true, lastSeen: scannedAt },
        });
      }

      if (plan.offlineIds.length > 0) {
        await tx.device.updateMany({
          where: { id: { in: plan.offlineIds } },
          data: { online: false },
        });
      }

      return created;
    });

    const skipped = toCreate.length - result.count;

    return NextResponse.json(
      {
        dryRun: false,
        ...metadata,
        created: result.count,
        skipped,
        summary: {
          ...summarize(items, plan),
          created: result.count,
          skipped,
        },
        changes,
        items,
      },
      { status: result.count > 0 ? 201 : 200 },
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error:
            error.issues[0]?.message ?? 'Datos del escaneo no válidos',
        },
        { status: 400 },
      );
    }

    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
