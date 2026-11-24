# Plan — Rediseño visual: Inditex → Apple

## Contexto

casa-os usa hoy una identidad editorial inspirada en Inditex/Zara (Bodoni Moda +
Jost, radios 0, sin sombras, paleta blanco/negro/gris). La auditoría senior
(`specs/auditoria-senior/auditoria.md`) concluye que, para un gestor del hogar
de uso diario en móvil, el estilo resulta frío y denso. Se propone migrar a un
lenguaje inspirado en Apple HIG (SF Pro, esquinas redondeadas, materiales
translúcidos, sombras sutiles, dark mode).

## Enfoque técnico

1. **Tokens primero**: actualizar `tailwind.config.ts` y `src/app/globals.css`
   con la nueva paleta, tipografía, radios, sombras y variables CSS semánticas
   para dark mode.
2. **Componentes base**: `btn`, `input`, `card`, tab bar, sidebar, badges.
3. **Pantallas**: login, dashboard, notas, calendario, dispositivos, cuentas,
   perfil, familia (solo clases/Tailwind, sin cambios de lógica).
4. **QA visual** con Chrome MCP (móvil + escritorio) y E2E existentes.
5. **Cierre documental** según protocolo.

## Dependencias

- Ninguna nueva dependencia obligatoria (SF Pro vía `system-ui` / `-apple-system`).
- Opcional: `next/font/local` si se quiere autoalojar SF Pro (licencia Apple
  restringe uso web público; para uso personal/familiar se usa la pila del
  sistema).

## Riesgos

- Regresiones visuales en E2E que dependan de selectores por texto (bajo).
- Coste de revisión manual de todas las pantallas.
- Dark mode requiere probar contraste en ambas variantes.

## Fuera de alcance

- Modelo de datos, APIs, lógica de negocio.
- Nuevas secciones funcionales.
- Motor de la bóveda y editor TipTap (solo tokens/CSS).
