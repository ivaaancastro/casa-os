'use client';

import { useEffect, useState } from 'react';

type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

const STORAGE_KEY = 'casa-os-install-dismissed';

/**
 * Aviso de instalación PWA, solo en móvil y una vez por dispositivo.
 * Se renderiza en el flujo (no flotante) para no tapar contenido ni repetir
 * el wordmark: la identidad vive en la cabecera de cada pantalla.
 * iOS Safari no dispara `beforeinstallprompt`: se muestra la instrucción textual.
 */
export function InstallPrompt() {
  const [event, setEvent] = useState<InstallEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY) === '1') return;
    if (window.matchMedia('(display-mode: standalone)').matches) return;

    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);
    if (iOS) {
      setVisible(true);
      return;
    }

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setEvent(e as InstallEvent);
      setVisible(true);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, '1');
    setVisible(false);
  };

  const install = async () => {
    if (!event) return;
    await event.prompt();
    await event.userChoice;
    dismiss();
  };

  if (!visible) return null;

  return (
    <section
      aria-label="Instalar casa-os"
      className="mx-5 mb-6 border-t border-mist/60 pt-3 lg:hidden"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13px] leading-snug text-ink">
          Instalar casa·os en la pantalla de inicio
        </p>
        <button
          type="button"
          onClick={dismiss}
          className="min-h-11 shrink-0 text-xs text-ash underline"
        >
          Ahora no
        </button>
      </div>
      {isIOS ? (
        <p className="mt-1 text-xs text-ash">
          En Safari: Compartir → «Añadir a pantalla de inicio».
        </p>
      ) : (
        <button
          type="button"
          onClick={install}
          className="mt-1 min-h-11 text-sm text-ink underline"
        >
          Añadir a pantalla de inicio
        </button>
      )}
    </section>
  );
}
