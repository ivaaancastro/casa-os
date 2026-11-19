# Spec — Fase 1: Fundación móvil

## Objetivo

Dar a casa-os una navegación móvil de una mano y una identidad visual coherente
con el sistema editorial ya aprobado: tab bar inferior con cuatro pestañas, menú
«Más» para el resto de secciones, pantalla de instalación PWA y wordmark único.
Sin cambiar lógica de negocio, datos ni autenticación.

## Requisitos funcionales

1. **RF1 — Tab bar inferior (móvil).** Cuatro pestañas fijas: Notas, Cuentas,
   Calendario y Perfil. La pestaña activa se marca con `ink` y una línea superior
   de 2 px; las inactivas en `ash`. Toca cambiar de ruta y cerrar el drawer.
2. **RF2 — Menú «Más».** Desde Perfil (o un ítem explícito de la barra si se
   decide así en tasks) se abre un drawer con Dashboard, Dispositivos, Familia y
   Cerrar sesión. Comparte la lista de navegación con el sidebar de escritorio:
   no puede haber dos fuentes de verdad.
3. **RF3 — Sidebar de escritorio.** Se mantiene en `lg:` con el mismo aspecto
   actual (wordmark Bodoni + lista). Desaparece por completo en móvil.
4. **RF4 — Wordmark único.** En móvil, «casa·os» en Bodoni solo aparece en la
   pantalla de bienvenida/instalación. El resto de cabeceras usan título Jost
   18/21 y metadatos 13 px `ash`. En escritorio se conserva en el sidebar.
5. **RF5 — Prompt de instalación.** Si el navegador dispara
   `beforeinstallprompt`, mostrar una tarjeta sobria con «Añadir a pantalla de
   inicio». Si no dispara (iOS Safari), mostrar la instrucción textual. Si el
   usuario rechaza, no volver a mostrarlo (`localStorage`). Solo en móvil.
6. **RF6 — Contenedores de pantalla.** `/notas`, `/cuentas`, `/calendario` y
   `/perfil` respetan el area de la tab bar (padding inferior) y la zona segura
   del dispositivo. Sin overflow horizontal a 390 px.
7. **RF7 — Accesibilidad.** Objetivos táctiles ≥ 44 px, foco visible de 2 px,
   `aria-current="page"` en la pestaña activa, `aria-label` en iconos, orden de
   lectura coherente y `prefers-reduced-motion` respetado.

## Requisitos no funcionales

- **Rendimiento**: sin dependencias nuevas; el shell no añade más JS del
  existente (los componentes ya son cliente en su mayoría). Primera carga < 300 kB
  de JS compartido.
- **Seguridad**: sin cambios en middleware, guards ni sesión. El drawer de
  «Más» usa los mismos `Link` y `LogoutButton` actuales.
- **UX**: mobile-first, una mano, sin badges de color en la navegación, sin
  sombras, radios 0.
- **Consistencia**: los tokens viven en `tailwind.config.ts`; no se añaden
  clases de color literales en componentes. El `brand` actual queda relegado a
  su uso semántico en Cuentas (`ui.tsx`).

## API / Endpoints

Ninguno. Esta feature no añade ni modifica rutas de API.

## Modelo de datos

Ninguno. Sin migraciones ni cambios en `prisma/schema.prisma`.

## UI / UX

### Arquitectura del shell

```
RootLayout
└── AppShell                 ← decide por breakpoint (CSS, no JS)
    ├── Sidebar (lg:)        ← wordmark + NAV_ITEMS + LogoutButton
    ├── main                 ← padding inferior en móvil para la tab bar
    │   └── {children}
    ├── BottomTabBar (md:)   ← Notas / Cuentas / Calendario / Perfil
    └── InstallPrompt        ← tarjeta PWA, solo móvil, dismissible
```

### Tab bar

- Fija abajo, alto ≥ 44 px + `env(safe-area-inset-bottom)`, borde superior 1 px
  `mist`, fondo `canvas`.
- Icono lineal 20 px + etiqueta 11–12 px; activo `ink`, inactivo `ash`.
- Sin notificaciones rojas ni puntos de color: el estado se comunica con texto.

### Flujo de bienvenida

1. Primera visita en móvil sin PWA instalada → tarjeta sobria con el wordmark
   Bodoni, una frase corta y «Añadir a pantalla de inicio».
2. iOS Safari (sin `beforeinstallprompt`) → instrucción textual: compartir →
   «Añadir a pantalla de inicio».
3. Rechazo o instalación → no se vuelve a mostrar.

### Paleta y tipografía

- `canvas #FFFFFF`, `ink #0A0A0A`, `ash #6B6B6B`, `mist #E4E4E4`,
  `pearl #F5F5F5`, `alarm #8E2222` solo para error/eliminación.
- Bodoni Moda: wordmark (solo en bienvenida y sidebar). Jost: todo lo demás.
- **Decisión de paleta**: se descarta `#C41E3A` del roadmap como acento de
  navegación; el rojo sigue siendo estado (`#8E2222`). Confirmada por el usuario
  al aprobar esta spec.

### Pantallas afectadas

- `src/app/layout.tsx`: sustituir el `div.flex` por `AppShell`.
- `src/components/Sidebar.tsx`: extraer `NAV_ITEMS`, mostrar solo en `lg:`.
- `src/components/mobile/BottomTabBar.tsx` (nuevo).
- `src/components/mobile/MoreDrawer.tsx` (nuevo o reutilización del sidebar).
- `src/components/pwa/InstallPrompt.tsx` (nuevo).
- `src/app/notas/page.tsx`, `src/app/cuentas/page.tsx`,
  `src/app/calendario/page.tsx`, `src/app/perfil/page.tsx`: contenedores y
  cabeceras únicamente.

## Criterios de aceptación

- [x] La tab bar aparece solo en móvil/tablet con las cuatro pestañas y el
      activo marcado; no aparece en `lg:` (E2E + capturas 3–6).
- [x] El sidebar desaparece en móvil y sigue igual en escritorio (CSS `lg:` y
      comprobación de estilos computados).
- [x] El menú «Más» da acceso a Dashboard, Dispositivos, Familia y Cerrar sesión
      (E2E y captura 7).
- [x] El wordmark Bodoni aparece una sola vez por pantalla en móvil (capturas 1 y 7).
- [x] El prompt de instalación aparece una vez en móvil y respeta el rechazo
      (`localStorage`; verificado en local, ver límites en `auditoria.md`).
- [x] A 390×844 no hay overflow horizontal y la tab bar no tapa contenido
      (E2E en las cuatro rutas).
- [x] `aria-current` y objetivos ≥ 44 px verificados con Chrome MCP y E2E; el
      foco visible se comprueba por CSS global (prueba con teclado queda como
      follow-up).
- [x] Sin cambios en API, BD, auth ni middleware. Única dependencia nueva:
      `@playwright/test` para E2E, aprobada en la spec.
- [x] `npm run lint && npm run typecheck && npm run test && npm run build` pasan.
- [x] Auditoría con la skill `design-audit` en `specs/fundacion-movil/auditoria.md`.
- [x] CI del PR #45 en verde y cierre documental completado.

## Decisiones aprobadas (2026-11-19)

1. **Cuatro pestañas** (Notas, Cuentas, Calendario, Perfil). Dashboard,
   Dispositivos y Familia van al menú «Más».
2. El prompt de instalación se muestra **una vez por dispositivo** y solo en móvil.
3. Se usa `@playwright/test` para un **test E2E de la navegación** (pestañas,
   drawer, breakpoint y 390 px). Queda como devDependency del proyecto.
4. Se descarta `#C41E3A` como acento: el rojo es solo estado (`#8E2222`).
