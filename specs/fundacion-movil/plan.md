# Plan — Fase 1: Fundación móvil

## Contexto

casa-os ya funciona en producción (auth, notas, Cuentas zero-knowledge, calendario,
PWA), pero su interfaz heredó un layout de escritorio: `Sidebar` fijo con seis
secciones, botón de menú flotante en móvil y wordmark repetido en cada pantalla.
El roadmap móvil-first (Fase 1) exige convertirla en una app que se use con una
mano, sin perder las secciones existentes ni tocar su lógica.

La base visual ya está definida en `specs/rediseno-inditex/spec.md` y en
`specs/rediseno-inditex/referencias-premium.md` (Awwwards, 19 nov 2026). Esta
fase **materializa** esa base en navegación y contenedores; el rediseño profundo
de Cuentas y Notas llega en las Fases 2 y 3.

## Enfoque técnico

1. **Shell único.** Extraer el `div.flex` de `src/app/layout.tsx` a un
   `AppShell` que decida por breakpoint: `Sidebar` solo en `lg:` (escritorio) y
   `BottomTabBar` en móvil. La lógica de auth del middleware no cambia.
2. **Tab bar inferior.** Nuevo componente cliente
   `src/components/mobile/BottomTabBar.tsx` con cuatro destinos: Notas, Cuentas,
   Calendario, Perfil. Estado activo con `usePathname`; `h-11` mínimo por
   objetivo, `env(safe-area-inset-bottom)`, borde superior `mist`, sin badges
   de color. El icono es discreto; la etiqueta siempre visible.
3. **Menú «Más».** Las secciones que no caben en cuatro pestañas (Dashboard,
   Dispositivos, Familia) y Cerrar sesión viven en un drawer accesible desde
   Perfil, reutilizando el patrón del `Sidebar` actual pero sin duplicar su
   lógica: extraer `NAV_ITEMS` y `LogoutButton` a un módulo compartido.
4. **Wordmark único.** En móvil el wordmark Bodoni aparece solo en la pantalla
   de bienvenida/instalación; el resto de pantallas muestran el título de la
   sección en Jost 18/21 y metadatos en 13 px color `ash`.
5. **Bienvenida e instalación.** Componente
   `src/components/pwa/InstallPrompt.tsx`: escucha `beforeinstallprompt`, guarda
   el evento y muestra una tarjeta sobria con «Añadir a pantalla de inicio».
   Si el navegador no dispara el evento (iOS Safari), muestra la instrucción
   textual. El rechazo se guarda en `localStorage` para no repetirlo. No cambia
   `manifest.ts` ni el service worker.
6. **Tokens.** Usar los existentes en `tailwind.config.ts` (`canvas`, `ink`,
   `ash`, `mist`, `pearl`, `alarm`). La paleta `brand` sigue usándose como
   semántico de éxito en `src/components/cuentas/ui.tsx`: se conserva ahí y no
   se expone como acento de navegación. Sin sombras, radios 0.
7. **Pantallas.** Ajustar contenedores y cabeceras de `src/app/notas/page.tsx`,
   `src/app/cuentas/page.tsx`, `src/app/calendario/page.tsx` y
   `src/app/perfil/page.tsx` al nuevo shell. Sin tocar hooks, queries, ni
   formularios: solo clases y estructura semántica.

## Dependencias

- [x] `specs/rediseno-inditex/spec.md` (tokens ya aprobados)
- [x] `specs/rediseno-inditex/referencias-premium.md` (patrones Awwwards)
- [x] Tipografías Bodoni Moda + Jost ya cargadas en `src/app/layout.tsx`
- [x] Skill `design-audit` disponible en `.opencode/skills/design-audit/`
- [x] Aprobación de `specs/fundacion-movil/spec.md` (19 nov 2026): 4 pestañas,
  prompt una vez, test E2E con Playwright, sin `#C41E3A`

## Riesgos

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| Duplicar navegación al convivir sidebar, drawer y tab bar | Media | Alto | Un solo `AppShell` y un solo `NAV_ITEMS`; tab bar y drawer son exclusivos por breakpoint |
| La tab bar tape contenido o quede bajo el teclado | Media | Alto | `pb` en `main` + `safe-area-inset-bottom`; comprobar a 390×844 con Chrome MCP |
| Romper rutas autenticadas al mover el layout | Baja | Alto | No tocar middleware ni guards; smoke de `/notas`, `/cuentas`, `/calendario`, `/perfil` |
| El prompt de instalación moleste en escritorio | Media | Medio | Mostrar solo en móvil, una vez, con dismiss persistente |
| Regresión visual en Cuentas (pantalla más compleja) | Media | Medio | Cambiar solo el contenedor; auditoría con `design-audit` al final |
| Verificación en dispositivo real no disponible | Alta | Medio | Registrar como follow-up honesto; no presentar Chrome MCP como prueba en iOS/Android |

## Fuera de alcance

- Cambios en base de datos, APIs, auth, middleware o manifest.
- Rediseño funcional de Cuentas (Fase 2), Notas (Fase 3) o Calendario (Fase 4).
- Adaptación de `/devices` y `/familia` a móvil (Fase 5).
- Tema oscuro, animaciones de entrada coreografiadas y nuevas dependencias.
- Instalación real en dispositivos iOS/Android; se verifica en viewport móvil y
  se deja la prueba en dispositivo como follow-up documentado.

## Verificación

- `npm run lint && npm run typecheck && npm run test && npm run build`.
- Chrome MCP a 390×844: flujo Notas → Cuentas → Calendario → Perfil → drawer
  «Más», sin overflow horizontal y con foco visible.
- Auditoría con la skill `design-audit` sobre las capturas de esa sesión.
- CI del PR en verde y cierre documental posterior (Paso 8 de `AGENTS.md`).
