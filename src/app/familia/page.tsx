import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { publicUserSelect } from '@/lib/users';
import { FamilyManager, type Member } from '@/components/family/FamilyManager';

export const dynamic = 'force-dynamic';

export default async function FamiliaPage() {
  const user = await getSessionUser();
  if (!user) redirect('/auth/login');

  const users = await prisma.user.findMany({
    select: publicUserSelect,
    orderBy: { createdAt: 'asc' },
  });

  const members: Member[] = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    active: u.active,
    createdAt: u.createdAt.toISOString(),
  }));

  return (
    <div className="mx-auto max-w-7xl px-5 py-10 md:px-10 md:py-12 lg:px-16 lg:py-16">
      <div className="grid animate-fade-rise grid-cols-12 gap-y-8">
        <header className="col-span-12 border-t border-mist pt-8">
          <p className="mb-4 text-xs tracking-wider2 text-ash">Casa · Familia</p>
          <h1 className="font-display text-5xl leading-[0.9] tracking-editorial md:text-6xl">
            Familia
          </h1>
          <p className="mt-4 max-w-xl text-sm text-ash">
            Miembros del hogar y sus permisos.
          </p>
        </header>

        <section className="col-span-12 border-t border-mist pt-8">
          <FamilyManager
            members={members}
            currentUserId={user.id}
            currentUserRole={user.role}
          />
        </section>
      </div>
    </div>
  );
}
