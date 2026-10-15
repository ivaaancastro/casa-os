import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { NoteList } from '@/components/notes/NoteList';
import { NoteFilters } from '@/components/notes/NoteFilters';

export const dynamic = 'force-dynamic';

export default async function NotasPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; completed?: string }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/auth/login');
  }

  const params = await searchParams;

  const where: Record<string, unknown> = {};
  if (params.type && ['SHOPPING', 'GENERAL', 'TODO'].includes(params.type)) {
    where.type = params.type;
  }
  if (params.completed === 'true' || params.completed === 'false') {
    where.completed = params.completed === 'true';
  }

  const notes = await prisma.note.findMany({
    where,
    include: {
      author: {
        select: { id: true, name: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Notas</h1>
      <p className="text-gray-600 mb-6">Notas compartidas para toda la familia.</p>

      <NoteFilters />

      <NoteList
        notes={notes}
        currentUserId={session.user.id}
        currentUserRole={session.user.role}
      />
    </div>
  );
}
