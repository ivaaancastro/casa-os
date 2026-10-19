# Plan — Despliegue en Vercel (fase 2)

## Contexto

La base de datos ya está en PostgreSQL (fase 1, `feat/postgres`). Ahora publicamos
la app en la nube para acceder desde cualquier sitio sin hardware en casa.

**Reparto de trabajo**: el usuario ha pedido que se le **guíe paso a paso**. El
agente prepara y verifica todo lo que puede en local (configuración del build,
cabeceras, endpoint de salud, documentación) y el usuario ejecuta los pasos que
requieren su cuenta de Vercel (importar repo, crear Postgres, definir variables,
desplegar, dominio).

## Enfoque técnico

- **Build en Vercel**: script `vercel-build` = `prisma migrate deploy && next build`.
  Así las migraciones se aplican en cada despliegue sin pasos manuales.
  (`prisma generate` ya corre en `postinstall`.)
- **PostgreSQL gestionado**: se recomienda el Postgres de Vercel (respaldado por
  Neon) o Neon directamente. `DATABASE_URL` = URL **con pooler**;
  `DIRECT_URL` = URL **directa** (para migraciones).
- **Variables de entorno** (documentadas): `DATABASE_URL`, `DIRECT_URL`,
  `NEXTAUTH_URL` (dominio HTTPS), `NEXTAUTH_SECRET`.
- **Cabeceras de seguridad** en `next.config.js`: HSTS, `X-Content-Type-Options`,
  `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy` y una **CSP**
  conservadora (compatible con Next.js/TipTap/NextAuth).
- **Endpoint de salud** `GET /api/health` (sin auth) para monitorización.
- **Dominio + HTTPS**: certificado automático de Vercel; guía de DNS.
- **Documentación**: `docs/despliegue-vercel.md` (guía paso a paso) + README.

## Dependencias

- [ ] Cuenta de Vercel (la crea el usuario).
- [ ] (Opcional) Dominio propio.
- [x] PostgreSQL local (Docker) para verificar en local.

## Riesgos

| Riesgo | Prob | Impacto | Mitigación |
|--------|------|---------|------------|
| La CSP rompe la UI/editor | Media | Alto | Verificar con Chrome MCP; relajar directivas si hace falta |
| Pooler de conexiones en serverless | Media | Medio | `DIRECT_URL` para migraciones; documentar `?pgbouncer=true` |
| Secretos filtrados | Baja | Alto | Nunca en el repo; solo variables de entorno de Vercel |
| Migración en build falla | Baja | Alto | `migrate deploy` probado en local y en CI |
| Dominio/DNS tarda en propagar | Media | Bajo | Documentar; verificar con `dig`/navegador |

## Fuera de alcance

- Observabilidad/monitorización avanzada, múltiples entornos (preview/prod
  separadas), CI/CD propio (Vercel ya despliega en cada push).
- El escaneo de red (no funciona en serverless).
- Cambios de producto en la app.
