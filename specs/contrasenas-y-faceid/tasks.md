# Tasks — Contraseñas + Face ID

## A. Renombrado visible
- [x] T1: `src/components/navigation/nav-items.ts` label `Cuentas` → `Contraseñas`.
- [x] T2: `src/app/cuentas/page.tsx` metadata title/description.
- [x] T3: Reemplazar cadenas visibles «Cuentas»/«bóveda» en `VaultApp`, `VaultUnlock`, `VaultWorkspace`, `VaultOnboarding`, `VaultRecovery`, `VaultSettings` por «Contraseñas» donde sea texto de UI.
- [x] T4: Ajustar E2E `tests/e2e/cuentas-movil.spec.ts` y helper `vault-setup.ts` a nuevos textos (botón «Crear contraseñas», etc.).
- [x] T5: Actualizar docs (`docs/cuentas.md` título/sección) y MEMORY/CHANGELOG al cierre.

## B. Face ID en la bóveda
- [x] T6: `passkey.ts#prfOutput` aceptar salida sin `enabled`.
- [x] T7: `VaultUnlock` no auto-intentar si no hay PRF; flag en sessionStorage.
- [x] T8: Mensajes de error específicos.
- [x] T9: Tests unitarios de `prfOutput` (si existen) actualizar.

## C. Login con Face ID
- [x] T10: Migración Prisma `AppPasskey` + relación User.
- [x] T11: Endpoints de registro/listado/borrado de AppPasskey.
- [x] T12: Endpoints de login passkey (options + verify).
- [x] T13: NextAuth CredentialsProvider «webauthn».
- [x] T14: UI en LoginForm + Perfil Seguridad.
- [x] T15: Tests API + unitarios.
- [x] T16: Verificación lint/typecheck/test/build.