import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { prisma } from '@/lib/prisma';
import { updateProfileSchema } from '@/lib/schemas/user';
import { requireUser } from '@/lib/api-auth';
import { publicUserSelect } from '@/lib/users';

export async function GET() {
  const auth = await requireUser();
  if (auth.response) return auth.response;

  const user = await prisma.user.findUnique({
    where: { id: auth.user.id },
    select: publicUserSelect,
  });

  if (!user) {
    return NextResponse.json({ error: 'Miembro no encontrado' }, { status: 404 });
  }

  return NextResponse.json(user);
}

export async function PATCH(request: NextRequest) {
  const auth = await requireUser();
  if (auth.response) return auth.response;

  try {
    const body = await request.json();
    const data = updateProfileSchema.parse(body);

    const user = await prisma.user.update({
      where: { id: auth.user.id },
      data: { name: data.name },
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
