export default function Home() {
  const modules = [
    { title: 'Dispositivos', status: 'Disponible', href: '/devices' },
    { title: 'Notas', status: 'Disponible', href: '/notas' },
    { title: 'Calendario', status: 'Disponible', href: '/calendario' },
    { title: 'Familia', status: 'Disponible', href: '/familia' },
    { title: 'Cuentas', status: 'Disponible', href: '/cuentas' },
  ];

  return (
    <div className="mx-auto max-w-5xl px-5 py-6 md:px-8 md:py-12">
      <div className="grid animate-fade-rise grid-cols-1 gap-8">
        <header className="border-b border-mist/60 pb-8">
          <p className="mb-3 text-[13px] tracking-wide text-ash">Tu hogar digital</p>
          <h1 className="font-ui text-[28px] font-semibold leading-tight text-ink md:text-[44px]">
            Tu hogar,<br /> en orden.
          </h1>
          <p className="mt-4 max-w-xl text-base text-ash">
            Gestiona dispositivos, notas familiares y más desde un solo lugar.
          </p>
        </header>

        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map((m, i) => (
            <a
              key={m.title}
              href={m.href}
              className="group rounded-2xl bg-surface p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex items-baseline justify-between">
                <span className="text-[11px] font-medium text-ash">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="text-[11px] text-ash">{m.status}</span>
              </div>
              <h2 className="mt-6 text-[17px] font-semibold text-ink">{m.title}</h2>
            </a>
          ))}
        </section>

        <section className="rounded-2xl bg-surface p-6 shadow-sm">
          <h2 className="mb-4 text-[17px] font-semibold text-ink">Primeros pasos</h2>
          <ol className="grid gap-3 text-sm text-ash">
            <li className="flex gap-3">
              <span className="font-semibold text-accent">1</span> Crea tu primera nota en Notas.
            </li>
            <li className="flex gap-3">
              <span className="font-semibold text-accent">2</span> Añade o importa tus dispositivos.
            </li>
            <li className="flex gap-3">
              <span className="font-semibold text-accent">3</span> Invita a tu familia desde Familia.
            </li>
          </ol>
        </section>
      </div>
    </div>
  );
}
