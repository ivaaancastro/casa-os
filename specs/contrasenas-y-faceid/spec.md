# Spec: Contraseñas + Face ID

## Requisitos funcionales

### RF1 — Renombrado visible
- El ítem de navegación `/cuentas` se muestra como «Contraseñas».
- La página `/cuentas` (metadata title/description) usa «Contraseñas».
- Los encabezados, botones y avisos visibles de la sección usan «Contraseñas»
  en lugar de «Cuentas» y «bóveda».
- Los mensajes de error de la API (`No hay bóveda`, etc.) se mantienen
  internamente; solo se cambian los que el usuario ve en la UI si aplica.
- No se cambian rutas, nombres de archivos ni identificadores de código.

### RF2 — Face ID en la bóveda (iPhone)
- `prfOutput` acepta la salida PRF si `results.first` tiene ≥ 32 bytes,
  aunque `enabled` no esté presente o sea false.
- Si el autenticador no devuelve PRF, el intento se considera no disponible y
  se muestra la master password sin repetir el prompt automáticamente.
- El auto-intento solo se ejecuta una vez por montaje y solo si
  `platformAuthenticatorAvailable()` es true.
- Si un intento falla por falta de PRF, se guarda un flag en `sessionStorage`
  (`casaos_vault_prf_unsupported`) para no reintentar en la misma estancia.

### RF3 — Login con Face ID
- Un usuario puede registrar una o más passkeys de acceso a la app desde
  Perfil → Seguridad.
- Desde `/auth/login`, si el navegador soporta autenticador de plataforma, se
  muestra «Entrar con Face ID / huella».
- El login con passkey verifica userVerification y sustituye al TOTP cuando el
  usuario tiene 2FA activo.
- Rate limits y auditoría equivalentes al login por contraseña.
- Las passkeys de acceso son independientes de las passkeys de la bóveda.

## Requisitos no funcionales
- Sin cambios destructivos de BD; migración aditiva.
- Compatible con iOS Safari (HTTPS en producción, localhost en dev).
- Accesibilidad: botones con `aria-label`, foco visible.
- No se almacenan secretos en claro.

## Modelo de datos

Nuevo modelo:

```
model AppPasskey {
  id           String   @id @default(cuid())
  userId       String
  credentialId String   @unique
  publicKey    String
  counter      Int      @default(0)
  transports   String?
  createdAt    DateTime @default(now())
  lastUsedAt   DateTime?
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

Relación `User.appPasskeys AppPasskey[]`.

## API

- `POST /api/auth/passkeys/options` (sesión requerida): genera opciones de
  registro WebAuthn con `userVerification: required`, sin PRF.
- `POST /api/auth/passkeys`: verifica y guarda la credencial.
- `DELETE /api/auth/passkeys/[id]`: borra (solo propia).
- `GET /api/auth/passkeys`: lista las propias.
- `POST /api/auth/login/passkey/options`: body `{ email? }`; devuelve opciones
  de autenticación (allowCredentials si email, o descubrimiento).
- `POST /api/auth/login/passkey`: body `{ response }`; verifica y, si ok,
  devuelve un token de sesión de un solo uso o establece la cookie de NextAuth.

Integración con NextAuth: se añade un `CredentialsProvider` «webauthn» cuyo
`authorize` lee el assertion y el challenge de cookie y verifica; si válido
devuelve el usuario. El cliente llama `signIn('webauthn', { assertion, redirect:false })`.

## UI

- `LoginForm`: botón adicional «Entrar con Face ID / huella» cuando hay
  soporte; flujo de dos pasos (email opcional → prompt).
- `Perfil → Seguridad`: sección «Acceso con Face ID / huella» con lista,
  registro y borrado.
- Mensajes de error claros.

## Criterios de aceptación

- Menú y sección dicen «Contraseñas».
- En iPhone sin PRF, la bóveda no se bloquea en un bucle de prompts.
- Registro y login con Face ID funcionan en un navegador compatible.
- `lint`, `typecheck`, `test`, `build` en verde.
- Migración aplicada.