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
| Base de datos | PostgreSQL vía Prisma | ^5.22 |
| Estilos | Tailwind CSS | ^3.4 |
| Auth | NextAuth.js | ^4.24 |
| Tests | Vitest | ^2.1 |

## Comandos esenciales

```bash
# Desarrollo
npm run dev              # Servidor de desarrollo en :3000

# Base de datos (PostgreSQL; dev local: `docker compose up -d db`)
npm run db:generate      # Generar cliente Prisma
npm run db:migrate       # Crear migración (interactivo)
npm run db:migrate:deploy # Aplicar migraciones (producción/CI)
npm run db:migrate-data  # Volcar datos desde un prisma/dev.db antiguo (SQLite)
npm run db:push          # Sincronizar schema sin migración
npm run db:studio        # GUI de Prisma
npm run db:seed          # Poblar datos iniciales

# Calidad
npm run lint             # ESLint
npm run typecheck        # TypeScript sin emitir
npm run test             # Tests (una pasada)
npm run test:watch       # Tests en modo watch
npm run build            # Build de producción
npm run docs:check -- <feature> # Validar el cierre documental de una feature

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
- **NUNCA** modificar la base de datos a mano
- Las migraciones son inmutables — crear nueva migración para cambios
- En producción/CI se aplican con `npm run db:migrate:deploy`
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

## Spec-Driven Development (SDD) — flujo de trabajo para features/fix

> **Resumen SDD operativo:**
> 1. Crear rama `feat/<nombre>` o `fix/<nombre>` (desde `main`).
> 2. Crear carpeta `specs/<nombre>/` con `plan.md`, `spec.md`.
> 3. El usuario aprueba el `spec.md`.
> 4. Tras aprobación, crear `tasks.md` y solo entonces implementar.
> 5. Ejecutar `lint && typecheck && test && build` antes de reportar.
> 6. Tras el merge, cerrar la feature con un PR `docs/cierre-<nombre>` (Paso 8).

> **REGLA ABSOLUTA: NUNCA se commitea ni se pushea directamente a `main`.**
> Todo el trabajo se hace en ramas (`feat/*`, `fix/*` o `docs/*`) con PR.

> **REGLA ABSOLUTA: Solo UNA feature activa a la vez.**
> Antes de crear una nueva rama de feature, verificar que no haya PRs abiertos.
> El PR de cierre documental (`docs/cierre-<nombre>`) es parte del cierre: debe
> mergearse antes de abrir la siguiente feature.

> **PRs de documentación:** los cambios que no son features/fixes usan
> `docs/<nombre>`; no requieren `specs/`, pero sí PR y CI verde.

### Paso 1 — Crear carpeta de spec

Cada feature/fix tiene su carpeta en `specs/` con nombre kebab-case:

```
specs/
└── <feature-name>/
    ├── plan.md      # Análisis y enfoque técnico
    ├── spec.md      # Especificación detallada (el usuario la aprueba)
    ├── tasks.md     # Tareas de implementación (checkboxes)
    └── cierre.md    # Registro final (se completa tras el merge)
```

### Paso 2 — Generar `plan.md`

Contiene: contexto, enfoque técnico, dependencias, riesgos.

### Paso 3 — Generar `spec.md`

Contiene: requisitos funcionales/no funcionales, API, modelo de datos,
UI/UX, criterios de aceptación.

### Paso 4 — Aprobación del usuario

**El usuario debe aprobar el `spec.md` antes de continuar.**

### Paso 5 — Generar `tasks.md`

Tareas concretas con checkboxes (`- [ ]`), ordenadas por dependencia, cada una
pequeña (30 min - 2 horas) con archivos a crear/modificar. Al cerrar la feature
no debe quedar ninguna tarea pendiente: se marca `- [x]` o se mueve a
`cierre.md` → *Pendientes / follow-ups*.

### Paso 6 — Preguntas al usuario

Si surge ambigüedad, **preguntar antes de implementar**.

### Paso 7 — Implementación

1. Crear rama desde `main`: `git checkout -b feat/nombre-feature`
2. Escribir test primero (TDD cuando sea posible)
3. Implementar tareas en orden
4. **Verificación doble check (OBLIGATORIA)**:
   ```bash
   npm run lint && npm run typecheck && npm run test && npm run build
   ```
   Si CUALQUIERA falla, corregir antes de continuar. NO reportar como
   completado hasta que todo pase.
5. Verificación de UI con Chrome MCP si la feature toca interfaz.
6. Commits atómicos con conventional commits
7. Push de la rama: `git push -u origin feat/nombre-feature`
8. Crear PR con descripción que referencia el spec
9. Verificar que el CI de GitHub pasa en el PR
10. **No declarar la feature terminada todavía**: queda el cierre
    documental (Paso 8). El merge de código no es el final.
11. Squash merge, borrar la rama y verificar el CI de `main`.

### Paso 8 — Cierre documental (OBLIGATORIO)

> Se ejecuta después del merge de la feature y de borrar su rama, antes de abrir
> la siguiente. La feature **no está cerrada** hasta que el PR de cierre esté
> mergeado y el CI de `main` esté verde. Guía detallada:
> [`docs/cierre-feature.md`](docs/cierre-feature.md). Plantilla:
> [`specs/_template/cierre.md`](specs/_template/cierre.md).

#### Fase A — antes del merge (en el PR de la feature)

- [ ] `specs/<nombre>/tasks.md` con checkboxes; marcar todo lo verificable.
- [ ] Borrador de `specs/<nombre>/cierre.md`: resumen, alcance, cambios,
      verificación local/UI, documentación y pendientes. Producción queda
      como *pendiente*.
- [ ] `CHANGELOG.md` actualizado (`Added` / `Changed` / `Fixed`).
- [ ] `README.md` y `docs/*` actualizados si cambian comandos, comportamiento,
      arquitectura o guías.
- [ ] `MEMORY.md`: estado "en producción, pendiente de cierre", roadmap,
      notas técnicas y lecciones. **No marcar todavía como Hecho.**
- [ ] `spec.md` actualizado si cambian criterios o decisiones.
- [ ] CI del PR de feature en verde.

#### Fase B — después del merge (PR `docs/cierre-<nombre>`)

- [ ] Crear rama `docs/cierre-<nombre>` desde `main` actualizado.
- [ ] Verificar producción: deployment *Ready/Current*, health, rutas públicas
      y smoke autenticado (o dejar constancia de quién lo verificó y por qué).
- [ ] Completar `cierre.md`: PR, commit, deployment, URL, evidencia, tareas
      `[x]` y follow-ups. **Sin casillas pendientes.**
- [ ] `MEMORY.md`: marcar Hecho, añadir fila al *Registro de features*,
      actualizar foco, fecha y lecciones.
- [ ] `CHANGELOG.md`, `README.md` y `docs/*`: corregir lo que falte.
- [ ] `npm run docs:check -- <nombre>` debe pasar.
- [ ] PR de cierre → CI verde → squash merge → borrar rama.
- [ ] Verificar el CI de `main` tras el merge del cierre. Solo ahora se puede
      abrir la siguiente feature.

**Regla de bloqueo:** si producción falla o falta una verificación, la feature
queda bloqueada. No se marca como Hecho, se registra el fallo en `cierre.md` y
se abre un `fix/*` antes de continuar. No se inventan evidencias ni se marcan
tareas no verificadas.

### Definición de terminado (DoD)

Una feature está terminada solo si:

1. Código, tests, lint, typecheck y build pasan en local y en CI.
2. La UI se verificó con Chrome MCP (incluido móvil si aplica).
3. El PR de feature está mergeado (squash) y la rama borrada.
4. Producción está desplegada y verificada (pública y autenticada cuando toca).
5. `specs/<nombre>/tasks.md` no tiene casillas pendientes.
6. `specs/<nombre>/cierre.md` está completo y sin casillas pendientes.
7. `MEMORY.md`, `CHANGELOG.md`, `README.md` y `docs/*` reflejan la realidad.
8. `npm run docs:check -- <nombre>` pasa.
9. El PR de cierre está mergeado, su rama borrada y el CI de `main` verde.

## Seguridad

- **NUNCA** exponer la base de datos directamente
- Variables de entorno en `.env` (nunca en el código)
- Validar TODA la entrada del usuario con Zod
- El escaneo de red solo debe ejecutarse en la red local del hogar
- No almacenar contraseñas en claro: solo hashes bcrypt (el seed crea una
  credencial inicial conocida; debe cambiarse al primer acceso)
- Nunca escribir contraseñas, tokens ni secretos en documentación, MEMORY,
  CHANGELOG, specs o mensajes de commit. Solo se registra dónde se guardan
  (gestor de contraseñas)

## Lo que NO debe hacer un agente

- **NUNCA hacer commit o push a `main`** — todo en ramas con PR
- No crear migraciones destructivas sin confirmación explícita
- No exponer rutas de API sin autenticación
- No añadir dependencias sin justificación y aprobación
- No modificar el esquema de auth sin revisión previa
- No hacer `git push --force` a `main`
- No implementar features sin spec aprobado por el usuario
- **No reportar como completado sin ejecutar TODAS las verificaciones**
- **No pedir al usuario que compruebe algo que el agente no ha comprobado**
- **No marcar una spec como aprobada si los tests no pasan**
- **No abrir una feature nueva hasta que el cierre documental esté mergeado y
  el CI de `main` esté verde**
- **No declarar una feature terminada sin `specs/<nombre>/cierre.md` completo
  y `npm run docs:check -- <nombre>` en verde**
- **No inventar evidencias, PRs, commits, deployments ni verificaciones**
- **No documentar contraseñas o secretos** — solo el gestor donde se guardan

## Recursos útiles

- [Next.js App Router](https://nextjs.org/docs/app)
- [Prisma con PostgreSQL](https://www.prisma.io/docs/concepts/database-connectors/postgresql)
- [NextAuth.js](https://next-auth.js.org/)
- [Tailwind CSS](https://tailwindcss.com/docs)
