# Arquitectura

## Visión general

casa-os es una aplicación **monolítica** construida con Next.js App Router. Toda la
lógica de servidor y la UI conviven en el mismo proyecto, lo que simplifica el
despliegue y mantenimiento para un uso personal/familiar.

```
┌───────────────────────────────────────────────┐
│                   Cliente                     │
│  (Navegadores de la familia, móviles, etc.)   │
└──────────────────┬────────────────────────────┘
                   │ HTTP / HTTPS
┌──────────────────▼────────────────────────────┐
│              Next.js Server                   │
│  ┌─────────────────────────────────────────┐  │
│  │           App Router (UI)               │  │
│  │ /devices /notas /calendario /dashboard  │  │
│  └──────────────┬──────────────────────────┘  │
│                 │                             │
│  ┌──────────────▼──────────────────────────┐  │
│  │         API Routes (Backend)            │  │
│  │ /api/devices /api/notes /api/events     │  │
│  │ /api/push /api/reminders                │  │
│  └──────────────┬──────────────────────────┘  │
│                 │                             │
│  ┌──────────────▼──────────────────────────┐  │
│  │     Prisma ORM  →  PostgreSQL           │  │
│  └─────────────────────────────────────────┘  │
└───────────────────────────────────────────────┘
```

## Decisiones de arquitectura

### 1. Monolito modular (no microservicios)

**Decisión**: Todo en un solo proyecto Next.js.

**Razón**: Para un uso personal/familiar, la complejidad de microservicios no se
justifica. Un monolito bien organizado es más fácil de desplegar, debuguear y
mantener.

### 2. PostgreSQL como base de datos

**Decisión**: PostgreSQL (antes SQLite).

**Razón**:
- El destino de despliegue es serverless (Vercel), que no tiene disco persistente:
  SQLite no es viable allí.
- PostgreSQL gestionado (Neon, Vercel Postgres) ofrece persistencia, pooling y
  copias de seguridad sin administrar servidores.
- En desarrollo se levanta en local con Docker Compose (`docker compose up -d db`).

**Historia**: la versión inicial usaba SQLite por su sencillez para un uso
doméstico; se migró a PostgreSQL al pasar a alojamiento en la nube (feature
`feat/postgres`, migración base `prisma/migrations/0000_init`).

### 3. API Routes en lugar de backend separado

**Decisión**: La lógica de backend vive en los Route Handlers de Next.js.

**Razón**: Co-locación con la UI, menor latencia, un solo proceso que gestionar.

### 4. Autenticación con JWT

**Decisión**: NextAuth con sesiones JWT (no de base de datos).

**Razón**: Stateless, más rápido, no requiere consultas a BD en cada request.

### 5. Web Push con scheduler externo

**Decisión**: Web Push con `web-push` y un workflow de GitHub Actions cada 5
minutos que llama a `POST /api/reminders/dispatch`.

**Razón**: Vercel Hobby no permite cron sub-diario. El workflow usa
`CRON_SECRET`, no cambia el plan de Vercel y mantiene el envío fuera de la
request del usuario. La deduplicación vive en PostgreSQL
(`ReminderDelivery`), no en memoria del proceso serverless.

Los avisos de todo el día se calculan a las 09:00 de `HOUSE_TIMEZONE`; los
eventos con hora usan `start - reminderMinutes`. El service worker solo recibe
el payload mínimo y no cachea datos privados.

### 6. 2FA TOTP con sesiones revocables

**Decisión**: segundo factor TOTP y `sessionVersion` dentro del JWT.

**Razón**: cualquier app autenticadora estándar sirve, sin depender de SMS ni de
una plataforma. El secreto se guarda cifrado con AES-256-GCM
(`TOTP_ENCRYPTION_KEY`). `sessionVersion` se comprueba en cada request
autenticada: al cambiar la contraseña o el 2FA se incrementa y los JWT
anteriores dejan de valer, sin necesidad de una tabla de sesiones.

### 7. Cuentas zero-knowledge (siguiente)

**Decisión**: la sección `/cuentas` cifrará en el cliente; el servidor solo
almacenará ciphertext.

**Razón**: un gestor de contraseñas server-side (prototipo de PR #32) permite
que el servidor descifre las credenciales, así que no sirve para una bóveda
familiar. La master password y las claves derivadas nunca saldrán del
navegador; el servidor no podrá leer nombres, usuarios, contraseñas, URLs ni
notas. La passkey (WebAuthn PRF) será un desbloqueo opcional, no un sustituto
del login en la v1. Requiere 2FA activo y una spec aprobada antes de
implementarse.

## Flujo de datos

```
Cliente → Next.js Server → Prisma → PostgreSQL
                              ↓
Cliente ← Next.js Server ←───┘
```

1. El cliente hace un request a una página o API route
2. Next.js Server procesa, valida (Zod), y consulta Prisma
3. Prisma genera SQL optimizado y lo ejecuta sobre PostgreSQL
4. El resultado se devuelve como JSON (API) o se renderiza como HTML (SSR)

## Principios de diseño

- **Privacidad primero**: Sin rastreadores ni servicios de terceros innecesarios;
  los datos viven en la base de datos que tú controlas
- **Mobile-first**: La familia usará mayoritariamente móviles
- **Simplicidad**: Sin over-engineering, sin abstractions innecesarias
- **Incremental**: Empezar simple, escalar solo cuando sea necesario
