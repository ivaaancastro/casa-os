import type { NextRequest } from 'next/server';
import { jsonNoStore } from '@/lib/api-response';
import { requireVaultAccess } from '@/lib/vault/access';
import { listVaultEvents } from '@/lib/vault/audit';
import { requireVaultUser } from '@/lib/vault/http';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const auth = await requireVaultUser();
  if (auth.response) return auth.response;

  const access = await requireVaultAccess(request, auth.user);
  if (access.response) return access.response;

  const events = await listVaultEvents(auth.user.id, 50);

  return jsonNoStore({
    events: events.map((event) => ({
      id: event.id,
      action: event.action,
      targetId: event.targetId,
      actorId: event.actorId,
      createdAt: event.createdAt.toISOString(),
    })),
  });
}
