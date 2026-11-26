# Spec — Seguridad operativa (Fase 1)

## Requisitos funcionales

1. **RF1 — Rate limit de login efectivo en serverless:** el bloqueo por email debe
   persistir entre instancias. Mover el contador a la base de datos (o reutilizar
   `isLoginRateLimited`), manteniendo `AUTH_FAILURE_LIMIT` (5) y ventana 15 min.
2. **RF2 — Sanitización server-side de notas:** `POST` y `PATCH /api/notes`
   deben sanitizar el contenido HTML antes de persistir, usando una allowlist
   equivalente a la del cliente. El cliente sigue saneando para UX.
3. **RF3 — Recovery codes con hashing fuerte:** hashear con bcrypt (coste 10) en
   vez de SHA-256. Los códigos existentes se invalidan; el usuario debe
   regenerarlos (se documenta).
4. **RF4 — Cookie de passkey corregida:** `setChallengeCookie` debe usar
   `path: '/'` para que el login con passkey funcione.
5. **RF5 — Timing seguro en login:** ejecutar bcrypt sobre un hash dummy cuando
   el usuario no existe para evitar enumeración por timing.
6. **RF6 — Token de passkey single-use o ventana corta:** invalidar el token tras
   su uso (jti en BD o cache en memoria con TTL) o reducir la ventana a 30 s.
   Añadir rate limit a endpoints de passkey (login y registro).
7. **RF7 — Validación de DATABASE_URL en backup:** usar `execFile` o validar la
   URL antes de interpolar en shell.
8. **RF8 — sessionVersion al cambiar rol/activación:** incrementar
   `sessionVersion` en `PUT/PATCH /api/users/[id]` al cambiar rol o `active`.
9. **RF9 — Dependencias:** aplicar `npm audit fix` (no breaking) y abrir issue/PR
   dedicado para las breaking (zod 4, next 16, vitest 5).
10. **RF10 — CSP documentada:** añadir comentario en `next.config.js` sobre el
    plan de nonce para scripts (sin implementar ahora).

## Requisitos no funcionales

- Sin cambios en el modelo de datos de la bóveda (zero-knowledge intacto).
- Tests existentes deben seguir pasando; añadir tests para rate limit y
  sanitización.
- Lint, typecheck, build en verde.

## Criterios de aceptación

- [ ] Bloqueo por email persiste entre instancias (test con dos llamadas).
- [ ] Notas con HTML malicioso se sanea en el servidor (test).
- [ ] Recovery codes usan bcrypt (verificar hash).
- [ ] Login con passkey funciona end-to-end (manual o E2E).
- [ ] No hay enumeración por timing (o documentado como mitigado).
- [ ] Endpoints de passkey tienen rate limit.
- [ ] `npm audit` sin critical/high en dependencias de producción (tras audit fix).
- [ ] lint/typecheck/test/build en verde.

## Fuera de alcance

- Rotación de `NEXTAUTH_SECRET`.
- Implementación de nonce en CSP (futuro).
- Cambio de coste de bcrypt (mantener 12).