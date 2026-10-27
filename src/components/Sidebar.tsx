'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { LogoutButton } from './LogoutButton';

const navItems = [
  { href: '/', label: 'Dashboard' },
  { href: '/devices', label: 'Dispositivos' },
  { href: '/notas', label: 'Notas' },
  { href: '/calendario', label: 'Calendario' },
  { href: '/familia', label: 'Familia' },
  { href: '/contrasenas', label: 'Contraseñas' },
];

export function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-5 left-5 z-50 flex h-10 w-10 items-center justify-center bg-canvas border border-mist text-ink transition-colors hover:bg-ink hover:text-canvas"
        aria-label="Abrir menú"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={1.5} d="M4 8h16M4 12h16M4 16h16" />
        </svg>
      </button>

      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-white/80 backdrop-blur-[2px]"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 z-50 h-full w-72 bg-canvas border-r border-mist
          transition-transform duration-300 ease-edit
          lg:translate-x-0 lg:static lg:z-auto
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
        style={{ transitionProperty: 'transform' }}
      >
        <div className="flex h-full flex-col px-6 py-8 lg:py-10">
          <Link
            href="/"
            onClick={() => setMobileOpen(false)}
            className="mb-10 text-3xl font-display leading-none tracking-editorial"
          >
            casa<span className="text-ash">·</span>os
          </Link>

          <div className="flex-1">
            <div className="mb-3 border-t border-mist pt-4">
              <p className="text-[10px] tracking-wider2 text-ash">Secciones</p>
            </div>
            <nav className="space-y-px">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`
                      group flex items-center justify-between border border-transparent px-3 py-3 text-sm transition-colors duration-200
                      ${isActive
                        ? 'bg-ink text-canvas'
                        : 'text-ink hover:border-ink'
                      }
                    `}
                  >
                    <span>{item.label}</span>
                    <span className="text-xs text-ash group-hover:text-ink" aria-hidden="true">/</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="space-y-3 border-t border-mist pt-4">
            <Link
              href="/perfil"
              onClick={() => setMobileOpen(false)}
              className="block text-xs text-ash transition-colors hover:text-ink"
            >
              Perfil
            </Link>
            <LogoutButton />
          </div>
        </div>
      </aside>
    </>
  );
}
