# AGENTS.md — Manual del Agente

Este archivo proporciona instrucciones a los agentes de IA (OpenCode, Claude, etc.)
que trabajen en este proyecto.

## Descripción del proyecto

**casa-os** es una aplicación web personal para gestionar datos del hogar:
dispositivos de red, notas familiares, y futuras secciones (calendario, inventario, etc.).
Es un proyecto de uso personal/familiar, no un producto comercial.

## Stack técnico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Runtime | Node.js | >= 20 |
| Framework | Next.js (App Router) | ^14.2 |
| Lenguaje | TypeScript | ^5.6 |
| Base de datos | SQLite vía Prisma | ^5.22 |
| Estilos | Tailwind CSS | ^3.4 |
| Auth | NextAuth.js | ^4.24 |
| Tests | Vitest | ^2.1 |

## Comandos esenciales

```bash
# Desarrollo
npm run dev              # Servidor de desarrollo en :3000

# Base de datos
npm run db:generate      # Generar cliente Prisma
npm run db:migrate       # Crear migración (interactivo)
npm run db:push          # Sincronizar schema sin migración
npm run db:studio        # GUI de Prisma
npm run db:seed          # Poblar datos iniciales

# Calidad
npm run lint             # ESLint
npm run typecheck        # TypeScript sin emitir
npm run test             # Tests
npm run build            # Build de producción

# Utilidades
npm run scan             # Escanear red local
npm run backup           # Backup de la BD
```

## Estructura del código

```
src/
├── app/                 # Rutas de Next.js (App Router)
│   ├── layout.tsx       # Layout principal con sidebar
│   ├── page.tsx         # Dashboard
│   ├── devices/         # Sección dispositivos
│   ├── notas/           # Sección notas/compra
│   ├── api/             # API routes
│   └── auth/            # Autenticación
├── components/          # Componentes React reutilizables
├── lib/                 # Utilidades, prisma client, auth config
└── types/               # Tipos TypeScript compartidos
```

## Convenciones de código

### Nombres
- **Archivos de componentes**: PascalCase (`DeviceCard.tsx`)
- **Archivos de utilidad**: camelCase (`formatDate.ts`)
- **Componentes React**: función exportada por defecto o named export
- **Base de datos**: Prisma usa PascalCase para modelos, camelCase para campos

### TypeScript
- Strict mode activado — no usar `any` sin justificación
- Preferir `type` sobre `interface` para uniones y tipos condicionales
- Usar `satisfies` cuando sea posible (TypeScript 5.6+)

### Estilos (Tailwind)
- Clases utilitarias en orden: layout → spacing → typography → colors → effects
- Componentes complejos: extraer a `components/` con clases semánticas
- Colores: usar la paleta `brand` definida en `tailwind.config.ts`

### Commits (Conventional Commits)
```
feat: añadir escaneo de red automático
fix(auth): corregir expiración de sesión
docs: actualizar guía de despliegue
refactor(db): simplificar esquema de Device
test(devices): añadir tests del escáner
```

### API Routes
- Validación con Zod siempre
- Manejar errores con `NextResponse.json()` y códigos HTTP correctos
- Autenticación obligatoria en todas las rutas de API

## Base de datos

### Flujo de trabajo con Prisma

1. **Modificar schema** → `prisma/schema.prisma`
2. **Crear migración** → `npm run db:migrate -- --name nombre descriptivo`
3. **Generar cliente** → `npm run db:generate`
4. **Actualizar tipos** → ya incluido en el paso anterior

### Reglas
- **NUNCA** modificar `prisma/dev.db` directamente
- Las migraciones son inmutables — crear nueva migración para cambios
- Usar `onDelete: Cascade` solo cuando tenga sentido de dominio
- Timestamps: `createdAt` y `updatedAt` en todos los modelos

## Autenticación

- NextAuth con credenciales email/contraseña
- Roles: `ADMIN` (puede todo) y `FAMILY` (solo lectura/escritura de notas)
- La sesión se gestiona con JWT
- Middleware de NextAuth protege rutas en `src/middleware.ts`

## Testing

- Ubicación: `tests/` o colocado junto al código (`*.test.ts`)
- Framework: Vitest (compatible con API de Jest)
- Cobertura objetivo: lógica de negocio y utilidades, no UI
- Mock de Prisma con `vitest-mock-extended`

## Flujo de trabajo para features/fix

> **REGLA ABSOLUTA: NUNCA se commitea ni se pushea directamente a `main`.**
> Todo el trabajo se hace en ramas (`feat/*` o `fix/*`) con PR.

### Paso 1 — Crear carpeta de spec

Cada feature/fix tiene su carpeta en `specs/` con nombre kebab-case:

```
specs/
└── <feature-name>/
    ├── plan.md      # Análisis y enfoque técnico
    ├── spec.md      # Especificación detallada (el usuario la aprueba)
    └── tasks.md     # Tareas de implementación
```

### Paso 2 — Generar `plan.md`

Contiene: contexto, enfoque técnico, dependencias, riesgos.

### Paso 3 — Generar `spec.md`

Contiene: requisitos funcionales/no funcionales, API, modelo de datos,
UI/UX, criterios de aceptación.

### Paso 4 — Aprobación del usuario

**El usuario debe aprobar el `spec.md` antes de continuar.**

### Paso 5 — Generar `tasks.md`

Lista numerada de tareas concretas, ordenadas por dependencia, cada una
pequeña (30 min - 2 horas) con archivos a crear/modificar.

### Paso 6 — Preguntas al usuario

Si surge ambigüedad, **preguntar antes de implementar**.

### Paso 7 — Implementación

1. Crear rama desde `main`: `git checkout -b feat/nombre-feature`
2. Escribir test primero (TDD cuando sea posible)
3. Implementar tareas en orden
4. Typecheck + lint + tests deben pasar
5. Commits atómicos con conventional commits
6. Push de la rama: `git push -u origin feat/nombre-feature`
7. Crear PR con descripción que referencia el spec
8. Tras merge, eliminar rama

## Seguridad

- **NUNCA** exponer la base de datos directamente
- Variables de entorno en `.env` (nunca en el código)
- Validar TODA la entrada del usuario con Zod
- El escaneo de red solo debe ejecutarse en la red local del hogar
- No almacenar contraseñas ni secretos en la base de datos

## Lo que NO debe hacer un agente

- **NUNCA hacer commit o push a `main`** — todo en ramas con PR
- No crear migraciones destructivas sin confirmación explícita
- No exponer rutas de API sin autenticación
- No añadir dependencias sin justificación y aprobación
- No modificar el esquema de auth sin revisión previa
- No hacer `git push --force` a `main`
- No implementar features sin spec aprobado por el usuario

## Recursos útiles

- [Next.js App Router](https://nextjs.org/docs/app)
- [Prisma con SQLite](https://www.prisma.io/docs/concepts/database-connectors/sqlite)
- [NextAuth.js](https://next-auth.js.org/)
- [Tailwind CSS](https://tailwindcss.com/docs)
