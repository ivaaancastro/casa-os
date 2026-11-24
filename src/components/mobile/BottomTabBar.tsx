'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { TAB_ITEMS } from '@/components/navigation/nav-items';

/** Iconos lineales de 20 px. Se eligen por `href` para no añadir dependencias. */
const ICONS: Record<string, React.ReactNode> = {
  '/notas': (
    <>
      <path d="M5 4h11l3 3v13H5z" />
      <path d="M8 9h8M8 13h8M8 17h5" />
    </>
  ),
  '/cuentas': (
    <>
      <rect x="4" y="10" width="16" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </>
  ),
  '/calendario': (
    <>
      <rect x="4" y="5" width="16" height="15" rx="2" />
      <path d="M4 9h16M8 3v4M16 3v4" />
    </>
  ),
  '/perfil': (
    <>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20a7 7 0 0 1 14 0" />
    </>
  ),
};

/**
 * Barra inferior de cuatro pestañas para móvil/tablet.
 * El activo se marca con tinta y una línea superior de 2 px; sin badges de color.
 */
export function BottomTabBar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navegación principal"
      className="fixed inset-x-4 bottom-4 z-40 rounded-2xl border border-white/40 bg-white/60 px-2 py-1 shadow-lg backdrop-blur-2xl backdrop-saturate-150 lg:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <ul className="flex items-stretch">
        {TAB_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                className={`
                  relative flex min-h-11 flex-col items-center justify-center gap-1
                  px-1 pt-2 pb-1.5 text-[11px] transition-colors duration-200
                  ${isActive ? 'text-accent' : 'text-ash hover:text-ink'}
                `}
              >
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-4 top-0 h-0.5 bg-accent"
                  />
                )}
                <svg
                  aria-hidden="true"
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.6}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  viewBox="0 0 24 24"
                >
                  {ICONS[item.href]}
                </svg>
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
