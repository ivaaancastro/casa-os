import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { CalendarApp } from '@/components/calendar/CalendarApp';

export const dynamic = 'force-dynamic';

export default async function CalendarioPage() {
  const user = await getSessionUser();
  if (!user) redirect('/auth/login');

  const members = await prisma.user.findMany({
    where: { active: true },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });

  return (
    <div className="mx-auto max-w-7xl px-5 py-10 md:px-10 md:py-12 lg:px-16 lg:py-16">
      <div className="grid animate-fade-rise grid-cols-12 gap-y-8">
        <header className="col-span-12 border-t border-mist pt-8">
          <p className="mb-4 text-xs tracking-wider2 text-ash">
            Casa · Calendario
          </p>
          <h1 className="font-display text-5xl leading-[0.9] tracking-editorial md:text-6xl">
            Calendario
          </h1>
          <p className="mt-4 max-w-xl text-sm text-ash">
            La vida de la casa, día a día. Crea planes, marca quién se encarga y
            recibe un aviso cuando toque.
          </p>
        </header>

        <section className="col-span-12 border-t border-mist pt-8">
          <CalendarApp
            members={members}
            currentUser={{ id: user.id, role: user.role }}
          />
        </section>
      </div>
    </div>
  );
}
