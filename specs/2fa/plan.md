# Plan — Autenticación en dos pasos (2FA)

**Feature:** `2fa`
**Rama:** `feat/2fa`
**Depende de:** auth NextAuth, usuarios/roles y perfil (cerradas).
**Bloquea:** `feat/cuentas` (la bóveda de cuentas exigirá 2FA).

> **Estado:** plan y spec aprobados (2026-10-26) e implementados. Cierre:
> [`cierre.md`](cierre.md) (2026-10-28).

## Contexto

Hoy el acceso a casa-os usa solo email y contraseña. La siguiente feature,
`cuentas`, guardará credenciales críticas de Google, correo y otros servicios.
La bóveda se diseñará con cifrado **zero-knowledge** en el cliente, así que el
servidor no podrá descifrar su contenido; aun así, el login sigue siendo la
puerta de entrada a la cuenta y a los ciphertexts. Un segundo factor real añade
una capa imprescindible de defensa en profundidad antes de abrir esa sección.

La app ya tiene NextAuth con credenciales, roles `ADMIN`/`FAMILY`, perfil propio
y gestión de usuarios. No hay 2FA, passkeys ni sesiones revocables. Este plan
añade TOTP (códigos de 6 dígitos de una app autenticadora) sin cambiar el modelo
de login actual.

## Objetivo

Que un usuario pueda activar 2FA desde su perfil, iniciar sesión con contraseña +
código TOTP (o un código de recuperación) y recuperar el acceso si pierde el
dispositivo. La sección `cuentas` solo será accesible con 2FA activo.

## Alcance

Incluido:

- TOTP estándar (RFC 6238), 30 s y 6 dígitos.
- Activación desde `/perfil` con QR y clave manual.
- Códigos de recuperación de un solo uso.
- Login con contraseña + TOTP o código de recuperación.
- Desactivación con contraseña + segundo factor.
- Reset de 2FA por un ADMIN, con auditoría.
- Invalidación de sesiones al cambiar contraseña, activar/desactivar 2FA o
  resetear el factor.
- Limitación de intentos y registro de eventos de seguridad.
- Helper y contrato para que `feat/cuentas` exija 2FA.
- Script de emergencia para desactivar 2FA por línea de comandos si se pierde
  la clave de cifrado o el acceso.

Fuera de alcance:

- SMS, email o llamada como segundo factor.
- WebAuthn/passkeys.
- “Recordar este dispositivo durante 30 días”.
- Step-up 2FA por sección (se exige 2FA al entrar en `cuentas`, no en cada
  acción).
- Rotación automática de `TOTP_ENCRYPTION_KEY`.
- 2FA obligatorio para toda la app; solo será obligatorio para `cuentas` y para
  los ADMIN que gestionen la bóveda.
- SSO, recuperación por preguntas secretas o soporte externo.

## Enfoque técnico

### 1. Modelo de datos

Migración aditiva `add_2fa`:

- `User.twoFactorEnabled` (`Boolean`, por defecto `false`).
- `User.twoFactorSecret` (`String?`): secreto TOTP cifrado, nunca en claro.
- `User.twoFactorConfirmedAt` (`DateTime?`).
- `User.sessionVersion` (`Int`, por defecto `0`): permite invalidar JWT.
- `TwoFactorRecoveryCode`: códigos de recuperación hasheados, con `usedAt`.
- `AuthEvent`: auditoría de login, 2FA y cambios de contraseña. No guarda
  secretos ni códigos.

### 2. Cifrado del secreto

Se crea `src/lib/crypto.ts`, reutilizable por `cuentas`:

- AES-256-GCM con IV aleatorio de 12 bytes y auth tag.
- Clave `TOTP_ENCRYPTION_KEY` de 32 bytes en base64, solo en el servidor.
- El payload guarda versión, IV, ciphertext y tag; nunca la clave.
- Si la clave falta, las rutas de 2FA devuelven `503` y el login con 2FA falla
  de forma cerrada.
- El secreto solo se devuelve al cliente una vez, durante la configuración.

### 3. TOTP y QR

- Dependencia `otplib` para generar/verificar TOTP (ventana ±1).
- Dependencia `qrcode` para generar el QR en el servidor como data URL.
- El QR y la clave manual se muestran juntos; el QR no es la única forma de
  configurarlo.
- El `otpauth://` usa emisor `casa-os` y la cuenta del usuario.

### 4. Login

- El proveedor de credenciales acepta un campo opcional `totp`.
- Si el usuario tiene 2FA activo, exige un código TOTP válido o un código de
  recuperación no usado.
- Si falta o es incorrecto, el login falla con un mensaje genérico
  («Credenciales o código incorrectos») para no revelar si la cuenta existe.
- Un código de recuperación usado se marca y no se puede reutilizar.
- El formulario de login muestra un campo opcional «Código 2FA o de
  recuperación»; los usuarios sin 2FA lo dejan vacío.

### 5. Activación

1. `POST /api/2fa/setup` genera un secreto y devuelve QR + clave manual.
2. El usuario escanea el QR y envía un código a `POST /api/2fa/enable`.
3. Si el código es válido, se activa `twoFactorEnabled`, se guarda
   `twoFactorConfirmedAt` y se generan 10 códigos de recuperación.
4. Los códigos se muestran una sola vez; el usuario debe confirmar que los ha
   guardado.
5. Se incrementa `sessionVersion` y se pide un nuevo login para que el JWT
   refleje el estado 2FA.

### 6. Desactivación y recuperación

- Desactivar exige contraseña + TOTP o código de recuperación.
- Al desactivar se borran secreto y códigos, se incrementa `sessionVersion` y se
  registra el evento.
- Regenerar códigos de recuperación exige contraseña + TOTP; invalida los
  anteriores.
- Si se pierden todos los códigos, un ADMIN puede resetear el 2FA del usuario.
- Si se pierde `TOTP_ENCRYPTION_KEY`, se usa el script de emergencia
  `npm run 2fa:reset -- <email>` con acceso directo a la base de datos.

### 7. Reset por ADMIN

- `POST /api/users/[id]/2fa/reset` exige `requireAdmin`.
- El admin debe tener 2FA activo.
- No puede resetear su propio 2FA desde esta ruta; usa el flujo normal o el
  script de emergencia.
- Borra secreto/códigos del objetivo, incrementa su `sessionVersion` y registra
  `2FA_RESET` con el admin que lo hizo.
- La UI de `/familia` muestra la acción solo si el miembro tiene 2FA activo.

### 8. Sesiones

- El JWT incluye `sessionVersion`.
- `requireUser` comprueba en base de datos que el usuario sigue activo y que la
  versión del token coincide. Si no, devuelve `401`.
- Se incrementa `sessionVersion` al cambiar contraseña, activar/desactivar 2FA y
  resetear 2FA.
- Los tokens anteriores al despliegue se tratan como versión `0` para no cerrar
  sesiones de golpe; los cambios posteriores sí invalidan.
- El cambio de contraseña actual también pasa a invalidar sesiones y a registrar
  el evento.

### 9. Rate limiting y auditoría

- Máximo 5 intentos fallidos de login/TOTP por usuario o email en 15 minutos.
- Al superar el límite, el login falla con el mismo mensaje genérico y se
  registra el evento; las rutas propias devuelven `429`.
- `AuthEvent` guarda acción, usuario (si existe), hash de IP y fecha. No guarda
  contraseñas, códigos ni secretos.
- En `/perfil` se muestran los últimos eventos de seguridad del usuario.
- Los ADMIN pueden ver los eventos de un miembro en `/familia` (sin secretos).

### 10. UI

- `/perfil`: tarjeta **Seguridad** con estado 2FA, activar, desactivar,
  regenerar códigos y últimos accesos.
- Asistente de activación con QR, clave manual, campo de código y pantalla de
  códigos de recuperación.
- Login: campo opcional de código, textos de ayuda y enlace a recuperación.
- `/familia`: acción **Restablecer 2FA** en el detalle del miembro.
- Diseño mobile-first, usable a 390 px, con foco y etiquetas accesibles.
- Aviso claro de que los códigos de recuperación no se vuelven a mostrar.

### 11. Contrato para `cuentas`

- `src/lib/2fa.ts` expone `isTwoFactorEnabled(userId)` y
  `requireTwoFactor(user)`.
- Las páginas y APIs de `cuentas` redirigen o devuelven `403` si el usuario no
  tiene 2FA.
- Un ADMIN sin 2FA puede seguir usando el resto de la app, pero no la bóveda;
  verá un aviso persistente para activarlo.

### 12. Dependencias

- `otplib` (TOTP; sin binarios nativos).
- `qrcode` (QR en servidor).
- `@types/qrcode` (desarrollo).

Justificación: implementar TOTP y QR a mano es propenso a errores de seguridad;
ambas librerías son estándar y ligeras. Cualquier alternativa se revisará antes
de instalar.

### 13. Migración, configuración y despliegue

- Migración aditiva `add_2fa`; no modifica datos existentes.
- Variable nueva `TOTP_ENCRYPTION_KEY` (32 bytes base64) en Vercel y en el
  gestor de contraseñas. Se documenta el comando de generación, nunca el valor.
- Script `npm run 2fa:reset -- <email>` para emergencias, solo con acceso a
  `DATABASE_URL`.
- No se activa 2FA para nadie por defecto; los usuarios lo activan desde
  `/perfil`.
- Verificación: tests unitarios, login real con app autenticadora, códigos de
  recuperación, reset admin, rate limit y UI a 390 px.

## Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Pérdida del dispositivo | 10 códigos de recuperación y reset por ADMIN |
| Pérdida de `TOTP_ENCRYPTION_KEY` | Script de emergencia y copia de la clave en el gestor |
| Bloqueo del único ADMIN | Códigos de recuperación + script local con acceso a BD |
| Reloj desincronizado | Ventana ±1 y explicación al usuario |
| Padres con poca experiencia | QR + clave manual + códigos + textos claros |
| Sesiones antiguas | `sessionVersion` y re-login tras cambios |
| Dependencias nuevas | Librerías estándar, sin binarios; se revisan en el PR |

## Criterio para pasar a `tasks.md`

El usuario aprueba este plan y el `spec.md`, incluidas las dependencias, el
alcance y la política de 2FA obligatorio para `cuentas`.
