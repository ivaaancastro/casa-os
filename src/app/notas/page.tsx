import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { NotesLayout } from '@/components/notes/NotesLayout';

export const dynamic = 'force-dynamic';

export default async function NotasPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/auth/login');
  }

  const notes = await prisma.note.findMany({
    include: {
      author: {
        select: { id: true, name: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="flex h-[calc(100dvh-5rem)] flex-col md:h-[calc(100dvh-6rem)] lg:h-[calc(100dvh-8rem)]">
      <section className="flex min-h-0 flex-1 border border-mist">
        <NotesLayout
          notes={notes}
          currentUserId={session.user.id}
          currentUserRole={session.user.role}
        />
      </section>
    </div>
  );
}
