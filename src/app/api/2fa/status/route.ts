import { requireUser } from '@/lib/api-auth';
import { jsonNoStore } from '@/lib/api-response';
import { listRecentAuthEvents } from '@/lib/auth-events';
import { getTwoFactorState } from '@/lib/two-factor';

export const dynamic = 'force-dynamic';

export async function GET() {
  const auth = await requireUser();
  if (auth.response) return auth.response;

  const [state, events] = await Promise.all([
    getTwoFactorState(auth.user.id),
    listRecentAuthEvents(auth.user.id, 10),
  ]);

  return jsonNoStore({
    enabled: state.enabled,
    recoveryCodesRemaining: state.recoveryCodesRemaining,
    confirmedAt: state.confirmedAt?.toISOString() ?? null,
    events: events.map((event) => ({
      id: event.id,
      action: event.action,
      // Solo un prefijo: el hash completo no aporta nada a la UI.
      ipHash: event.ipHash?.slice(0, 8) ?? null,
      createdAt: event.createdAt.toISOString(),
    })),
  });
}
