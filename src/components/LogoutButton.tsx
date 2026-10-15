'use client';

import { signOut } from 'next-auth/react';

export function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: '/auth/login' })}
      className="w-full text-left text-xs text-ash transition-colors hover:text-alarm"
    >
      Cerrar sesión
    </button>
  );
}
