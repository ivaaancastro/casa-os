import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { changePasswordSchema } from '@/lib/schemas/user';
import { requireUser } from '@/lib/api-auth';
import { getClientIp, logAuthEvent } from '@/lib/auth-events';

export async function POST(request: NextRequest) {
  const auth = await requireUser();
  if (auth.response) return auth.response;

  try {
    const body = await request.json();
    const data = changePasswordSchema.parse(body);

    const user = await prisma.user.findUnique({ where: { id: auth.user.id } });
    if (!user?.password) {
      return NextResponse.json({ error: 'No se puede cambiar la contrasena' }, { status: 400 });
    }

    const isValid = await bcrypt.compare(data.currentPassword, user.password);
    if (!isValid) {
      return NextResponse.json({ error: 'La contrasena actual no es correcta' }, { status: 400 });
    }

    const password = await bcrypt.hash(data.newPassword, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: { password, sessionVersion: { increment: 1 } },
    });

    await logAuthEvent({
      userId: user.id,
      action: 'PASSWORD_CHANGED',
      ip: getClientIp(request),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Datos invalidos' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
