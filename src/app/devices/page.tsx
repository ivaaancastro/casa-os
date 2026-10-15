export default function DevicesPage() {
  return (
    <div className="grid grid-cols-12 gap-y-8">
      <header className="col-span-12 border-t border-mist pt-8">
        <p className="text-xs text-ash tracking-wider2 mb-4">Casa · Dispositivos</p>
        <h1 className="font-display text-5xl md:text-6xl tracking-editorial leading-[0.9]">
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
  );
}
