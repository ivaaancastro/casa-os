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
    twoFactorEnabled: u.twoFactorEnabled,
    createdAt: u.createdAt.toISOString(),
  }));

  return (
    <div className="mx-auto max-w-5xl px-5 py-8 md:px-8 md:py-10">
      <div className="grid animate-fade-rise grid-cols-12 gap-y-8">
        <header className="col-span-12 border-t border-mist/60 pt-8">
          <p className="mb-4 text-xs tracking-wider2 text-ash">Casa · Familia</p>
          <h1 className="font-ui text-[28px] font-semibold leading-tight text-ink md:text-[34px]">
            Familia
          </h1>
          <p className="mt-4 max-w-xl text-sm text-ash">
            Miembros del hogar y sus permisos.
          </p>
        </header>

        <section className="col-span-12 border-t border-mist/60 pt-8">
          <FamilyManager
            members={members}
            currentUserId={user.id}
            currentUserRole={user.role}
            currentUserTwoFactorEnabled={
              users.find((member) => member.id === user.id)?.twoFactorEnabled ??
              false
            }
          />
        </section>
      </div>
    </div>
  );
}
