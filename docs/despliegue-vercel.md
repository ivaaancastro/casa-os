# Despliegue en Vercel (guía paso a paso)

> Casa-os se despliega en **Vercel** (Next.js) con una base de datos
> **PostgreSQL** gestionada. Vercel despliega automáticamente en cada push a
> `main`; las migraciones se aplican solas durante el build.

---

## 0. Requisitos

- Cuenta de GitHub con acceso al repo `ivaaancastro/casa-os`.
- Cuenta de Vercel (gratuita): <https://vercel.com/signup>.
- (Opcional) Un dominio propio.

---

## 1. Crear la base de datos PostgreSQL

Elige **una** de estas dos vías. Ambas dan las dos URLs que necesitas.

### Opción A — Vercel Postgres (recomendado: todo en un sitio)

1. En el dashboard de Vercel: **Storage → Create Database → Postgres**.
2. Elige región (la más cercana) y plan **Hobby** (gratis).
3. Crea la base y abre la pestaña **`.env.local`** / **Connection Strings**.
4. Copia:
   - **`POSTGRES_URL`** → será tu `DATABASE_URL` (con pooler).
   - **`POSTGRES_URL_NON_POOLING`** → será tu `DIRECT_URL`.

### Opción B — Neon (independiente de Vercel)

1. Crea un proyecto en <https://neon.tech>.
2. En **Connection Details** copia:
   - La URL con **`-pooler`** en el host → `DATABASE_URL`.
   - La URL **sin** `-pooler` → `DIRECT_URL`.
3. Añade `?sslmode=require` a ambas si no viene ya.

> **Por qué dos URLs**: el runtime serverless abre muchas conexiones cortas y
> necesita el pooler. Las migraciones necesitan una conexión directa.

---

## 2. Importar el repositorio en Vercel

1. <https://vercel.com/new> → **Import Git Repository**.
2. Autoriza a Vercel si es la primera vez y elige `ivaaancastro/casa-os`.
3. Configuración del proyecto:
   - **Framework Preset**: Next.js (se detecta solo).
   - **Root Directory**: `./`
   - **Build Command**: déjalo vacío. Vercel usará `npm run vercel-build`
     (definido en `package.json`), que aplica migraciones y compila.
   - **Install Command**: `npm ci` (por defecto).
   - **Node.js Version**: 20.x.
4. **No despliegues todavía**: primero añade las variables (paso 3).

---

## 3. Variables de entorno

En **Settings → Environment Variables** (entorno **Production**, y opcionalmente
Preview) añade:

| Variable | Valor | Notas |
|---|---|---|
| `DATABASE_URL` | URL con pooler | Runtime de la app |
| `DIRECT_URL` | URL directa (sin pooler) | Migraciones |
| `NEXTAUTH_URL` | `https://<tu-dominio>` | En el primer deploy usa la URL de Vercel |
| `NEXTAUTH_SECRET` | secreto aleatorio | Genera con `openssl rand -base64 32` |

Genera el secreto en tu máquina:

```bash
openssl rand -base64 32
```

> **Primer despliegue sin dominio**: usa como `NEXTAUTH_URL` la URL que Vercel te
> asigne (p. ej. `https://casa-os-xxxx.vercel.app`). Cuando conectes el dominio,
> actualízala y vuelve a desplegar.

---

## 4. Desplegar

1. Pulsa **Deploy**.
2. El build ejecuta `prisma migrate deploy` (crea el esquema) y `next build`.
3. Espera a que termine y abre la URL.

### Crear el usuario administrador

El seed **no** se ejecuta solo en producción. Ejecútalo una vez desde tu máquina,
apuntando a la base de datos de producción:

```bash
# En tu máquina, dentro del repo
export DATABASE_URL="<URL con pooler>"
export DIRECT_URL="<URL directa>"
npm run db:seed
```

Crea (o actualiza) `admin@casa.local` con contraseña `admin123`.
**Cambia esa contraseña** en `/perfil` en cuanto entres.

---

## 5. Verificar

1. Abre `https://<tu-url>/api/health` → debe devolver:

   ```json
   { "status": "ok", "db": "ok", "timestamp": "..." }
   ```

   Si devuelve `503`, revisa `DATABASE_URL` y que la base esté activa.

2. Entra en `/auth/login` con `admin@casa.local` / `admin123`.
3. Comprueba notas (crear y guardar), familia y perfil.

---

## 6. Dominio propio (opcional)

1. Compra un dominio (Cloudflare Registrar, Namecheap, etc.).
2. En Vercel: **Settings → Domains → Add**, escribe tu dominio.
3. Vercel te indica los registros DNS:
   - `A` → `76.76.21.21` (o el que indique), o
   - `CNAME` → `cname.vercel-dns.com` para `www`.
4. Crea esos registros en tu proveedor de DNS.
5. Vuelve a Vercel y pulsa **Refresh** hasta que aparezca **Valid Configuration**.
   El certificado HTTPS se emite solo (Let's Encrypt).
6. Actualiza `NEXTAUTH_URL` al dominio nuevo y **redeploy**.

Comprobar propagación:

```bash
dig +short casa.tudominio.com
```

---

## 7. Actualizaciones

Cada push a `main` dispara un despliegue:

1. `npm ci` (con `postinstall: prisma generate`).
2. `npm run vercel-build` → `prisma migrate deploy && next build`.
3. Publicación.

Si añades una migración nueva, se aplica automáticamente en el deploy.

---

## Troubleshooting

| Síntoma | Causa probable | Solución |
|---|---|---|
| Build falla en `prisma migrate deploy` | `DIRECT_URL` mal o base inactiva | Revisa la URL directa y el estado de la BD |
| `503` en `/api/health` | `DATABASE_URL` incorrecta | Usa la URL con pooler |
| Login vuelve a la pantalla de login | `NEXTAUTH_URL` no coincide con el dominio | Ajústala y redeploy |
| `Too many connections` | Falta el pooler | Usa la URL con `-pooler` |
| Error de CSP en consola | Directiva demasiado estricta | Ajusta `next.config.js` y redeploy |
| `P1001: Can't reach database` | Base pausada (plan free) | Reactívala en el panel del proveedor |

---

## Notas de seguridad

- **Nunca** subas `.env` al repo; los secretos viven en Vercel.
- El repo ya envía cabeceras de seguridad (CSP, HSTS, nosniff, frame-options).
- El endpoint `/api/health` es público **a propósito**: solo revela estado, no datos.
- El escaneo de red (`npm run scan`) **no funciona en Vercel** (serverless); es una
  utilidad local.
