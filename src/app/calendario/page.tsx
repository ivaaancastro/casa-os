import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { CalendarApp } from '@/components/calendar/CalendarApp';
import { PageHeader } from '@/components/PageHeader';

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
        <PageHeader
          eyebrow="Casa · Calendario"
          title="Calendario"
          description="La vida de la casa, día a día. Crea planes, marca quién se encarga y recibe un aviso cuando toque."
        />

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
