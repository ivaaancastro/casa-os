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
     * - /api/2fa (requireUser; 401/403 JSON)
     * - /api/users (requireUser/requireAdmin; 401/403 JSON)
     * - /api/push (requireUser en cada handler; 401 JSON)
     * - /api/reminders (requireUser o CRON_SECRET; 401 JSON)
     * - /offline (aviso sin conexion, sin datos)
     * - /sw.js y /manifest.webmanifest (PWA)
     * - /icons/* (iconos de la PWA)
     * - /_next/* (recursos estaticos)
     * - /favicon.ico (icono)
     */
    '/((?!auth/login|api/auth|api/health|api/devices/import(?:/|$)|api/events(?:/|$)|api/2fa(?:/|$)|api/users(?:/|$)|api/push(?:/|$)|api/reminders(?:/|$)|offline(?:/|$)|icons/|manifest.webmanifest|sw.js|_next|favicon.ico).*)',
  ],
};
