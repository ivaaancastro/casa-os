export { default } from 'next-auth/middleware';

export const config = {
  matcher: [
    /*
     * Proteger todas las rutas excepto:
     * - /auth/login (pagina de login)
     * - /api/auth/* (callbacks de NextAuth)
     * - /api/health (estado publico, sin datos)
     * - /_next/* (recursos estaticos)
     * - /favicon.ico (icono)
     */
    '/((?!auth/login|api/auth|api/health|_next|favicon.ico).*)',
  ],
};
