import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { createNoteSchema, listNotesSchema } from '@/lib/schemas/note';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = listNotesSchema.parse({
      type: searchParams.get('type') ?? undefined,
      completed: searchParams.get('completed') ?? undefined,
    });

    const where: Record<string, unknown> = {};
    if (query.type) where.type = query.type;
    if (query.completed !== undefined) where.completed = query.completed;

    const notes = await prisma.note.findMany({
      where,
      include: {
        author: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ notes });
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Parametros invalidos' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const data = createNoteSchema.parse(body);

    const note = await prisma.note.create({
      data: {
        ...data,
        authorId: session.user.id,
      },
      include: {
        author: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Datos invalidos' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
