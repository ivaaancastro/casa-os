export { default } from 'next-auth/middleware';

export const config = {
  matcher: [
    /*
     * Proteger todas las rutas excepto:
     * - /auth/login (pagina de login)
     * - /api/auth/* (callbacks de NextAuth)
     * - /api/health (estado publico, sin datos)
     * - /api/devices/import (la ruta devuelve 401/403 JSON en vez de redirigir)
     * - /api/events (la ruta devuelve 401 JSON en vez de redirigir)
     * - /offline (aviso sin conexion, sin datos)
     * - /sw.js y /manifest.webmanifest (PWA)
     * - /icons/* (iconos de la PWA)
     * - /_next/* (recursos estaticos)
     * - /favicon.ico (icono)
     */
    '/((?!auth/login|api/auth|api/health|api/devices/import(?:/|$)|api/events(?:/|$)|offline(?:/|$)|icons/|manifest.webmanifest|sw.js|_next|favicon.ico).*)',
  ],
};
