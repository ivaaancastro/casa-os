# Plan — Rediseño visual inspirado en Inditex (Zara)

## Contexto
Tras estabilizar la app (notas + API), el siguiente objetivo es remodelar toda la interfaz
para que tenga una identidad distinta: minimalismo editorial inspirado en Inditex/Zara,
que transmita calma, curación y rapidez sin caer en plantillas genéricas.

## Enfoque técnico
- Trabajar en la rama `feat/rediseno-inditex` (única activa).
- Crear un sistema de tokens en Tailwind (colores, tipografía, espaciado, radios, sombras)
  y aplicarlo a los componentes existentes.
- Sustituir la tipografía actual por serif editorial (titulares) + sans neutra (UI).
- Rehacer layout (grid editorial, márgenes, sidebar) y componentes principales:
  sidebar, listado, editor, dashboard, dispositivos y auth.
- Aplicar animación de carga una sola vez; evitar efectos dispersos y hovers genéricos.
- Mantener responsive (mobile-first, drawer en móvil) y accesibilidad (foco, reduced-motion).

## Dependencias
- Frontend Design skill instalada en `.agents/skills/frontend-design`.
- Google Fonts (Bodoni Moda / Jost) — añadir al layout root.
- Tailwind config: tokens y family.

## Riesgos
- Duplicar estilos si se hace por archivo en lugar de tokens.
- Romper tests visuales/estilos. Los tests unitarios deben seguir pasando.
- Posible inestabilidad en dev por caching (recomendado limpiar `.next`).

## Criterios de aceptación
- Aplicación visualmente coherente con la identidad propuesta.
- Todas las verificaciones (`lint && typecheck && test && build`) pasan.
- No hay regresiones de funcionalidad (notas, auth, API).

