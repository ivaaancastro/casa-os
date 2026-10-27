import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { publicUserSelect } from '@/lib/users';
import { ProfileForm } from '@/components/ProfileForm';
import { SecuritySection } from '@/components/SecuritySection';

export const dynamic = 'force-dynamic';

export default async function PerfilPage() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) redirect('/auth/login');

  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: publicUserSelect,
  });

  if (!user) redirect('/auth/login');

  return (
    <div className="mx-auto max-w-7xl px-5 py-10 md:px-10 md:py-12 lg:px-16 lg:py-16">
      <div className="grid animate-fade-rise grid-cols-12 gap-y-8">
        <header className="col-span-12 border-t border-mist pt-8">
          <p className="mb-4 text-xs tracking-wider2 text-ash">Casa · Perfil</p>
          <h1 className="font-display text-5xl leading-[0.9] tracking-editorial md:text-6xl">
            Perfil
          </h1>
          <p className="mt-4 max-w-xl text-sm text-ash">
            Tus datos, tu contraseña y la seguridad de tu cuenta.
          </p>
        </header>

        <section className="col-span-12 border-t border-mist pt-8">
          <ProfileForm
            user={{ name: user.name, email: user.email, role: user.role }}
          />
        </section>

        <section className="col-span-12 border-t border-mist pt-8">
          <SecuritySection />
        </section>
      </div>
    </div>
  );
}
