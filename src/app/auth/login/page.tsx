import { Suspense } from 'react';
import { LoginForm } from '@/components/LoginForm';

function LoginPageContent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-6 py-16">
      <div className="w-full max-w-md">
        <div className="mb-8">
          <h1 className="font-ui text-[40px] font-semibold leading-tight tracking-editorial text-ink">
            casa<span className="text-ash">·</span>os
          </h1>
          <p className="mt-2 text-[15px] text-ash">Tu hogar digital</p>
        </div>

        <div className="rounded-2xl bg-surface p-6 shadow-sm">
          <h2 className="mb-6 text-[20px] font-semibold text-ink">
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
