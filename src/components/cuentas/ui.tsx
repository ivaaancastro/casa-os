'use client';

import { useEffect, type ReactNode } from 'react';

export function Alert({
  tone = 'error',
  children,
}: {
  tone?: 'error' | 'info' | 'success' | 'warning';
  children: ReactNode;
}) {
  const styles = {
    error: 'border-alarm/40 bg-alarm/5 text-alarm',
    info: 'border-mist bg-pearl text-ash',
    success: 'border-brand-600/30 bg-brand-50 text-brand-800',
    warning: 'border-ink/20 bg-pearl text-ink',
  }[tone];

  return (
    <div className={`border px-3 py-2 text-sm ${styles}`} role={tone === 'error' ? 'alert' : 'status'}>
      {children}
    </div>
  );
}

export function Field({
  label,
  hint,
  htmlFor,
  children,
}: {
  label: string;
  hint?: string;
  htmlFor?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-xs tracking-wider2 text-ash">
        {label}
      </label>
      {children}
      {hint ? <p className="text-xs text-ash">{hint}</p> : null}
    </div>
  );
}

export function Button({
  children,
  variant = 'primary',
  className = '',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost' | 'danger';
}) {
  const styles = {
    primary: 'bg-ink text-canvas hover:bg-ash',
    ghost: 'border border-mist bg-canvas text-ink hover:border-ink',
    danger: 'border border-alarm bg-canvas text-alarm hover:bg-alarm hover:text-canvas',
  }[variant];

  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${styles} ${className}`}
    >
      {children}
    </button>
  );
}

export function Modal({
  title,
  subtitle,
  onClose,
  children,
  wide = false,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKeyDown);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previous;
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-0 sm:items-center sm:p-6">
      <div
        className="absolute inset-0"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`relative z-10 max-h-[92vh] w-full overflow-y-auto bg-canvas p-6 sm:max-h-[88vh] sm:p-8 ${
          wide ? 'sm:max-w-3xl' : 'sm:max-w-xl'
        }`}
      >
        <div className="mb-6 flex items-start justify-between gap-4 border-t border-mist pt-5">
          <div>
            <p className="text-xs tracking-wider2 text-ash">Cuentas</p>
            <h2 className="mt-2 font-display text-2xl tracking-editorial">{title}</h2>
            {subtitle ? <p className="mt-2 max-w-prose text-sm text-ash">{subtitle}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center border border-mist text-ash transition-colors hover:border-ink hover:text-ink"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Spinner({ label = 'Cargando' }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 text-sm text-ash" role="status">
      <span className="inline-block h-3 w-3 animate-spin border border-ash border-t-transparent" />
      {label}
    </div>
  );
}
