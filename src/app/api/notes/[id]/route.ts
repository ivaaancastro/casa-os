import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { updateNoteSchema } from '@/lib/schemas/note';
import { authOptions } from '@/lib/auth';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;

    const existing = await prisma.note.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Nota no encontrada' }, { status: 404 });
    }

    if (existing.authorId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const body = await request.json();
    const data = updateNoteSchema.parse(body);

    const note = await prisma.note.update({
      where: { id },
      data,
      include: {
        author: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json(note);
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Datos invalidos' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;

    const existing = await prisma.note.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Nota no encontrada' }, { status: 404 });
    }

    if (existing.authorId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    await prisma.note.delete({ where: { id } });

    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
