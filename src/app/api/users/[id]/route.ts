import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { updateUserSchema } from '@/lib/schemas/user';
import { requireAdmin } from '@/lib/api-auth';
import { validateUserUpdate } from '@/lib/utils/user-rules';
import { publicUserSelect } from '@/lib/users';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;
  const admin = auth.user;

  try {
    const { id } = await params;
    const body = await request.json();
    const data = updateUserSchema.parse(body);

    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) {
      return NextResponse.json({ error: 'Miembro no encontrado' }, { status: 404 });
    }

    const activeAdminCount = await prisma.user.count({
      where: { role: 'ADMIN', active: true },
    });

    const ruleError = validateUserUpdate({
      isSelf: admin.id === target.id,
      currentRole: target.role,
      currentActive: target.active,
      activeAdminCount,
      nextRole: data.role,
      nextActive: data.active,
    });

    if (ruleError) {
      return NextResponse.json({ error: ruleError }, { status: 400 });
    }

    const updateData: { name?: string; role?: string; active?: boolean; password?: string } = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.role !== undefined) updateData.role = data.role;
    if (data.active !== undefined) updateData.active = data.active;
    if (data.password !== undefined) updateData.password = await bcrypt.hash(data.password, 12);

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: publicUserSelect,
    });

    return NextResponse.json(user);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Datos invalidos' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
