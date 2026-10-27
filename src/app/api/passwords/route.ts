import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { encryptPasswords, decryptPasswords } from '@/lib/crypto';

export async function GET(request: NextRequest) {
  const auth = await requireUser();
  if (auth.response) return auth.response;

  const user = await prisma.user.findUnique({
    where: { id: auth.user.id },
    select: { encryptedPasswords: true }
  });

  if (!user?.encryptedPasswords) {
    return NextResponse.json([]);
  }

  const passwords = decryptPasswords(user.encryptedPasswords);
  if (passwords === null) {
    return NextResponse.json([]);
  }

  return NextResponse.json(Object.values(passwords) as any[]);
}

export async function POST(request: NextRequest) {
  const auth = await requireUser();
  if (auth.response) return auth.response;

  const body = await request.json();
  const { title, username, password, notes, category } = body;

  if (!title) {
    return NextResponse.json({ error: 'Título requerido' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: auth.user.id },
    select: { encryptedPasswords: true }
  });

  const existing = user?.encryptedPasswords;

  let existingMap: Record<string, string> = {};
  if (existing != null) {
    const decrypted = decryptPasswords(existing);
    if (decrypted) {
      existingMap = decrypted;
    }
  }

  if (existingMap[title]) {
    return NextResponse.json({ error: 'Ya existe una contraseña con ese título' }, { status: 409 });
  }

  existingMap[title] = password;

  await prisma.user.update({
    where: { id: auth.user.id },
    data: { encryptedPasswords: encryptPasswords(existingMap) }
  });

  return NextResponse.json({ success: true });
}
