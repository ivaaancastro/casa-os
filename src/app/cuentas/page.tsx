import type { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { VaultApp } from '@/components/cuentas/VaultApp';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Cuentas | casa-os',
  description: 'Bóveda zero-knowledge para las cuentas del hogar',
};

export default async function CuentasPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/auth/login');
  }

  return (
    <VaultApp
      userId={session.user.id}
      email={session.user.email ?? ''}
    />
  );
}
