'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { BottomSheet } from './BottomSheet';

interface DeviceActionSheetProps {
  onCreate: () => void;
  onImportScan: () => void;
}

/** FAB portalado a body (el wrapper de la página tiene `animate-fade-rise`, que
 * ancla cualquier fixed al div) y hoja con las dos acciones de ADMIN. */
export function DeviceActionSheet({ onCreate, onImportScan }: DeviceActionSheetProps) {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      {mounted &&
        createPortal(
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Añadir dispositivo"
            title="Añadir dispositivo"
            className="fixed right-4 z-30 flex h-14 w-14 items-center justify-center bg-accent text-white transition-colors active:bg-black"
            style={{ bottom: 'calc(4.5rem + env(safe-area-inset-bottom))' }}
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="square" strokeWidth={1.5} d="M12 5v14M5 12h14" />
            </svg>
          </button>,
          document.body,
        )}

      {open && (
        <BottomSheet
          eyebrow="Dispositivos"
          title="Añadir o importar"
          onClose={() => setOpen(false)}
        >
          <div className="space-y-3">
            <button
              type="button"
              className="btn-primary min-h-11 w-full justify-start"
              onClick={() => {
                setOpen(false);
                onCreate();
              }}
            >
              Añadir dispositivo
            </button>
            <button
              type="button"
              className="btn-secondary min-h-11 w-full justify-start"
              onClick={() => {
                setOpen(false);
                onImportScan();
              }}
            >
              Importar escaneo
            </button>
          </div>
        </BottomSheet>
      )}
    </>
  );
}
