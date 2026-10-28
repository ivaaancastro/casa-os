# Plan — Cuentas zero-knowledge

**Feature:** `cuentas`
**Rama:** `feat/cuentas`
**Depende de:** auth NextAuth, usuarios/roles, perfil y 2FA (cerradas).
**Sustituye a:** `gestor-contrasenas` / `gestor-contrasenas-ui` (descartados).
**Estado:** plan y spec pendientes de aprobación del usuario.

> **Nada de este documento está implementado todavía.** No hay tablas, rutas ni
> componentes de Cuentas en el repositorio. La UI antigua de contraseñas nunca
> existió y no se reutiliza.

## Contexto

casa-os guarda dispositivos, notas, calendario y avisos. Falta el dato más
sensible del hogar: las credenciales de Google, correo y servicios domésticos.
El intento anterior (`/api/passwords` + `User.encryptedPasswords`) cifraba en el
servidor con `TOTP_ENCRYPTION_KEY`: el servidor podía descifrar todo. Se
descartó por no ser zero-knowledge.

Cuentas se diseñará al revés: **el cifrado y el descifrado ocurren en el
navegador**. El servidor almacena blobs opacos y metadatos mínimos. Ni el
operador de la base de datos, ni un ADMIN de la app, ni el propio agente pueden
leer nombres, usuarios, contraseñas, URLs o notas.

La sección se llama **Cuentas** y vive en `/cuentas`.

## Objetivo

Que un miembro de la familia pueda:

1. Crear una bóveda personal protegida por una master password.
2. Desbloquearla solo con 2FA activo y un código TOTP vigente.
3. Guardar, editar, copiar y borrar cuentas sin que el servidor vea el contenido.
4. Compartir una cuenta con toda la familia o con personas concretas.
5. Recuperar el acceso con un kit offline o un contacto de confianza.
6. Desbloquear con passkey (WebAuthn PRF) cuando el dispositivo lo soporte.

## Decisiones de diseño

| # | Decisión | Motivo |
|---|---|---|
| 1 | Cifrado en cliente con **libsodium-wrappers** | XChaCha20-Poly1305, X25519 y Argon2id en un solo paquete auditado, sin criptografía casera |
| 2 | **Argon2id** (ops 3, 64 MiB, sal 16 B) para la master password | Resistente a GPU; parámetros guardados por bóveda para poder subirlos después |
| 3 | **Doble derivación** con `crypto_kdf`: `kek` y `authKey` | El servidor recibe `authKey` (verificador) y nunca puede derivar `kek` |
| 4 | **Keyring X25519** ({`sk`, `pk`}) cifrado con `kek` | Cambiar la master password solo re-cifra el keyring, no las cuentas |
| 5 | **DEK por cuenta**, envuelta con `crypto_box_seal` a cada destinatario | Compartir y revocar sin re-cifrar todo el contenido salvo al rotar; sin claves intermedias sin uso |
| 6 | **Metadatos mínimos** en servidor | Sin títulos, usuarios, URLs ni categorías en claro |
| 7 | **2FA obligatorio + TOTP en cada desbloqueo** | Un JWT robado no basta para abrir la bóveda |
| 8 | **Grant de bóveda** de 15 min en cookie HttpOnly firmada | Evita pedir TOTP en cada request sin dejar los ciphertexts abiertos |
| 9 | **Passkey solo para desbloquear**, no para login | El usuario ya está autenticado; PRF desenvuelve el keyring. Login con passkey queda para después |
| 10 | **Sin PRF no hay passkey** | No se simula biometría ni se guarda una clave sin proteger |
| 11 | **Visibilidad como preset**, destinatarios como verdad | `Toda la familia` es una foto del momento; los miembros nuevos no heredan acceso |
| 12 | **Recuperación offline + contacto de confianza** | Sin recuperación, olvidar la master password significa perder todo |
| 13 | **Sin backdoor de ADMIN** | Un ADMIN puede resetear el 2FA de login, pero no descifrar ni borrar bóvedas ajenas |
| 14 | **Rotar DEK al revocar** | Quitar un destinatario sin rotar no revoca lo ya visto |

## Modelo criptográfico

### Claves

| Clave | Tamaño | Dónde vive | Quién la ve |
|---|---|---|---|
| `MK` (master key) | 32 B | Memoria del navegador, derivada | Solo el cliente |
| `kek` | 32 B | Derivada de `MK` (`crypto_kdf`, contexto `casaosKE`) | Solo el cliente |
| `authKey` | 32 B | Derivada de `MK` (contexto `casaosAU`); el servidor guarda `bcrypt(authKey)` | Cliente y servidor (nunca `MK`) |
| `sk`/`pk` (X25519) | 32 B c/u | Par de identidad; `sk` dentro del keyring, `pk` público | `pk` la ve el servidor |
| `DEK` | 32 B | Envolvida por cuenta y destinatario con `crypto_box_seal` | Destinatarios |
| `recoveryKey` | 32 B | Kit descargado por el usuario; nunca en el servidor | Usuario |

### Derivación

```
master password ──Argon2id(sal, ops, mem)──► MK (32 B)
MK ──crypto_kdf("casaosKE", 1)──► kek
MK ──crypto_kdf("casaosAU", 2)──► authKey ──bcrypt──► servidor
```

`crypto_kdf` es BLAKE2b con contexto de 8 bytes; no se implementa HKDF a mano.

### Keyring

```json
{ "sk": "<32 B>", "pk": "<32 B>", "version": 1 }
```

- Se serializa y se cifra con **XChaCha20-Poly1305** usando `kek` y un nonce
  aleatorio de 24 B.
- El servidor guarda `wrappedKeyring`, `keyringNonce`, `kdfSalt`, parámetros y
  `pk` en claro.
- Al desbloquear, el cliente recibe el keyring, deriva `kek` y lo descifra en
  memoria. La clave privada `sk` **nunca** se envía.
- No hay clave intermedia: la `sk` es la única que el usuario necesita para
  abrir las DEKs envueltas a su `pk`.

### Cuenta

```json
{
  "title": "Google",
  "username": "ivan@example.com",
  "password": "…",
  "url": "https://accounts.google.com",
  "notes": "…",
  "category": "Correo",
  "customFields": []
}
```

- Se serializa y se cifra con **XChaCha20-Poly1305** usando la `DEK` de la
  cuenta (nonce 24 B).
- La `DEK` se envuelve para cada destinatario con
  `crypto_box_seal(DEK, pkDestinatario)`. El dueño siempre es destinatario.
- `crypto_box_seal` es anónimo: el servidor no puede relacionar la clave
  envuelta con un remitente, solo con el destinatario.

### Compartir y revocar

| Acción | Qué hace el cliente | Qué guarda el servidor |
|---|---|---|
| Compartir con alguien | Envuelve la `DEK` con su `pk` | Fila `VaultAccountKey` |
| Cambiar a «Toda la familia» | Envuelve para todos los miembros activos **con bóveda** en ese momento | Conjunto de filas + `visibility` |
| Revocar a alguien | Quita su fila, genera **nueva DEK**, re-cifra el contenido y re-envuelve para los que quedan | Contenido nuevo + filas nuevas, en una transacción |
| Editar contenido | Re-cifra con la `DEK` que ya tiene | Ciphertext + `revision` |

La revocación **no puede desaprender** lo que el destinatario ya descifró. Se
documenta: revocar sirve para cortar el acceso futuro, no para recuperar
secretos ya vistos. Por eso se rota la `DEK`.

### Recuperación

**Kit offline (siempre disponible al crear la bóveda)**

```
recoveryKey (32 B) ──Argon2id(sal propia)──► recoveryKek
keyring ──XChaCha20-Poly1305(recoveryKek)──► recoveryBlob (servidor)
```

- Se muestra una sola vez como código Crockford base32 con checksum y se puede
  descargar en un `.txt`.
- El servidor guarda el blob; sin el código es inútil.

**Contacto de confianza (opcional)**

1. El dueño elige a otro miembro con bóveda y envía una invitación.
2. El contacto acepta; el dueño entrega la `recoveryKey` actual envuelta con la
   `pk` del contacto (`crypto_box_seal`). El servidor guarda solo esa copia
   cifrada y no puede abrirla.
3. Para ayudar, el contacto abre su propia bóveda, pulsa **Ayudar a recuperar**
   y descifra la copia con su `sk`. Obtiene el código de recuperación del dueño
   y se lo entrega en persona. Cada consulta se audita.
4. El dueño usa el flujo normal de recuperación: TOTP + código + nueva master
   password. El cliente re-envuelve el keyring y actualiza sal, `authHash` y
   blobs.
5. La operación invalida grants y passkeys. El kit y el contacto siguen
   apuntando al mismo keyring, así que no hay que rotarlos.

Al rotar el kit, las copias de los contactos quedan obsoletas (`STALE`) hasta
que el dueño las renueve; la UI lo avisa.

**Límite explícito:** el contacto no puede leer la bóveda por su cuenta (tiene
la clave de recuperación, no el blob cifrado del dueño), pero **sí puede
ayudar** a alguien que se haga pasar por el dueño. Se avisa antes de activarlo y
se audita cada consulta. Revocar el contacto y **rotar el kit** invalida su
copia. Si no hay kit ni contacto, perder la master password es irreversible.

### Passkey con PRF

- Registro con `navigator.credentials.create` y extensión
  `prf.eval.first = prfSalt` (32 B aleatorios por passkey).
- Si `getClientExtensionResults().prf.enabled !== true`, **no se registra** y se
  explica que el dispositivo no soporta desbloqueo con passkey.
- La clave que envuelve el keyring es `crypto_kdf(prfOutput, "casaosPK", 1)`.
- Desbloqueo: `navigator.credentials.get` con el mismo `prfSalt`, verificación
  de la aserción en servidor y descifrado local. **Siempre** se pide además el
  código TOTP.
- Sin passkey, se usa la master password. Nunca se muestra un botón biométrico
  que no pueda funcionar.

## Arquitectura

```
Navegador                                   Servidor (Next.js)
─────────────────────────────────────────   ───────────────────────────────
master password → MK → kek/authKey          POST /api/cuentas/unlock
  │                                           ├─ rate limit
  ├─ descifra keyring (XChaCha20)             ├─ bcrypt(authKey)
  ├─ descifra cuentas (DEK)                   ├─ TOTP obligatorio
  └─ envuelve/desenvuelve DEKs                └─ cookie grant 15 min
                                            GET /api/cuentas/accounts
                                              └─ devuelve ciphertext + DEKs
Prisma/PostgreSQL: blobs, sal, params, pk, metadatos
```

- Toda la criptografía de usuario vive en `src/lib/vault/crypto.ts`, marcado
  `'use client'` en los puntos de uso. En el servidor solo se usa Node
  `crypto` para HMAC del grant y bcrypt del verificador.
- `libsodium-wrappers` carga WASM: la CSP debe añadir `'wasm-unsafe-eval'` a
  `script-src`. Sin eso, el navegador bloquea la librería. Se valida en el
  build de producción.
- Las respuestas de `/api/cuentas/*` llevan `Cache-Control: no-store`.
- El service worker **no** cachea `/cuentas` ni sus APIs.

## Modelo de datos (migración aditiva)

```prisma
model Vault {
  id             String   @id @default(cuid())
  userId         String   @unique
  kdfSalt        String
  kdfOpsLimit    Int
  kdfMemLimit    Int
  kdfAlgorithm   String   @default("argon2id13")
  authHash       String
  publicKey      String
  wrappedKeyring String
  keyringNonce   String
  keyringVersion Int      @default(1)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}

model VaultAccount {
  id         String   @id @default(cuid())
  ownerId    String
  visibility String   @default("FAMILY") // PRIVATE | FAMILY | CUSTOM
  ciphertext String
  nonce      String
  revision   Int      @default(1)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  @@index([ownerId])
}

model VaultAccountKey {
  id         String   @id @default(cuid())
  accountId  String
  userId     String
  wrappedDek String
  canEdit    Boolean  @default(false)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  @@unique([accountId, userId])
  @@index([userId])
}

model VaultRecovery {
  id             String   @id @default(cuid())
  userId         String   @unique
  kdfSalt        String
  kdfOpsLimit    Int
  kdfMemLimit    Int
  wrappedKeyring String
  nonce          String
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}

model VaultPasskey {
  id             String    @id @default(cuid())
  userId         String
  credentialId   String    @unique
  publicKey      String
  counter        Int       @default(0)
  transports     String?
  prfSalt        String
  wrappedKeyring String
  nonce          String
  createdAt      DateTime  @default(now())
  lastUsedAt     DateTime?
  @@index([userId])
}

model VaultRecoveryShare {
  id                String    @id @default(cuid())
  ownerId           String
  contactId         String
  wrappedRecoveryKey String
  status            String    @default("PENDING") // PENDING | ACCEPTED | STALE | REVOKED
  createdAt         DateTime  @default(now())
  acceptedAt        DateTime?
  @@unique([ownerId, contactId])
}

model VaultEvent {
  id        String   @id @default(cuid())
  userId    String
  actorId   String?
  action    String
  targetId  String?
  ipHash    String?
  createdAt DateTime @default(now())
  @@index([userId, createdAt])
}
```

- Todas las tablas son nuevas; no se toca el esquema existente.
- `onDelete: Cascade` de `Vault*` hacia `User` (una cuenta borrada no deja
  blobs huérfanos).
- `User` gana relaciones inversas. La migración es aditiva y se aplica con
  `prisma migrate deploy`.
- **No** se reutiliza `User.encryptedPasswords`; se retirará al cerrar Cuentas
  junto con `/api/passwords`.

## API

Todas las rutas exigen sesión válida (`getSessionUser`). Salvo `status` y
`unlock`, exigen cookie de grant.

| Método | Ruta | Quién | Qué hace |
|---|---|---|---|
| `GET` | `/api/cuentas/status` | Autenticado | 2FA, bóveda, passkeys, recuperación y grant activo |
| `POST` | `/api/cuentas/vault` | Autenticado + 2FA | Crea bóveda (sal, params, `authKey`, `pk`, keyring, kit) |
| `POST` | `/api/cuentas/unlock` | Autenticado | Verifica TOTP + `authKey`, devuelve keyring y grant |
| `POST` | `/api/cuentas/unlock/passkey` | Autenticado | Verifica aserción + TOTP, devuelve keyring y grant |
| `POST` | `/api/cuentas/lock` | Autenticado | Borra la cookie de grant |
| `GET` | `/api/cuentas/accounts` | Grant | Lista ciphertext + DEK envuelta propia + destinatarios |
| `POST` | `/api/cuentas/accounts` | Grant | Crea cuenta con DEKs envueltas |
| `PATCH` | `/api/cuentas/accounts/[id]` | Grant + dueño o `canEdit` | Actualiza contenido con control de `revision` |
| `DELETE` | `/api/cuentas/accounts/[id]` | Grant + dueño | Borra cuenta y sus claves |
| `PUT` | `/api/cuentas/accounts/[id]/keys` | Grant + dueño | Reemplaza destinatarios; puede rotar DEK y contenido |
| `GET` | `/api/cuentas/members` | Grant | Miembros activos con `pk` y si tienen bóveda |
| `PUT` | `/api/cuentas/vault/keyring` | Grant | Cambia master password (nueva sal, `authHash`, keyring) |
| `PUT` | `/api/cuentas/recovery` | Grant | Crea o rota el kit offline |
| `POST` | `/api/cuentas/recovery/reset` | Autenticado + TOTP | Recupera con kit o contacto y fija nueva master password |
| `GET/POST` | `/api/cuentas/passkeys` | Grant | Lista/registra passkey con PRF |
| `DELETE` | `/api/cuentas/passkeys/[id]` | Grant | Borra passkey |
| `GET/POST` | `/api/cuentas/trusted-contacts` | Grant | Lista/invita contactos |
| `POST` | `/api/cuentas/trusted-contacts/[id]/accept` | Grant | Acepta invitación |
| `DELETE` | `/api/cuentas/trusted-contacts/[id]` | Grant | Revoca contacto |
| `POST` | `/api/cuentas/trusted-contacts/[id]/reveal` | Grant | El contacto obtiene el código de ayuda (auditado) |
| `GET` | `/api/cuentas/events` | Grant | Auditoría propia |

### Contrato de `unlock`

```jsonc
// request
{ "authKey": "<base64 32 B>", "code": "123456", "remember": false }
// 200
{
  "wrappedKeyring": "…",
  "keyringNonce": "…",
  "kdfSalt": "…",
  "kdfOpsLimit": 3,
  "kdfMemLimit": 67108864,
  "publicKey": "…"
}
// 401 credenciales, 403 2FA desactivado, 429 rate limit
```

La cookie `casaos_vault` se emite en la misma respuesta:
`base64url(payload).HMAC-SHA256(NEXTAUTH_SECRET)`, con `sub`, `sv` y `exp`
(15 min). `HttpOnly`, `Secure` en producción, `SameSite=Lax`,
`Path=/api/cuentas`.

### Validación y límites

- Zod en todas las rutas: base64 válido, longitudes exactas, `revision` entero,
  ciphertext ≤ 64 KB, `kdfOpsLimit` 1–10, `kdfMemLimit` 16–512 MiB.
- Rate limit: 5 desbloqueos fallidos / 15 min por usuario (incluye passkey);
  3 recuperaciones / hora; se registra `RATE_LIMITED`.
- `409` si `revision` no coincide (edición concurrente).
- `403` si el usuario no es destinatario o no tiene `canEdit`.
- Un ADMIN **no** tiene privilegios sobre bóvedas ajenas.

## UI

- `/cuentas` con un único componente cliente que gestiona estados:
  `sin-2fa` → `sin-boveda` → `bloqueada` → `abierta`.
- **Sin 2FA**: tarjeta explicativa con enlace a `/perfil` → Seguridad.
- **Onboarding**: requisitos, master password (medidor de fortaleza, mínimo 12
  caracteres, confirmación), descarga obligatoria del kit, passkey opcional,
  resumen de límites.
- **Desbloqueo**: master password + código TOTP; botón de passkey solo si hay
  una registrada y PRF confirmado; enlace a recuperación.
- **Lista**: búsqueda local, filtro por categoría y visibilidad, tarjetas con
  título, usuario, badge de visibilidad y acciones copiar/editar.
- **Detalle/edición**: campos, generador de contraseñas, revelar/copiar,
  guardar con detección de conflicto.
- **Compartir**: radio `Solo yo` / `Toda la familia` / `Personas concretas`,
  lista de miembros con `canEdit`, aviso de miembros nuevos sin acceso.
- **Ajustes**: cambiar master password, rotar kit, passkeys, contactos de
  confianza, auditoría y borrar bóveda.
- **Bloqueo**: manual, por inactividad (5 min por defecto, configurable 1–15) y
  al cerrar sesión. La clave privada se descarta de memoria (best-effort con
  `memzero`).
- Mobile-first a 390 px y escritorio editorial (Bodoni + Jost, radios 0), sin
  romper el lenguaje visual existente.

## Dependencias

Ya aprobadas por el usuario:

- `libsodium-wrappers` (+ `@types/libsodium-wrappers` si el paquete no trae
  tipos; verificar al instalar).
- `@simplewebauthn/server` y `@simplewebauthn/browser`.

No se añaden más dependencias. El código de recuperación base32 y el medidor de
fortaleza se implementan en el repo con tests.

## Riesgos

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| Error criptográfico (nonce reutilizado, clave mal derivada) | Media | Crítico | Funciones pequeñas, tests con vectores, revisión manual, sin criptografía casera |
| XSS roba la clave privada mientras la bóveda está desbloqueada | Baja | Crítico | CSP estricta, sin scripts de terceros, auto-lock, `no-store`, DOMPurify donde ya se usa |
| Servidor malicioso sirve JS alterado | Muy baja | Crítico | Documentado; SRI/autoalojamiento como follow-up. El modelo no protege contra un servidor que controla el código |
| Pérdida de master password y kit | Media | Alto | Onboarding obliga a descargar el kit; contacto de confianza opcional; aviso explícito |
| Contacto de confianza ayuda a un impostor | Media | Alto | Opt-in, aviso claro, auditoría, revocación + rotación del kit |
| Miembros nuevos sin acceso a cuentas antiguas | Alta | Medio | Aviso en la UI y acción «volver a compartir» |
| Revocación imperfecta | Alta | Medio | Rotar `DEK` al revocar; documentar que lo ya visto no se puede borrar |
| WASM bloqueado por CSP | Media | Alto | `'wasm-unsafe-eval'` y verificación en producción |
| Passkey sin PRF en algunos navegadores | Alta | Medio | Detección real; si no hay PRF, no se registra y se explica |
| Pérdida de `NEXTAUTH_SECRET` | Baja | Alto | Invalida grants (no bóvedas); documentado en despliegue |
| Migración aditiva falla en Neon | Baja | Alto | Migración solo `CREATE TABLE`; probar en base temporal antes del merge |

## Fases

1. **Cripto y datos**: `src/lib/vault/*`, migración, tests unitarios, CSP WASM.
2. **Bóveda**: crear, desbloquear, bloquear, grant, 2FA, kit offline, ajustes.
3. **Cuentas y sharing**: CRUD, visibilidad, destinatarios, rotación, auditoría.
4. **Passkey PRF**: registro, desbloqueo, borrado.
5. **Contacto de confianza**: invitación, aceptación, ayuda, revocación.
6. **Cierre**: docs, retirada del prototipo, verificación en producción.

Cada fase se mergea en la misma rama/PR de la feature, no en `main` por
separado. La feature no se cierra hasta completar el protocolo de
[`docs/cierre-feature.md`](../docs/cierre-feature.md).

## Fuera de alcance (v1)

- Login con passkey (solo desbloqueo de bóveda).
- Importación desde navegadores u otros gestores.
- Extensión de navegador y autofill.
- Adjuntos, imágenes o archivos dentro de una cuenta.
- Búsqueda en servidor (imposible sin descifrar).
- Datos bancarios o tarjetas.
- Compartir con gente fuera de casa-os.
- Rotación automática de claves o recuperación sin kit/contacto.
- App móvil nativa.

## Criterios de "hecho"

1. Ninguna ruta, tabla o log del servidor contiene contenido en claro.
2. Crear, desbloquear, editar, compartir, revocar y recuperar funcionan con
   tests de cripto y de permisos.
3. Un usuario sin 2FA no puede abrir la bóveda; uno sin grant recibe `401/403`.
4. La UI se verifica en Chromium (escritorio y 390 px) y en producción.
5. `lint`, `typecheck`, `test`, `build` y `docs:check` pasan.
6. El prototipo `/api/passwords` y `User.encryptedPasswords` se retiran al
   cerrar la feature.
