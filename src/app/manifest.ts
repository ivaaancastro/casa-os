import type { MetadataRoute } from 'next';

/**
 * Manifest de la PWA.
 *
 * Next.js lo sirve en /manifest.webmanifest y lo enlaza automáticamente
 * desde el layout. `display: standalone` permite abrirla sin barra del
 * navegador cuando se instala en el móvil.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'casa·os — Tu hogar digital',
    short_name: 'casa·os',
    description: 'Gestión de dispositivos, notas familiares y más',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait-primary',
    background_color: '#FFFFFF',
    theme_color: '#FFFFFF',
    lang: 'es',
    dir: 'ltr',
    categories: ['productivity', 'utilities'],
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
