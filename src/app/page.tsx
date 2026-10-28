export default function Home() {
  const modules = [
    { title: 'Dashboard', status: 'En desarrollo', href: '/' },
    { title: 'Dispositivos', status: 'Disponible', href: '/devices' },
    { title: 'Notas', status: 'Disponible', href: '/notas' },
    { title: 'Calendario', status: 'Disponible', href: '/calendario' },
    { title: 'Familia', status: 'Disponible', href: '/familia' },
    { title: 'Cuentas', status: 'Planificado', href: '#' },
  ];

  return (
    <div className="mx-auto max-w-7xl px-5 py-10 md:px-10 md:py-12 lg:px-16 lg:py-16">
      <div className="grid animate-fade-rise grid-cols-12 gap-y-12">
        <header className="col-span-12 border-t border-mist pt-8">
          <p className="mb-6 text-xs tracking-wider2 text-ash">casa-os — hogar digital</p>
          <h1 className="font-display text-5xl leading-[0.9] tracking-editorial md:text-7xl">
            Tu hogar,<br /> en orden.
          </h1>
          <p className="mt-6 max-w-xl text-base text-ash">
            Gestiona dispositivos, notas familiares y más desde un solo lugar.
          </p>
        </header>

        <section className="col-span-12 mt-6">
          <div className="grid grid-cols-12 border-t border-mist">
            {modules.map((m, i) => (
              <a
                key={m.title}
                href={m.href}
                className="group col-span-12 border-b border-mist border-r-0 p-6 transition-colors hover:bg-ink hover:text-canvas md:col-span-4 md:border-r"
              >
                <div className="flex items-baseline justify-between">
                  <span className="text-[10px] text-ash group-hover:text-canvas/60">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="text-[10px] text-ash group-hover:text-canvas/60">{m.status}</span>
                </div>
                <h3 className="mt-8 font-display text-2xl tracking-editorial">{m.title}</h3>
              </a>
            ))}
          </div>
        </section>

        <section className="col-span-12 mt-4 border-t border-mist pt-8">
          <h2 className="mb-4 font-display text-2xl tracking-editorial">Primeros pasos</h2>
          <ol className="grid max-w-xl gap-2 text-sm text-ash">
            <li className="flex gap-4 border-b border-mist pb-2">
              <span className="text-ink">1</span> Configura `.env` con `cp .env.example .env`.
            </li>
            <li className="flex gap-4 border-b border-mist pb-2">
              <span className="text-ink">2</span> Prepara la base de datos con `docker compose up -d db &amp;&amp; npm run db:migrate:deploy &amp;&amp; npm run db:seed`.
            </li>
            <li className="flex gap-4 border-b border-mist pb-2">
              <span className="text-ink">3</span> Instala dependencias y arranca con `npm run dev`.
            </li>
          </ol>
        </section>
      </div>
    </div>
  );
}
