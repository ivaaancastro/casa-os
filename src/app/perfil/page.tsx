import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { publicUserSelect } from '@/lib/users';
import { ProfileForm } from '@/components/ProfileForm';
import { SecuritySection } from '@/components/SecuritySection';
import { AppPasskeySection } from '@/components/AppPasskeySection';
import { PageHeader } from '@/components/PageHeader';
import { MoreDrawer } from '@/components/mobile/MoreDrawer';

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
    <div className="mx-auto max-w-5xl px-5 py-8 md:px-8 md:py-10">
      <div className="grid animate-fade-rise grid-cols-12 gap-y-8">
        <PageHeader
          eyebrow="Casa · Perfil"
          title="Perfil"
          description="Tus datos, tu contraseña y la seguridad de tu cuenta."
          action={<MoreDrawer />}
        />

        <section className="col-span-12 border-t border-mist/60 pt-8">
          <ProfileForm
            user={{ name: user.name, email: user.email, role: user.role }}
          />
        </section>

        <section className="col-span-12 border-t border-mist/60 pt-8">
          <SecuritySection />
        </section>

        <section className="col-span-12 border-t border-mist/60 pt-8">
          <AppPasskeySection />
        </section>
      </div>
    </div>
  );
}
