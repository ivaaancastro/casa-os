'use client';

import { useEffect, useLayoutEffect, useState } from 'react';

const QUERY = '(max-width: 1023px)';

/** En servidor se usa `useEffect`; en cliente, `useLayoutEffect` evita el flash
 * de la vista de escritorio antes de aplicar el breakpoint. */
const useIsomorphicLayoutEffect =
  typeof window === 'undefined' ? useEffect : useLayoutEffect;

/**
 * `true` cuando el viewport es móvil/tablet (< 1024px, `lg:` de Tailwind).
 * Fuente única de verdad para Notas, Calendario y el resto de vistas móviles:
 * montar un solo árbol por breakpoint evita ids duplicados y editores dobles.
 */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useIsomorphicLayoutEffect(() => {
    const mql = window.matchMedia(QUERY);
    const update = () => setIsMobile(mql.matches);
    update();
    mql.addEventListener('change', update);
    return () => mql.removeEventListener('change', update);
  }, []);

  return isMobile;
}
