# Cuentas zero-knowledge

> Estado: **activo en desarrollo local** (rama `feat/cuentas`). La sección
> cifra las credenciales del hogar en el cliente; el servidor solo guarda blobs
> cifrados y metadatos.

## Qué protege

La sección **Cuentas** (`/cuentas`) guarda credenciales de Google, correo y
servicios domésticos (nunca datos bancarios ni tarjetas). El servidor **no puede
leer el contenido**: títulos, usuarios, contraseñas, URLs y notas solo existen
en claro en el navegador del dueño.

## Estados de la sección

| Estado | Qué ve el usuario |
|---|---|
| Sin 2FA | Requisito y enlace a **Perfil → Seguridad**. |
| Sin bóveda | Asistente de creación (master password → kit → passkey opcional). |
| Bloqueada | Master password + código TOTP (o de recuperación) + passkey si existe. |
| Abierta | Lista, búsqueda, filtros, detalle, compartir, ajustes y auditoría. |
| Grant caducado | Aviso y vuelve a desbloqueo sin perder la lista. |

## Flujos clave

1. **Onboarding**: master password (mínimo 12 caracteres) → kit de recuperación
   offline (obligatorio, con confirmación explícita de haberlo guardado) →
   passkey opcional con WebAuthn PRF.
2. **Desbloqueo**: master password + TOTP, o passkey con PRF + TOTP. Rate limit
   5 intentos / 15 min.
3. **Recuperación**: kit offline o contacto de confianza → nueva master password.
   El reset emite un **nuevo kit**; el anterior queda invalidado.
4. **Compartir**: `Solo yo`, `Toda la familia` (por defecto) o `Personas
   concretas`. Al guardar se **rota la DEK** y se re-cifra el contenido. Los
   miembros nuevos no reciben cuentas `FAMILY` antiguas: la UI avisa y el dueño
   vuelve a compartir.

## API

Todas las rutas de `/api/cuentas/*` exigen sesión válida. Las de contenido
(`accounts`, `members`, `events`, compartir, kit con escritura) exigen además el
grant de bóveda de 15 min; `status` y `unlock` pueden operar sin grant.

| Método | Ruta | Función |
|---|---|---|
| `GET` | `/api/cuentas/status` | 2FA, bóveda, passkeys, recuperación, grant |
| `POST` | `/api/cuentas/vault` | Crea bóveda |
| `DELETE` | `/api/cuentas/vault` | Borra bóveda, kit, passkeys, contactos y eventos |
| `POST` | `/api/cuentas/unlock` | Desbloquea con master password + TOTP |
| `POST` | `/api/cuentas/unlock/passkey` | Desbloquea con passkey (PRF) + TOTP |
| `POST` | `/api/cuentas/lock` | Borra el grant |
| `GET` | `/api/cuentas/accounts` | Lista de ciphertexts + DEK propia + destinatarios |
| `POST` | `/api/cuentas/accounts` | Crea cuenta cifrada |
| `PATCH` | `/api/cuentas/accounts/[id]` | Edita con control de `revision` (`409` si cambió) |
| `DELETE` | `/api/cuentas/accounts/[id]` | Borra cuenta |
| `PUT` | `/api/cuentas/accounts/[id]/keys` | Reemplaza destinatarios y puede rotar la DEK |
| `GET` | `/api/cuentas/members` | Miembros activos con `pk` y si tienen bóveda |
| `PUT` | `/api/cuentas/vault/keyring` | Cambia master password |
| `PUT` | `/api/cuentas/recovery` | Crea/rotar kit |
| `GET` | `/api/cuentas/recovery` | Recupera keyring cifrado (sin grant) |
| `POST` | `/api/cuentas/recovery/reset` | Recupera con kit o contacto + nueva master password |
| `GET/POST` | `/api/cuentas/passkeys` | Lista/registra passkey con PRF |
| `DELETE` | `/api/cuentas/passkeys/[id]` | Borra passkey |
| `GET/POST` | `/api/cuentas/trusted-contacts` | Lista/invita contactos |
| `POST` | `/api/cuentas/trusted-contacts/[id]/accept` | Acepta invitación |
| `DELETE` | `/api/cuentas/trusted-contacts/[id]` | Revoca contacto |
| `POST` | `/api/cuentas/trusted-contacts/[id]/reveal` | Entrega el código de ayuda (auditado) |
| `GET` | `/api/cuentas/events` | Auditoría propia |

## Cifrografía

- **Argon2id** (ops 3, 64 MiB, sal 16 B) sobre la master password.
- **Doble derivación** con `crypto_kdf`: `kek` y `authKey` por contexto
  (`casaosKE`, `casaosAU`, `casaosPK`).
- **XChaCha20-Poly1305** para keyring y contenido de cada cuenta.
- **X25519 + `crypto_box_seal`** para envolver DEKs por destinatario.
- El servidor guarda `authHash` (bcrypt del `authKey`), `pk`, keyring cifrado y
  nonce; **nunca** claves ni contenido en claro.

## Modelo de amenazas

- **Servidor comprometido**: no puede descifrar ni leer los blobs; no puede
  regenerar claves sin la master password o el kit.
- **Base de datos filtrada**: los blobs son inútiles sin la master password o el
  kit del propietario.
- **Cliente comprometido**: la bóveda desbloqueada deja claves en memoria; se
  mitiga con CSP, auto-lock y borrado best-effort.
- **ADMIN**: no tiene acceso especial a bóvedas ajenas ni a DEKs.

## Limitaciones conocidas

- Revocación imperfecta: no se puede borrar lo que un destinatario ya copió.
- Passkey solo con PRF; sin soporte de PRF en el dispositivo se usa la master
  password.
- Recuperación: sin kit y sin contacto de confianza, perder la master password es
  irrecuperable.
- Borrado de memoria del navegador: best-effort.
