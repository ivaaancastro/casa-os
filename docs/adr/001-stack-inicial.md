# ADR 001: Stack tecnológico inicial

- **Fecha**: 2026-10-14
- **Estado**: Aceptado
- **Decisores**: Iván

## Contexto

Necesitamos elegir el stack tecnológico para casa-os, una app web personal/familiar
autoalojada. El equipo es una persona (Iván) con experiencia en Node.js, React y algo
de Java. La app debe ser fácil de mantener, barata de operar y usable por toda la familia.

## Opciones consideradas

| Stack | Pros | Contras |
|-------|------|---------|
| **Next.js + SQLite** | Full-stack, React, SSR, fácil despliegue | Requiere servidor Node siempre activo |
| Astro + Express + SQLite | Más ligero, menos JS en cliente | DX menos integrada, más boilerplate |
| SvelteKit + SQLite | Muy ligero, poca boilerplate | Ecosistema menor, menos familiar |
| Laravel + MySQL | Maduro, migraciones excelentes | Overkill para uso personal, PHP |
| Spring Boot + MySQL | Conocido por Iván | Overkill, arranque lento, más complejo |

## Decisión

**Next.js 14 (App Router) + TypeScript + Prisma + SQLite + NextAuth + Tailwind CSS**

## Razones

1. **Next.js**: Un solo framework para UI y API. App Router permite SSR para
   rendimiento en móviles modestos.
2. **TypeScript**: Iván lo conoce y evita bugs en un proyecto que se toca
   de forma intermitente.
3. **Prisma + SQLite**: Migraciones automáticas, tipos generados, cero
   infraestructura. El volumen de datos del hogar es minúsculo para SQLite.
4. **NextAuth**: Estándar de facto en Next.js, soporta credenciales y roles.
5. **Tailwind**: Desarrollo rápido, mobile-first, sin contexto switching.

## Consecuencias

- **Positiva**: Un solo repositivo, un solo comando para arrancar, TypeScript en
  todo el stack.
- **Positiva**: SQLite hace que los backups sean triviales (un archivo).
- **Negativa**: Requiere un proceso Node siempre activo (un Raspberry Pi o
  mini PC consume ~5W).
- **Negativa**: Next.js tiene más "opiniones" que alternativas más simples —
  puede ser overkill si la app se vuelve muy simple.

## Alternativa de escape

Si en el futuro la app crece más de lo esperado:
- Migrar SQLite a PostgreSQL (cambio de 1 línea en Prisma)
- Migrar Next.js a un backend + frontend separados si escalan los usuarios
