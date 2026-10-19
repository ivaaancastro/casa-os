# Tasks — Despliegue en Vercel

## 1. Build y salud
1. [x] `package.json`: script `vercel-build` (`prisma migrate deploy && next build`).
2. [x] `src/app/api/health/route.ts`: `GET` sin auth, `200`/`503` según la BD.
       Excluido del middleware.

## 2. Seguridad
3. [x] `next.config.js`: cabeceras (HSTS, CSP, nosniff, frame-options, referrer,
       permissions) con CSP compatible con Next.js/TipTap.
4. [x] Verificado que la CSP no rompe login, notas/editor, familia ni perfil
       (Chrome MCP, sin errores de CSP en consola).

## 3. Configuración y documentación
5. [x] `.env.example`: pooler/directa, `NEXTAUTH_URL` en producción y cómo generar
       el secreto.
6. [x] `docs/despliegue-vercel.md`: guía paso a paso (cuenta → repo → Postgres →
       variables → deploy → verificación → dominio).
7. [x] `README`: sección de despliegue apuntando a la guía.
8. [x] `MEMORY.md` y `CHANGELOG.md` actualizados.

## 4. Verificación
9. [x] `npm run vercel-build` contra Postgres local (migra + compila).
10. [x] `/api/health` → `200` con BD arriba y `503` con BD caída (comprobado).
11. [x] Cabeceras comprobadas con `curl -I`.
12. [x] Smoke test Chrome MCP (login, notas con guardado, familia, perfil) sin
        errores de CSP en consola.
13. [x] `lint && typecheck && test && build` (107 tests).
14. [x] PR con CI en verde.
