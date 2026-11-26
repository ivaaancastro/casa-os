# Plan — Seguridad operativa (Fase 1)

## Contexto

La auditoría total (`specs/auditoria-total/auditoria.md`, §4.1 y Fase 1)
identificó brechas de seguridad operativa: rate limit de login en memoria,
sanitización de notas solo en cliente, recovery codes con SHA-256 rápido,
cookie de passkey con path incorrecto, sin rate limit en passkey, enumeración
por timing, dependencias vulnerables y CSP documentada.

## Objetivo

Cerrar las brechas de seguridad reales sin cambiar el modelo de datos ni la
arquitectura de la bóveda zero-knowledge.

## Enfoque técnico

- Rate limit de login: mover el contador por email a la base de datos (o
  reutilizar `isLoginRateLimited`), manteniendo la API existente.
- Sanitización server-side de notas: añadir `sanitize-html` (o isomorphic
  DOMPurify) en POST/PATCH de notas; mantener el cliente como UX.
- Recovery codes: hashear con bcrypt/argon2 (coste moderado) en vez de SHA-256.
- Cookie de passkey: corregir path a `/`.
- Igualar timing en `authorize` (bcrypt sobre hash dummy si no existe el usuario).
- Token de passkey single-use (jti) o acortar ventana + rate limit en endpoints.
- Validar `DATABASE_URL` en `backup-db.ts` (usar `execFile`).
- Incrementar `sessionVersion` al cambiar rol/activación en `users/[id]`.
- Dependencias: `npm audit fix` (no breaking); PR dedicado para breaking.
- Documentar CSP y evaluar nonce (futuro, no bloqueante).

## Dependencias

- Fase 0 cerrada (hecho).
- Sin cambios de BD excepto rate limit (puede reutilizar tabla existente o
  añadir contador).

## Riesgos

- Medio: cambiar hashing de recovery codes invalida códigos existentes (requiere
  regenerar o migrar). Se documentará.
- Medio: sanitización server-side puede alterar contenido con estilos no
  permitidos; mantener allowlist actual.
- Bajo: rate limit en BD añade latencia al login (aceptable).

## Archivos a modificar (estimado)

- `src/lib/rate-limit.ts`, `src/lib/auth.ts`
- `src/lib/two-factor-recovery.ts`
- `src/lib/utils/sanitize.ts`, `src/app/api/notes/route.ts`, `src/app/api/notes/[id]/route.ts`
- `src/lib/vault/webauthn.ts`, `src/app/api/auth/login/passkey/*`, `src/app/api/auth/passkeys/*`
- `src/app/api/users/[id]/route.ts`
- `scripts/backup-db.ts`
- `next.config.js` (documentación)
- `package.json` (audit fix)