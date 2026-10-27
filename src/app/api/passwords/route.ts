import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { encryptPassword } from '@/lib/crypto';

export async function GET(request: NextRequest) {
  const auth = await requireUser();
  if (auth.response) return auth.response;

  const passwords = await prisma.passwordEntry.findMany({
    where: { userId: auth.user.id },
    select: { id: true, title: true, url: true, username: true, notes: true, category: true }
  });

  return NextResponse.json(passwords);
}

export async function POST(request: NextRequest) {
  const auth = await requireUser();
  if (auth.response) return auth.response;

  const body = await request.json();
  const { title, url, username, password, notes, category } = body;

  if (!title) {
    return NextResponse.json({ error: 'Título requerido' }, { status: 400 });
  }

  const passwordHash = await encryptPassword(password ?? '');

  const entry = await prisma.passwordEntry.create({
    data: {
      userId: auth.user.id,
      title,
      url,
      username,
      passwordHash,
      notes,
      category
    }
  });

  return NextResponse.json(entry, { status: 201 });
}
