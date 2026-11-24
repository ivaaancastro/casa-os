type Props = {
  eyebrow: string;
  title: string;
  description?: string;
  /** Acciones de la cabecera (p. ej. el menú «Más» en Perfil). */
  action?: React.ReactNode;
};

/**
 * Cabecera de sección: en móvil título Jost 21 px y metadatos 13 px;
 * en escritorio se recupera el registro editorial Bodoni.
 */
export function PageHeader({ eyebrow, title, description, action }: Props) {
  return (
    <header className="col-span-12 border-t border-mist/60 pt-6 lg:pt-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="mb-3 text-[13px] tracking-wider2 text-ash">{eyebrow}</p>
          <h1 className="font-ui text-[22px] font-semibold leading-tight text-ink md:text-[34px] md:font-semibold md:tracking-editorial">
            {title}
          </h1>
        </div>
        {action}
      </div>
      {description && (
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-ash lg:mt-4">
          {description}
        </p>
      )}
    </header>
  );
}
