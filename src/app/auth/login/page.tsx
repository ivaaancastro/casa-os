import { Suspense } from 'react';
import { LoginForm } from '@/components/LoginForm';

function LoginPageContent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-6 py-16">
      <div className="w-full max-w-md">
        <div className="mb-12 border-t border-mist pt-8">
          <h1 className="font-display text-6xl leading-[0.9] tracking-editorial">
            casa<span className="text-ash">·</span>os
          </h1>
          <p className="mt-3 text-sm text-ash">Tu hogar digital</p>
        </div>

        <div className="w-full">
          <h2 className="mb-6 font-display text-2xl tracking-editorial">
            Iniciar sesión
          </h2>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-canvas"><p className="text-ash text-sm">Cargando...</p></div>}>
      <LoginPageContent />
    </Suspense>
  );
}
