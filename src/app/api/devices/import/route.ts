import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/api-auth';
import { importScanSchema } from '@/lib/schemas/scan';
import {
  classifyScanDevices,
  type ScanClassification,
} from '@/lib/utils/scan';

function summarize(items: ScanClassification[]) {
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
  };
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

  try {
    const data = importScanSchema.parse(await request.json());

    const existing = await prisma.device.findMany({
      select: { id: true, name: true, ip: true, mac: true },
      orderBy: { name: 'asc' },
    });

    const items = classifyScanDevices({ devices: data.devices, existing });
    const metadata = {
      scannedAt: data.scannedAt ?? null,
      cidr: data.cidr ?? null,
    };

    if (data.dryRun) {
      return NextResponse.json({
        dryRun: true,
        ...metadata,
        summary: summarize(items),
        items,
      });
    }

    const newItems = items.filter((item) => item.status === 'new');

    if (newItems.length === 0) {
      return NextResponse.json({
        dryRun: false,
        ...metadata,
        created: 0,
        skipped: 0,
        summary: summarize(items),
        items,
      });
    }

    const result = await prisma.device.createMany({
      data: newItems.map((item) => ({
        name: item.suggestedName,
        ip: item.ip,
        mac: item.mac,
        type: 'OTHER',
      })),
      skipDuplicates: true,
    });

    const skipped = newItems.length - result.count;

    return NextResponse.json(
      {
        dryRun: false,
        ...metadata,
        created: result.count,
        skipped,
        summary: {
          ...summarize(items),
          created: result.count,
          skipped,
        },
        items,
      },
      { status: result.count > 0 ? 201 : 200 },
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Datos del escaneo no válidos' },
        { status: 400 },
      );
    }

    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
