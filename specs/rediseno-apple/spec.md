# Spec — Rediseño visual: Inditex → Apple

> **Estado:** borrador — pendiente de aprobación del usuario.

## Objetivo

Migrar la identidad visual de casa-os del estilo editorial Inditex/Zara al estilo
Apple (HIG): claridad, deferencia y profundidad, con tipografía del sistema,
esquinas redondeadas, materiales translúcidos, sombras sutiles y dark mode
preparado.

## Audiencia y trabajo principal

- Público: familia, uso diario desde el móvil.
- Trabajo principal: localizar y gestionar notas, cuentas, eventos y dispositivos
  sin ruido; la UI debe retirarse frente al contenido.

## Sistema de tokens

### Color (light)
- Background: `#F2F2F7` (systemGroupedBackground)
- Surface: `#FFFFFF` (secondarySystemGroupedBackground)
- Surface elevated: `#FFFFFF` + sombra suave
- Text primary: `#000000`
- Text secondary: `#3C3C43` (60 %)
- Text tertiary: `#3C3C43` (30 %)
- Separator: `#C6C6C8` (33 %)
- Accent: `#007AFF` (iOS Blue) — solo acción primaria
- Success: `#34C759`
- Warning: `#FF9500`
- Error/destructive: `#FF3B30`
- Online: `#34C759`

### Color (dark) — preparado, no entregado en Fase 1
- Background: `#000000`
- Surface: `#1C1C1E`
- Surface elevated: `#2C2C2E`
- Text primary: `#FFFFFF`
- Accent: `#0A84FF`

### Tipografía
- Display/UI: pila del sistema `-apple-system, BlinkMacSystemFont, "SF Pro Text",
  "SF Pro Display", "Helvetica Neue", Arial, sans-serif`.
- Tamaños: 11/13/15/17/20/22/28/34 (Dynamic Type).
- Pesos: 400 (regular), 500 (medium), 600 (semibold), 700 (bold).
- Wordmark "casa-os": SF Pro Display semibold, tracking -0.02em, una vez por
  pantalla.

### Layout
- Contenedor: max 1200 px, padding lateral 20 px (móvil) / 24 px (escritorio).
- Grid de 12 columnas en escritorio, 1 columna en móvil.
- Espaciado base 8 px; secciones con 24–32 px de aire.
- Radios: 10 px (inputs), 12 px (botones), 14 px (tarjetas), 20 px (hojas
  inferiores), 999 px (píldoras).
- Sombras: `0 1px 2px rgba(0,0,0,.06)` (rest), `0 8px 24px rgba(0,0,0,.12)`
  (elevated). Ninguna sombra en listas.
- Separadores: 0.5 px hairline o espacio; nunca bordes de 1 px decorativos.

### Principios únicos
- El contenido es el héroe; la UI se retira (sin bordes pesados, sin negro
  como CTA).
- Un único acento por pantalla (azul iOS para la acción primaria).
- Materiales translúcidos en tab bar y sidebar (blur).
- Dark mode preparado desde el inicio con variables semánticas.
- Movimiento spring corto (0.25–0.35 s); respetar `prefers-reduced-motion`.

## Componentes a modificar

1. `tailwind.config.ts` — colores, radios, sombras, tipografía, transiciones.
2. `src/app/globals.css` — variables CSS, materiales, separadores, inputs,
   botones, hojas inferiores.
3. `src/app/layout.tsx` — sidebar con blur, tab bar translúcida.
4. `src/components/*` — btn, input, card, badges, PageHeader.
5. Pantallas: login, dashboard, notas, calendario, dispositivos, cuentas, perfil,
   familia (solo clases).
6. Editor de notas (TipTap CSS en globals) — radios y colores.

## Accesibilidad

- Contraste AA mínimo (AAA en texto principal).
- Foco visible: anillo azul de 2 px.
- Objetivos táctiles ≥ 44 px en móvil.
- Dark mode con contraste verificado.
- `prefers-reduced-motion` respetado.

## Criterios de aceptación

- [ ] Tokens aplicados de forma consistente.
- [ ] Tipografía del sistema cargada y usada.
- [ ] Radios, sombras y separadores según spec.
- [ ] Dark mode preparado (variables) aunque solo claro entregado.
- [ ] No regresiones: `lint && typecheck && test && build` pasan.
- [ ] Responsive correcta en mobile/tablet/desktop.
- [ ] Lighthouse accesibilidad ≥ 95.
- [ ] Documentación actualizada (MEMORY.md + spec).

## Fuera de alcance

- No cambiar modelo de datos ni APIs.
- No añadir secciones funcionales.
- No reescribir lógica de negocio ni motor de bóveda/editor.
- No entregar dark mode completo en esta fase (solo preparación de tokens).

## Referencias

- `specs/auditoria-senior/auditoria.md` (sección 9).
- `specs/rediseno-inditex/referencias-premium.md` (patrones Awwwards).
- Apple Human Interface Guidelines.
