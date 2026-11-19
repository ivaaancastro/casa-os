'use client';

import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import { BottomTabBar } from '@/components/mobile/BottomTabBar';
import { InstallPrompt } from '@/components/pwa/InstallPrompt';

/**
 * Shell de la app: sidebar en escritorio, tab bar inferior en móvil/tablet.
 * Las rutas de auth no llevan navegación de la app (tienen su propio wordmark).
 * La navegación «Más» se coloca en la cabecera de Perfil (ver MoreDrawer).
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuth = pathname.startsWith('/auth/');

  if (isAuth) return <main className="min-h-screen bg-canvas">{children}</main>;

  return (
    <div className="flex min-h-screen bg-canvas">
      <Sidebar />
      <main className="min-w-0 flex-1 pb-24 lg:pb-0">
        <InstallPrompt />
        {children}
      </main>
      <BottomTabBar />
    </div>
  );
}
