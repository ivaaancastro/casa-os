export default function DevicesPage() {
  return (
    <div className="mx-auto max-w-7xl px-5 py-10 md:px-10 md:py-12 lg:px-16 lg:py-16">
      <div className="grid animate-fade-rise grid-cols-12 gap-y-8">
        <header className="col-span-12 border-t border-mist pt-8">
          <p className="mb-4 text-xs tracking-wider2 text-ash">Casa · Dispositivos</p>
          <h1 className="font-display text-5xl leading-[0.9] tracking-editorial md:text-6xl">
            Dispositivos
          </h1>
          <p className="mt-4 max-w-xl text-sm text-ash">
            Gestión de dispositivos conectados a tu red.
          </p>
        </header>
        <section className="col-span-12 border-t border-mist pt-8">
          <div className="max-w-xl border border-ink p-6">
            <p className="text-sm text-ash">
              Sección en desarrollo. Próximamente podrás escanear y gestionar los
              dispositivos de tu red.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
