'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { MORE_ITEMS } from '@/components/navigation/nav-items';
import { LogoutButton } from '@/components/LogoutButton';

type Props = {
  /** Contenido del botón que abre el menú (se coloca en la cabecera de Perfil). */
  trigger?: React.ReactNode;
};

/**
 * Drawer con las secciones que no caben en la tab bar.
 * Se renderiza con portal a document.body para que `fixed` no dependa de
 * ancestros transformados (ver lección en MEMORY.md).
 */
export function MoreDrawer({ trigger = 'Más' }: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-expanded={open}
        aria-controls="more-drawer"
        className="flex min-h-11 items-center border border-mist/60 px-4 text-xs text-ink transition-colors hover:border-ink"
      >
        {trigger}
      </button>

      {mounted &&
        open &&
        createPortal(
          <div
            id="more-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Más secciones"
            className="fixed inset-0 z-50 lg:hidden"
          >
            <div
              className="absolute inset-0 bg-ink/40"
              onClick={() => setOpen(false)}
              aria-hidden="true"
            />
            <div className="absolute inset-x-0 bottom-0 border-t border-mist/60 bg-canvas px-6 pt-5 pb-8">
              <div className="mb-4 flex items-center justify-between">
                <span className="font-display text-2xl leading-none tracking-editorial">
                  casa<span className="text-ash">·</span>os
                </span>
                <button
                  ref={closeRef}
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Cerrar menú"
                  className="flex h-11 w-11 items-center justify-center text-ink"
                >
                  <svg
                    aria-hidden="true"
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.5}
                    viewBox="0 0 24 24"
                  >
                    <path d="M6 6l12 12M18 6L6 18" />
                  </svg>
                </button>
              </div>
              <nav className="space-y-px border-t border-mist/60 pt-4">
                {MORE_ITEMS.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={pathname === item.href ? 'page' : undefined}
                    onClick={() => setOpen(false)}
                    className={`flex min-h-11 items-center px-3 text-sm ${
                      pathname === item.href ? 'bg-accent text-white' : 'text-ink'
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
              <div className="mt-4 border-t border-mist/60 pt-4">
                <LogoutButton />
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
