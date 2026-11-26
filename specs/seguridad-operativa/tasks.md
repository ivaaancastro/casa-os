# Tasks — Seguridad operativa (Fase 1)

- [x] T1. `src/lib/vault/webauthn.ts`: path de la cookie de challenge a `/` (S4).
- [x] T2. `src/lib/utils/sanitize-server.ts`: sanitización server-side con sanitize-html (S3).
- [x] T3. `src/app/api/notes/route.ts` y `[id]/route.ts`: sanitizar contenido antes de persistir (S3).
- [x] T4. `src/lib/two-factor-recovery.ts`: recovery codes hasheados con bcrypt (S2).
- [x] T5. Nuevo modelo `LoginAttempt` + migración; `src/lib/rate-limit.ts` DB-backed (S1).
- [x] T6. `src/lib/auth.ts`: timing seguro en `authorize` (S6).
- [x] T7. Rate limit en endpoints de passkey (opciones + registro de fallos) (S8).
- [x] T8. `src/app/api/users/[id]/route.ts`: incrementar `sessionVersion` al cambiar rol/activación (S12).
- [x] T9. `scripts/backup-db.ts`: evitar interpolación de shell (S9).
- [x] T10. `next.config.js`: documentar plan de nonce CSP (S10).
- [x] T11. `npm audit fix` (no breaking): 19 → 13 vulnerabilidades (S5).
- [x] T13. Verificación: lint ✅, typecheck ✅, test 443/443 ✅, build ✅.

### Follow-ups
- Tests de integración para rate limit DB-backed y sanitización server-side (pendiente).