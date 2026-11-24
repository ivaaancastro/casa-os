'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface BottomSheetProps {
  eyebrow?: string;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

/** Hoja inferior para móvil: portal a body, scrim, Escape, foco y safe-area.
 * Se usa tanto para el formulario como para el panel de importación. */
export function BottomSheet({ eyebrow, title, onClose, children }: BottomSheetProps) {
  const [mounted, setMounted] = useState(false);
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-end justify-center">
      <button
        type="button"
        aria-label="Cerrar panel"
        className="absolute inset-0 cursor-default bg-ink/20 backdrop-blur-[2px] animate-scrim-in"
        onClick={onClose}
      />

      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        data-mobile-panel=""
        className="relative flex max-h-[92dvh] w-full max-w-none flex-col overflow-y-auto border-t border-mist/60 bg-canvas px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4 shadow-none animate-sheet-in"
      >
        <header className="flex items-start justify-between gap-4 border-b border-mist/60 pb-4">
          <div>
            {eyebrow && (
              <p className="text-[10px] tracking-wider2 text-ash">{eyebrow}</p>
            )}
            <h2
              id={titleId}
              className="mt-1 font-ui text-[21px] font-medium leading-none text-ink"
            >
              {title}
            </h2>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="flex h-11 w-11 shrink-0 items-center justify-center border border-mist/60 text-lg text-ash transition-colors hover:border-ink hover:text-ink active:bg-pearl"
          >
            ×
          </button>
        </header>

        <div className="mt-5">{children}</div>
      </section>
    </div>,
    document.body,
  );
}
