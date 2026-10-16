import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { createUserSchema } from '@/lib/schemas/user';
import { requireAdmin, requireUser } from '@/lib/api-auth';
import { publicUserSelect } from '@/lib/users';

export async function GET() {
  const auth = await requireUser();
  if (auth.response) return auth.response;

  const users = await prisma.user.findMany({
    select: publicUserSelect,
    orderBy: { createdAt: 'asc' },
  });

  return NextResponse.json(users);
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

  try {
    const body = await request.json();
    const data = createUserSchema.parse(body);

    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      return NextResponse.json({ error: 'Ya existe un miembro con ese email' }, { status: 409 });
    }

    const password = await bcrypt.hash(data.password, 12);
    const user = await prisma.user.create({
      data: { name: data.name, email: data.email, role: data.role, password },
      select: publicUserSelect,
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Datos invalidos' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
