# Skill: casa-dev

## Descripción

Guía de desarrollo para el proyecto casa-os. Define convenciones, comandos,
y buenas prácticas que todo agente debe seguir.

## Activación

Usa esta skill cuando:
- Se vaya a desarrollar una nueva feature en casa-os
- Se necesite entender la estructura del proyecto
- Se vaya a crear o modificar código fuente

## Stack y versiones

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Runtime | Node.js | >= 20 |
| Framework | Next.js (App Router) | ^14.2 |
| Lenguaje | TypeScript (strict) | ^5.6 |
| ORM | Prisma | ^5.22 |
| Base de datos | SQLite | ^3 |
| Estilos | Tailwind CSS | ^3.4 |
| Auth | NextAuth.js | ^4.24 |
| Tests | Vitest | ^2.1 |

## Comandos esenciales

```bash
npm run dev              # Desarrollo en :3000
npm run db:migrate       # Crear migración interactiva
npm run db:push          # Sincronizar schema
npm run db:seed          # Poblar datos iniciales
npm run lint             # ESLint
npm run typecheck        # TypeScript sin emitir
npm run test             # Tests
npm run build            # Build producción
```

## Estructura obligatoria

```
src/app/*        # Solo rutas y páginas de Next.js
src/components/  # Componentes React (sin lógica de servidor)
src/lib/         # Utilidades y configuración (prisma, auth)
src/types/       # Tipos TypeScript compartidos
tests/           # Tests (co-locados o centralizados)
```

## Reglas de oro

1. **Todo el código y comentarios en español** (identificadores técnicos en inglés)
2. **TypeScript estricto** — nunca `any` sin justificación
3. **Validación con Zod** en TODAS las API routes
4. **Commits en español** con Conventional Commits
5. **Tests antes de implementar** (TDD cuando sea posible)
6. **Mobile-first** en todos los diseños UI
7. **Un feature = una rama** — nunca desarrollar en `main`

## Flujo para una nueva feature

1. `git checkout main && git pull`
2. `git checkout -b feat/nombre-descriptivo`
3. Escribir test primero
4. Implementar
5. `npm run lint && npm run typecheck && npm run test`
6. Commit: `feat: descripción`
7. Push + PR

## Convenciones de nomenclatura

| Elemento | Convención | Ejemplo |
|----------|-----------|---------|
| Componente React | PascalCase | `DeviceCard.tsx` |
| Hook | camelCase con prefijo `use` | `useDevices.ts` |
| Utilidad | camelCase | `formatDate.ts` |
| Tipo TypeScript | PascalCase | `type DeviceStatus` |
| API route | kebab-case | `api/devices/scan.ts` |
| Modelo Prisma | PascalCase | `model Device` |

## Anti-patrónes (NO hacer)

- ❌ Importar PrismaClient directamente — usar el singleton de `src/lib/prisma.ts`
- ❌ Hacer fetch desde el cliente a rutas internas — usar Server Components
- ❌ Usar `useEffect` para data fetching que puede ser SSR
- ❌ Hardcodear strings mágicos — usar constantes o enums
- ❌ Crear componentes con más de ~150 líneas — dividir

## Referencias rápidas

- [Next.js App Router](https://nextjs.org/docs/app)
- [Prisma + SQLite](https://www.prisma.io/docs/concepts/database-connectors/sqlite)
- [NextAuth.js](https://next-auth.js.org/)
