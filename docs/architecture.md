# Arquitectura

## Visión general

casa-os es una aplicación **monolítica** construida con Next.js App Router. Toda la
lógica de servidor y la UI conviven en el mismo proyecto, lo que simplifica el
despliegue y mantenimiento para un uso personal/familiar.

```
┌─────────────────────────────────────────────┐
│                   Cliente                    │
│  (Navegadores de la familia, móviles, etc.)  │
└──────────────────┬──────────────────────────┘
                   │ HTTP / HTTPS
┌──────────────────▼──────────────────────────┐
│              Next.js Server                  │
│  ┌─────────────────────────────────────┐    │
│  │           App Router (UI)            │    │
│  │   /devices  /notas  /dashboard      │    │
│  └──────────────┬──────────────────────┘    │
│                 │                            │
│  ┌──────────────▼──────────────────────┐    │
│  │         API Routes (Backend)        │    │
│  │   /api/devices  /api/notes  /auth   │    │
│  └──────────────┬──────────────────────┘    │
│                 │                            │
│  ┌──────────────▼──────────────────────┐    │
│  │     Prisma ORM  →  SQLite           │    │
│  └─────────────────────────────────────┘    │
└─────────────────────────────────────────────┘
```

## Decisiones de arquitectura

### 1. Monolito modular (no microservicios)

**Decisión**: Todo en un solo proyecto Next.js.

**Razón**: Para un uso personal/familiar, la complejidad de microservicios no se
justifica. Un monolito bien organizado es más fácil de desplegar, debuguear y
mantener.

### 2. SQLite como base de datos

**Decisión**: SQLite en lugar de PostgreSQL/MySQL.

**Razón**: 
- Cero configuración, cero servicios adicionales
- Un solo archivo = backups triviales
- Volumen de datos del hogar es pequeño (< 1GB en años)
- Suficiente para lecturas/escrituras concurrentes moderadas

**Cuándo migrar**: Si en el futuro se necesitan escrituras muy concurrentes o
datos > 10GB, migrar a PostgreSQL (Prisma hace esto trivial cambiando una línea).

### 3. API Routes en lugar de backend separado

**Decisión**: La lógica de backend vive en los Route Handlers de Next.js.

**Razón**: Co-locación con la UI, menor latencia, un solo proceso que gestionar.

### 4. Autenticación con JWT

**Decisión**: NextAuth con sesiones JWT (no de base de datos).

**Razón**: Stateless, más rápido, no requiere consultas a BD en cada request.

## Flujo de datos

```
Cliente → Next.js Server → Prisma → SQLite
                              ↓
Cliente ← Next.js Server ←───┘
```

1. El cliente hace un request a una página o API route
2. Next.js Server procesa, valida (Zod), y consulta Prisma
3. Prisma genera SQL optimizado y lo ejecuta sobre SQLite
4. El resultado se devuelve como JSON (API) o se renderiza como HTML (SSR)

## Principios de diseño

- **Privacidad primero**: Todo se aloja en casa, sin servicios de terceros
- **Mobile-first**: La familia usará mayoritariamente móviles
- **Simplicidad**: Sin over-engineering, sin abstractions innecesarias
- **Incremental**: Empezar simple, escalar solo cuando sea necesario
