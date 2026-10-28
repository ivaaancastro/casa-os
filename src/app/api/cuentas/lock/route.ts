import { NextResponse } from 'next/server';
import { clearVaultGrantCookie } from '@/lib/vault/grant';
import { requireVaultUser } from '@/lib/vault/http';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST() {
  const auth = await requireVaultUser();
  if (auth.response) return auth.response;

  const response = new NextResponse(null, { status: 204 });
  response.headers.set('Cache-Control', 'no-store');
  clearVaultGrantCookie(response);
  return response;
}
