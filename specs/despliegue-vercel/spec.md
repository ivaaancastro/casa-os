# Spec — Despliegue en Vercel (fase 2)

> Feature `feat/despliegue-vercel`. Fase 2 de 2 (la fase 1, PostgreSQL, ya está
> en `main`). Estado: **pendiente de aprobación**.

## Requisitos funcionales

1. **RF1 — Build con migraciones**. `npm run vercel-build` aplica migraciones
   (`prisma migrate deploy`) y compila (`next build`). Vercel lo usa en cada
   despliegue, sin pasos manuales.
2. **RF2 — Endpoint de salud**. `GET /api/health` responde `200` con
   `{ status: "ok", db: "ok" }` comprobando la conexión a la base de datos, y
   `503` si la BD no responde. **Sin autenticación** (solo estado, sin datos).
3. **RF3 — Cabeceras de seguridad**. Todas las respuestas incluyen:
   `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`,
   `Referrer-Policy: strict-origin-when-cross-origin`,
   `Permissions-Policy` restrictiva y `Content-Security-Policy` conservadora.
   En producción, además, `Strict-Transport-Security`.
4. **RF4 — CSP compatible**. La CSP no rompe: login, notas (editor TipTap,
   autoguardado, imágenes pegadas), familia/perfil ni NextAuth.
5. **RF5 — Variables documentadas**. `.env.example` y la guía describen
   `DATABASE_URL`, `DIRECT_URL`, `NEXTAUTH_URL` y `NEXTAUTH_SECRET`, con la
   diferencia pooler/directa.
6. **RF6 — Guía de despliegue**. `docs/despliegue-vercel.md` con los pasos:
   crear cuenta, importar repo, crear Postgres, definir variables, desplegar,
   verificar y (opcional) dominio propio con DNS + HTTPS.
7. **RF7 — README**. Sección de despliegue actualizada con el camino en la nube.

## Requisitos no funcionales

- **Sin secretos en el repo**: `NEXTAUTH_SECRET` solo en Vercel/`.env` local.
- **Sin cambios de producto**: la app se comporta igual.
- **Degradación clara**: si la BD falla, `/api/health` lo dice con `503`.
- **HTTPS obligatorio** en producción (Vercel lo aporta; HSTS lo declara).

## API

### `GET /api/health`

```json
// 200
{ "status": "ok", "db": "ok", "timestamp": "2026-10-19T10:00:00.000Z" }

// 503
{ "status": "degraded", "db": "error", "timestamp": "..." }
```

## Cabeceras (next.config.js)

| Cabecera | Valor |
|---|---|
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), interest-cohort=()` |
| `Content-Security-Policy` | ver abajo |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` (solo producción) |

CSP base:

```
default-src 'self';
script-src 'self' 'unsafe-inline' [ 'unsafe-eval' solo en desarrollo ];
style-src 'self' 'unsafe-inline';
img-src 'self' data: blob:;
font-src 'self' data:;
connect-src 'self';
frame-ancestors 'none';
base-uri 'self';
form-action 'self';
object-src 'none'
```

> `'unsafe-inline'` en scripts es necesario porque Next.js inyecta scripts inline
> sin nonce. Se documenta como compromiso consciente; la alternativa (nonces vía
> middleware) obliga a renderizado dinámico y queda fuera de alcance.

## Variables de entorno

| Variable | Uso |
|---|---|
| `DATABASE_URL` | Postgres con pooler (runtime de la app) |
| `DIRECT_URL` | Postgres directo (migraciones) |
| `NEXTAUTH_URL` | URL pública HTTPS (`https://…`) |
| `NEXTAUTH_SECRET` | Secreto de firma de sesión (`openssl rand -base64 32`) |

## Criterios de aceptación

- [ ] `npm run vercel-build` funciona en local contra Postgres (migra + compila).
- [ ] `GET /api/health` → `200` con BD arriba y `503` con BD caída (comprobado).
- [ ] Cabeceras presentes en la respuesta (comprobadas con `curl -I`).
- [ ] CSP activa y **la app funciona**: smoke test Chrome MCP (login, notas con
      editor y guardado, familia, perfil) sin errores de CSP en consola.
- [ ] `.env.example` y `docs/despliegue-vercel.md` completos y coherentes.
- [ ] `lint && typecheck && test && build` en verde.
- [ ] CI del PR en verde.

## Fuera de alcance

- Ejecutar el despliegue real (requiere la cuenta de Vercel del usuario: se guía
  paso a paso).
- Dominio comprado/gestionado por el agente.
- Observabilidad avanzada, previews separadas, escaneo de red.
