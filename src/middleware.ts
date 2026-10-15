export { default } from 'next-auth/middleware';

export const config = {
  matcher: [
    /*
     * Proteger todas las rutas excepto:
     * - /auth/login (pagina de login)
     * - /api/auth/* (callbacks de NextAuth)
     * - /_next/* (recursos estaticos)
     * - /favicon.ico (icono)
     */
    '/((?!auth/login|api/auth|_next|favicon.ico).*)',
  ],
};
