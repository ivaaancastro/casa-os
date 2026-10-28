import type { NextRequest } from 'next/server';
import { jsonNoStore } from '@/lib/api-response';
import { requireVaultAccess } from '@/lib/vault/access';
import { requireVaultUser } from '@/lib/vault/http';
import { listMembersWithVault } from '@/lib/vault/service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const auth = await requireVaultUser();
  if (auth.response) return auth.response;

  const access = await requireVaultAccess(request, auth.user);
  if (access.response) return access.response;

  const members = await listMembersWithVault();

  return jsonNoStore({
    members: members.map((member) => ({
      id: member.id,
      name: member.name,
      email: member.email,
      publicKey: member.vault?.publicKey ?? null,
      hasVault: !!member.vault,
    })),
  });
}
