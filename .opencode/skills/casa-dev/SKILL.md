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
specs/           # Especificaciones de features (UNA CARPETA POR FEATURE)
  <feature-name>/
    plan.md      # Análisis y enfoque técnico
    spec.md      # Especificación detallada (el usuario la aprueba)
    tasks.md     # Tareas de implementación
src/app/*        # Solo rutas y páginas de Next.js
src/components/  # Componentes React (sin lógica de servidor)
src/lib/         # Utilidades y configuración (prisma, auth)
src/types/       # Tipos TypeScript compartidos
tests/           # Tests (co-locados o centralizados)
```

## Flujo de trabajo para cada feature/fix

### Reglas absolutas

> **🔴 NUNCA se commitea ni se pushea directamente a `main`.**
> Todo el trabajo se hace en ramas (`feat/*` o `fix/*`) con PR.

### Paso 1 — Crear carpeta de spec

```bash
mkdir specs/<feature-name-kebab-case>
```

Ejemplos de nombres:
- `auth-login` — Implementar login con email/contraseña
- `devices-scan` — Escaneo de red de dispositivos
- `notes-crud` — CRUD completo de notas
- `sidebar-nav` — Navegación lateral

### Paso 2 — Generar `plan.md`

Contiene:
- **Contexto**: Por qué se necesita esta feature
- **Enfoque técnico**: Stack de solución, decisiones clave
- **Dependencias**: Qué otra feature o infraestructura necesita
- **Riesgos**: Qué puede salir mal y cómo mitigarlo

### Paso 3 — Generar `spec.md`

Contiene:
- **Requisitos funcionales**: Qué hace (lista numerada)
- **Requisitos no funcionales**: Rendimiento, seguridad, UX
- **API/Endpoints**: Si aplica, rutas y formatos
- **Modelo de datos**: Si aplica, cambios en Prisma
- **UI/UX**: Descripción de pantallas y flujo de usuario
- **Criterios de aceptación**: Lista verificable de qué está terminado

### Paso 4 — Aprobación del usuario

**El usuario debe aprobar el `spec.md` antes de continuar.**

### Paso 5 — Generar `tasks.md`

Contiene lista numerada de tareas concretas y verificables:
- Cada tarea es pequeña (30 min - 2 horas)
- Cada tarea indica archivos a crear/modificar
- Las tareas están ordenadas por dependencia

### Paso 6 — Preguntas al usuario

Si durante el spec o las tareas surge ambigüedad, **preguntar antes de implementar**.

### Paso 7 — Implementación

1. Crear rama: `git checkout -b feat/<feature-name>`
2. Implementar tareas en orden
3. Ejecutar `npm run lint && npm run typecheck && npm run test`
4. Commits atómicos con conventional commits
5. Push de la rama: `git push -u origin feat/<feature-name>`
6. Crear PR con descripción que referencia el spec

## Reglas de oro

1. **Todo el código y comentarios en español** (identificadores técnicos en inglés)
2. **TypeScript estricto** — nunca `any` sin justificación
3. **Validación con Zod** en TODAS las API routes
4. **Commits en español** con Conventional Commits
5. **Tests antes de implementar** (TDD cuando sea posible)
6. **Mobile-first** en todos los diseños UI
7. **Un feature = una rama** — nunca desarrollar en `main`
8. **Spec antes de código** — nunca implementar sin spec aprobado

## Convenciones de nomenclatura

| Elemento | Convención | Ejemplo |
|----------|-----------|---------|
| Spec folder | kebab-case | `specs/auth-login/` |
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
- ❌ Hacer commit o push a `main`
- ❌ Implementar sin spec aprobado

## Referencias rápidas

- [Next.js App Router](https://nextjs.org/docs/app)
- [Prisma + SQLite](https://www.prisma.io/docs/concepts/database-connectors/sqlite)
- [NextAuth.js](https://next-auth.js.org/)
