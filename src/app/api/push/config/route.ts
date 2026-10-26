import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/api-auth';
import { getVapidConfig } from '@/lib/push';
import { DEFAULT_HOUSE_TIMEZONE } from '@/lib/reminders';

export const dynamic = 'force-dynamic';

export async function GET() {
  const auth = await requireUser();
  if (auth.response) return auth.response;

  const config = getVapidConfig();
  const houseTimezone =
    process.env.HOUSE_TIMEZONE?.trim() || DEFAULT_HOUSE_TIMEZONE;

  return NextResponse.json(
    {
      publicKey: config?.publicKey ?? null,
      houseTimezone,
    },
    {
      headers: { 'Cache-Control': 'no-store' },
    },
  );
}
