# Plan: Contraseñas + Face ID

## Contexto

La sección de credenciales zero-knowledge se presenta al usuario como
«Cuentas» y habla constantemente de «bóveda». El usuario la encuentra confusa
y prefiere el nombre «Contraseñas». Además, en iPhone el desbloqueo biométrico
(Face ID) dispara el prompt pero no llega a abrir la bóveda: el flujo asume
que el autenticador devuelve la extensión PRF con `enabled === true`, algo que
Safari/iOS no siempre cumple. Por último, el usuario quiere poder entrar a la
app con Face ID, no solo desbloquear la bóveda.

## Alcance (aprobado por el usuario)

1. **Renombrado visible** (sin cambiar rutas ni código interno): menú,
   títulos, botones, avisos, metadata y textos de ayuda pasan de
   «Cuentas/bóveda» a «Contraseñas». La ruta sigue siendo `/cuentas` y los
   identificadores internos (`vault`, `Vault*`) no cambian.
2. **Arreglo de Face ID en la bóveda**: aceptar la salida PRF aunque el
   autenticador no marque `enabled`; detectar soporte antes de intentar;
   fallback claro a master password sin error ruidoso en el auto-intento.
3. **Login de la app con Face ID**: permitir registrar una passkey de acceso a
   la app (independiente de la bóveda) y entrar con ella desde `/auth/login`,
   respetando 2FA y rate limits.

## Enfoque técnico

### A. Copia
- Sustituir en `src/` y tests E2E las cadenas visibles «Cuentas»/«bóveda» por
  «Contraseñas» en menú (`nav-items.ts`), página (`cuentas/page.tsx`),
  componentes `Vault*` (solo strings), API messages y docs.
- No renombrar archivos ni rutas para no romper enlaces ni E2E masivamente.

### B. Face ID en la bóveda
- `passkey.ts#prfOutput`: tomar `prf.results.first` si existe y tiene ≥ 32
  bytes; no exigir `prf.enabled === true`.
- `VaultUnlock`: no auto-intentar si `platformAuthenticatorAvailable()` es false
  o si un intento previo falló por falta de PRF; guardar esa señal en
  `sessionStorage`/estado para no repetir el prompt en la misma estancia.
- Mensajes de error más específicos («Este dispositivo no permite desbloquear
  con Face ID. Usa la master password.»).

### C. Login con Face ID
- Nuevo modelo Prisma `AppPasskey` (userId, credentialId, publicKey, counter,
  transports, createdAt) + migración.
- Endpoints:
  - `POST /api/auth/passkeys/options` (genera challenge de registro, requiere
    sesión).
  - `POST /api/auth/passkeys` (verifica registro y guarda).
  - `DELETE /api/auth/passkeys/[id]`.
  - `POST /api/auth/login/passkey/options` (challenge de autenticación por
    email o descubrimiento).
  - `POST /api/auth/login/passkey` (verifica y devuelve un token de un solo
    uso o crea sesión).
- NextAuth: añadir un `CredentialsProvider` «webauthn» que acepte un assertion
  verificado (o verificar dentro de `authorize` usando un challenge en cookie).
- UI: botón «Entrar con Face ID / huella» en `LoginForm`, registro en
  `Perfil → Seguridad`.
- 2FA: si el usuario tiene 2FA activo, el login con passkey sustituye el TOTP
  (userVerification required) igual que la bóveda.

## Dependencias y riesgos

- WebAuthn requiere HTTPS/origin correcto; en local con `localhost` funciona.
- Safari/iOS puede no soportar PRF; el login no depende de PRF (solo de
  userVerification), así que Face ID de acceso debe funcionar aunque la bóveda
  no.
- Migración nueva en Postgres; aplicar con `prisma migrate deploy`.
- Rate limits: reutilizar `isLoginRateLimited`/`recordAuthFailure`.

## Tareas previstas

Ver `tasks.md` (se crea tras aprobación del spec).

## Criterios de aceptación

- El menú y la sección se llaman «Contraseñas».
- En iPhone, si Face ID no puede desbloquear la bóveda, se muestra la master
  password sin prompt repetido ni error confuso.
- Se puede registrar y usar Face ID para entrar a la app en un navegador que
  soporte WebAuthn de plataforma.
- `npm run lint && typecheck && test && build` en verde.
