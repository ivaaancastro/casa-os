import { NextRequest } from 'next/server';
import { ZodError } from 'zod';
import { requireAdmin } from '@/lib/api-auth';
import { emptyNoStore, jsonNoStore } from '@/lib/api-response';
import { adminResetTwoFactorSchema } from '@/lib/schemas/two-factor';
import { isTwoFactorEnabled, resetTwoFactorByAdmin } from '@/lib/two-factor';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

  if (!(await isTwoFactorEnabled(auth.user.id))) {
    return jsonNoStore(
      { error: 'Activa 2FA en tu perfil antes de gestionar otros miembros' },
      403,
    );
  }

  try {
    adminResetTwoFactorSchema.parse(await request.json());
    const { id } = await params;
    const result = await resetTwoFactorByAdmin(auth.user.id, id);

    if (!result.ok) {
      if (result.error === 'SELF') {
        return jsonNoStore(
          { error: 'No puedes restablecer tu propio 2FA desde aqui' },
          400,
        );
      }
      if (result.error === 'NOT_FOUND') {
        return jsonNoStore({ error: 'Miembro no encontrado' }, 404);
      }
      return jsonNoStore({ error: 'El miembro no tiene 2FA activo' }, 400);
    }

    return emptyNoStore();
  } catch (error) {
    if (error instanceof ZodError) {
      return jsonNoStore({ error: 'Debes confirmar la operacion' }, 400);
    }
    return jsonNoStore({ error: 'Error del servidor' }, 500);
  }
}
