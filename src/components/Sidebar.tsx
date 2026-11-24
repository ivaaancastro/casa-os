'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NAV_ITEMS } from '@/components/navigation/nav-items';
import { LogoutButton } from './LogoutButton';

/** Sidebar de escritorio. En móvil lo sustituyen la tab bar y el menú «Más». */
export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-screen w-72 border-r border-mist/60 bg-surface/80 backdrop-blur-xl lg:block">
      <div className="flex h-full flex-col px-6 py-10">
        <Link
          href="/"
          className="mb-10 text-3xl font-display font-semibold leading-none tracking-editorial"
        >
          casa<span className="text-ash">·</span>os
        </Link>

        <div className="flex-1">
          <div className="mb-3 border-t border-mist/60 pt-4">
            <p className="text-[10px] tracking-wider2 text-ash">Secciones</p>
          </div>
          <nav className="space-y-px">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? 'page' : undefined}
                  className={`
                    group flex items-center justify-between rounded-lg px-3 py-3 text-sm transition-colors duration-200
                    ${isActive ? 'bg-accent text-white' : 'text-ink hover:bg-canvas'}
                  `}
                >
                  <span>{item.label}</span>
                  <span
                    className="text-xs text-ash group-hover:text-ink"
                    aria-hidden="true"
                  >
                    /
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="border-t border-mist/60 pt-4">
          <LogoutButton />
        </div>
      </div>
    </aside>
  );
}
