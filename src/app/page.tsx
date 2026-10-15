export default function Home() {
  const modules = [
    { title: 'Dashboard', status: 'En desarrollo' },
    { title: 'Dispositivos', status: 'En desarrollo' },
    { title: 'Notas', status: 'Disponible' },
    { title: 'Calendario', status: 'Planificado' },
    { title: 'Inventario', status: 'Planificado' },
    { title: 'Gastos', status: 'Idea' },
  ];

  return (
    <div className="grid grid-cols-12 gap-y-12">
      <header className="col-span-12 border-t border-mist pt-8">
        <p className="text-xs text-ash tracking-wider2 mb-6">casa-os — hogar digital</p>
        <h1 className="font-display text-5xl md:text-7xl tracking-editorial leading-[0.9]">
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
              href={m.title === 'Dashboard' ? '/' : m.title === 'Dispositivos' ? '/devices' : m.title === 'Notas' ? '/notas' : '#'}
              className="group col-span-12 md:col-span-4 border-b border-r-0 md:border-r border-mist p-6 transition-colors hover:bg-ink hover:text-canvas"
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
        <h2 className="font-display text-2xl tracking-editorial mb-4">Primeros pasos</h2>
        <ol className="grid gap-2 text-sm text-ash max-w-xl">
          <li className="flex gap-4 border-b border-mist pb-2">
            <span className="text-ink">1</span> Configura `.env` con `cp .env.example .env`.
          </li>
          <li className="flex gap-4 border-b border-mist pb-2">
            <span className="text-ink">2</span> Inicializa la base de datos con `npm run db:push && npm run db:seed`.
          </li>
          <li className="flex gap-4 border-b border-mist pb-2">
            <span className="text-ink">3</span> Instala dependencias y arranca con `npm run dev`.
          </li>
        </ol>
      </section>
    </div>
  );
}
