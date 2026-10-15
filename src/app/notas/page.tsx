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
    <div className="grid grid-cols-12 gap-y-8">
      <header className="col-span-12 border-t border-mist pt-8">
        <p className="text-xs text-ash tracking-wider2 mb-4">Casa · Notas</p>
        <h1 className="font-display text-5xl md:text-6xl tracking-editorial leading-[0.9]">
          Notas
        </h1>
      </header>
      <section className="col-span-12 h-[calc(100vh-13rem)] border border-mist">
        <NotesLayout
          notes={notes}
          currentUserId={session.user.id}
          currentUserRole={session.user.role}
        />
      </section>
    </div>
  );
}
