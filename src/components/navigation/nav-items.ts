/** Fuente única de verdad para la navegación de casa-os. */
export type NavItem = {
  href: string;
  label: string;
  /** Secciones que solo aparecen en el menú «Más» / sidebar de escritorio. */
  more?: boolean;
};

export const NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'Dashboard', more: true },
  { href: '/notas', label: 'Notas' },
  { href: '/cuentas', label: 'Contraseñas' },
  { href: '/calendario', label: 'Calendario' },
  { href: '/devices', label: 'Dispositivos', more: true },
  { href: '/familia', label: 'Familia', more: true },
  { href: '/perfil', label: 'Perfil' },
];

/** Las cuatro pestañas de la barra inferior, en orden de pulgar. */
export const TAB_ITEMS: NavItem[] = NAV_ITEMS.filter((item) => !item.more);

/** El resto de secciones, accesibles desde el menú «Más». */
export const MORE_ITEMS: NavItem[] = NAV_ITEMS.filter((item) => item.more);
