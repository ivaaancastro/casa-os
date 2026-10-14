export { default } from 'next-auth/middleware';

export const config = {
  matcher: ['/devices/:path*', '/notas/:path*', '/api/:path*'],
};
