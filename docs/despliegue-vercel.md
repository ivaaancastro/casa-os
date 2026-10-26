# Despliegue en Vercel (guía paso a paso)

> Casa-os se despliega en **Vercel** (Next.js) con una base de datos
> **PostgreSQL** gestionada. Vercel despliega automáticamente en cada push a
> `main`; las migraciones se aplican solas durante el build.
>
> **Instancia actual**: <https://casa-os-mauve.vercel.app> (Vercel + Neon).

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
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | clave pública VAPID | Solo si se usan recordatorios |
| `VAPID_PRIVATE_KEY` | clave privada VAPID | Solo servidor; nunca en el cliente |
| `VAPID_SUBJECT` | `mailto:tu-correo@example.com` | Contacto VAPID |
| `CRON_SECRET` | secreto aleatorio | Compartido con GitHub Actions |
| `HOUSE_TIMEZONE` | `Europe/Madrid` | Zona para eventos de todo el día |

Genera los secretos en tu máquina:

```bash
openssl rand -base64 32                 # NEXTAUTH_SECRET y CRON_SECRET
npx web-push generate-vapid-keys        # par VAPID
```

Guarda las claves VAPID y `CRON_SECRET` en tu gestor de contraseñas. No las
escribas en documentación, commits ni logs.

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

Crea (o actualiza) la credencial inicial del seed. La contraseña está definida
en el propio seed; guárdala en el gestor de contraseñas y **cámbiala** en
`/perfil` en cuanto entres.

---

## 5. Scheduler de recordatorios (GitHub Actions)

Vercel Hobby solo permite cron una vez al día, así que los avisos se procesan
desde GitHub Actions cada 5 minutos. El workflow ya está en el repo:
`.github/workflows/recordatorios.yml`.

En GitHub, **Settings → Secrets and variables → Actions**:

1. Crea la **variable** `CASA_OS_URL` con la URL pública de producción.
2. Crea el **secreto** `CRON_SECRET` con el mismo valor que pusiste en Vercel.

El workflow llama a `POST /api/reminders/dispatch` con
`Authorization: Bearer <CRON_SECRET>`. Puedes lanzarlo manualmente desde
**Actions → Recordatorios → Run workflow** para comprobar la configuración.

> GitHub puede retrasar ejecuciones y desactiva los workflows programados tras
> 60 días sin actividad del repositorio. Si ocurre, relánzalo a mano. Si pasas a
> Vercel Pro, puedes sustituirlo por Vercel Cron cada 5 minutos.

Guía funcional y de seguridad: [`docs/recordatorios.md`](recordatorios.md).

> **Estado actual en producción (2026-10-26):** VAPID, `CRON_SECRET`,
> `HOUSE_TIMEZONE` y la variable/secreto de GitHub están configurados. El
> workflow está activo, el dispatch sin secreto devuelve `401`, el aviso de
> prueba llegó al navegador y un recordatorio real se envió una sola vez
> (`sent:1`; segunda ejecución `skipped:1`). Deployment final:
> `dpl_GLUPgBsHBLV6k7MXAP11mikGiVKr`.

## 6. Verificar

1. Abre `https://<tu-url>/api/health` → debe devolver:

   ```json
   { "status": "ok", "db": "ok", "timestamp": "..." }
   ```

   Si devuelve `503`, revisa `DATABASE_URL` y que la base esté activa.

2. Entra en `/auth/login` con la credencial inicial del seed y cámbiala en
   `/perfil`.
3. Comprueba notas (crear y guardar), familia y perfil.
4. Entra en **Calendario → Avisos**: debe mostrar el botón para activar los
   avisos. Actívalos, envía una prueba y comprueba que llega.
5. Lanza el workflow de GitHub Actions y verifica que responde `ok: true` sin
   errores. Después crea un evento con recordatorio a unos minutos y confirma
   que se recibe una sola vez.

---

## 7. Dominio propio (opcional)

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

## 8. Actualizaciones

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

- **Nunca** subas `.env` al repo; los secretos viven en Vercel y en GitHub
  Actions. La clave privada VAPID y `CRON_SECRET` no deben aparecer en
  documentación, commits ni logs.
- El repo ya envía cabeceras de seguridad (CSP, HSTS, nosniff, frame-options).
- El endpoint `/api/health` es público **a propósito**: solo revela estado, no datos.
- El escaneo de red (`npm run scan`) **no funciona en Vercel** (serverless); es una
  utilidad local.
