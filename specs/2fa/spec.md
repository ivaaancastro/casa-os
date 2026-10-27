# Spec — Autenticación en dos pasos (2FA)

**Feature:** `2fa`
**Estado:** aprobado — pendiente de implementación
**Fecha:** 2026-10-26
**Depende de:** auth NextAuth, usuarios/roles y perfil (cerradas).
**Bloquea:** `feat/cuentas` (la bóveda de cuentas exigirá 2FA).

## Objetivo

Añadir un segundo factor TOTP al login de casa-os para que una contraseña
comprometida no sea suficiente para entrar. La sección `cuentas` solo será
accesible con 2FA activo.

El alcance es TOTP + códigos de recuperación. No hay SMS, email ni passkeys.

## Decisiones propuestas para aprobar

1. **Segundo factor:** TOTP de 6 dígitos, 30 s, compatible con Google
   Authenticator, Authy, 1Password, Apple Passwords y similares.
2. **Obligatoriedad:** 2FA obligatorio para entrar en `cuentas` y para que un
   ADMIN pueda gestionar la bóveda. En el resto de la app es opcional, para no
   bloquear notas/calendario a los miembros que no lo activen.
3. **Recuperación:** 10 códigos de un solo uso, visibles una sola vez, más un
   reset por ADMIN y un script local de emergencia.
4. **Sesiones:** los cambios de contraseña o de 2FA invalidan las sesiones
   anteriores mediante `sessionVersion`.
5. **Dependencias:** `otplib`, `qrcode` y `@types/qrcode` (desarrollo).
6. **Cifrado:** el secreto TOTP se guarda cifrado con AES-256-GCM usando
   `TOTP_ENCRYPTION_KEY`; nunca en claro.
7. **UI:** activación desde `/perfil`; reset desde `/familia`; campo opcional de
   código en el login.

## Requisitos funcionales

### RF-1 — Activar 2FA

- Cualquier usuario autenticado puede abrir `/perfil` → **Seguridad** y pulsar
  **Activar 2FA**.
- El asistente muestra:
  - Un QR con la URI `otpauth://`.
  - La clave manual en texto seleccionable, para quien no pueda escanear.
  - Un campo de 6 dígitos para confirmar.
- Al confirmar un código válido:
  - Se marca `twoFactorEnabled = true`.
  - Se guarda `twoFactorConfirmedAt`.
  - Se generan 10 códigos de recuperación.
  - Los códigos se muestran una sola vez, con opción de copiarlos o
    descargarlos.
  - Se incrementa `sessionVersion` y se pide un nuevo login.
- Si el código no es válido, no se activa nada y se puede reintentar.
- Si ya hay 2FA activo, no se puede volver a ejecutar el setup sin desactivarlo
  antes.
- El secreto solo se devuelve durante el setup; después nunca se muestra.

### RF-2 — Iniciar sesión con 2FA

- El formulario de login mantiene email y contraseña y añade un campo opcional
  **Código 2FA o de recuperación**.
- Un usuario sin 2FA inicia sesión como hasta ahora.
- Un usuario con 2FA debe introducir:
  - Un código TOTP válido de 6 dígitos, o
  - Un código de recuperación no usado.
- Si el código falta o es incorrecto, el login falla con el mensaje genérico
  **«Credenciales o código incorrectos»**.
- No se revela si el email existe, si la contraseña era correcta o si la cuenta
  tiene 2FA.
- Un código de recuperación usado se marca como consumido y no se puede
  reutilizar.
- El login correcto registra `LOGIN_SUCCESS`; el fallo registra
  `LOGIN_FAILED`/`TOTP_FAILED` sin guardar el código.

### RF-3 — Desactivar 2FA

- Desde `/perfil` → **Seguridad**, **Desactivar 2FA** exige:
  - Contraseña actual.
  - Código TOTP válido o código de recuperación.
- Al desactivar:
  - Se borra el secreto y los códigos de recuperación.
  - `twoFactorEnabled = false` y `twoFactorConfirmedAt = null`.
  - Se incrementa `sessionVersion`.
  - Se registra `2FA_DISABLED`.
- La sesión actual se cierra y se pide un nuevo login sin 2FA.

### RF-4 — Códigos de recuperación

- Se generan 10 códigos de un solo uso con formato legible, por ejemplo
  `ABCD-EFGH`.
- Se guardan hasheados; nunca en claro.
- Se muestran una sola vez, con aviso de que no se volverán a mostrar.
- **Regenerar códigos** exige contraseña + TOTP; invalida todos los anteriores.
- Un código usado no vuelve a funcionar.
- La UI muestra cuántos códigos quedan sin usar (sin revelarlos).
- Si quedan pocos, se recomienda regenerarlos.

### RF-5 — Reset por ADMIN

- En `/familia`, un ADMIN puede pulsar **Restablecer 2FA** sobre un miembro con
  2FA activo.
- La acción pide confirmación explícita y muestra el email del miembro.
- El ADMIN debe tener 2FA activo para ejecutarla.
- No se permite resetear el propio 2FA desde esta ruta; para uno mismo se usa el
  flujo normal o el script de emergencia.
- El reset:
  - Borra secreto y códigos del objetivo.
  - Deja `twoFactorEnabled = false`.
  - Incrementa su `sessionVersion`.
  - Registra `2FA_RESET` con el id del ADMIN.
- El miembro deberá configurar 2FA de nuevo para entrar en `cuentas`.

### RF-6 — Obligatoriedad en `cuentas`

- `feat/cuentas` solo permitirá entrar a usuarios con `twoFactorEnabled = true`.
- Si un usuario sin 2FA intenta abrir `/cuentas` o llamar a `/api/cuentas/*`:
  - La página redirige a `/perfil?tab=seguridad&requiere2fa=1`.
  - La API devuelve `403 { "error": "2FA requerido" }`.
- Un ADMIN sin 2FA puede seguir usando el resto de la app, pero verá un aviso
  persistente para activarlo y no podrá gestionar la bóveda.
- El helper `requireTwoFactor` se añade en esta feature para que `cuentas` lo
  use sin duplicar lógica.

### RF-7 — Invalidación de sesiones

- El JWT incluye `sessionVersion`.
- `requireUser` comprueba en base de datos:
  - Que el usuario sigue `active`.
  - Que `sessionVersion` del token coincide con el de la base de datos.
- Si no coincide o el usuario está inactivo, devuelve `401`.
- Se incrementa `sessionVersion` al:
  - Cambiar la contraseña.
  - Activar 2FA.
  - Desactivar 2FA.
  - Resetear 2FA por ADMIN.
- Los tokens anteriores al despliegue se tratan como versión `0` para evitar
  cerrar todas las sesiones de golpe.
- Tras un cambio, la sesión actual se cierra y se pide un nuevo login.

### RF-8 — Rate limiting

- Máximo 5 intentos fallidos de login/TOTP en 15 minutos por email o usuario.
- Al superar el límite:
  - El login falla con el mismo mensaje genérico.
  - Las rutas de 2FA devuelven `429`.
  - Se registra el evento.
- Un login correcto no borra el historial de fallos, pero no bloquea por sí
  mismo; el contador se ventana temporal.
- No se bloquea permanentemente una cuenta desde la UI; el ADMIN puede resetear
  2FA si hace falta.

### RF-9 — Auditoría y UI de seguridad

- `/perfil` → **Seguridad** muestra:
  - Estado de 2FA.
  - Botón activar/desactivar.
  - Códigos de recuperación restantes.
  - Botón regenerar códigos.
  - Últimos 10 eventos de seguridad del usuario.
- Los eventos incluyen fecha, acción y, si aplica, IP anonimizada.
- Nunca incluyen contraseñas, códigos TOTP, códigos de recuperación ni secretos.
- El login muestra un texto de ayuda: «Si tienes 2FA activo, introduce el código
  de tu app o un código de recuperación».
- En móvil, el QR y la clave manual se ven sin scroll horizontal a 390 px.
- Los códigos de recuperación se pueden copiar y descargar como texto.

## Requisitos no funcionales

- **Seguridad:**
  - TOTP con ventana ±1 y comparación en tiempo constante.
  - Secreto TOTP cifrado con AES-256-GCM.
  - Códigos de recuperación hasheados y de un solo uso.
  - Sin secretos en logs, errores, analítica ni documentación.
  - Sin secretos en respuestas después del setup.
  - `Cache-Control: no-store` en todas las rutas de 2FA.
  - El script de emergencia no imprime secretos ni códigos.
- **Privacidad:**
  - `AuthEvent` guarda hash de IP, no IP en claro.
  - No se registra el email en logs de error.
- **Rendimiento:**
  - `requireUser` hace una consulta por id; es aceptable para el tamaño
    familiar.
  - Los eventos se limitan a 10 en la UI.
- **Accesibilidad:**
  - Formularios con `label`, foco visible y mensajes `role="status"`/`role="alert"`.
  - QR con alternativa manual siempre visible.
  - Botones con texto claro; no solo iconos.
- **Compatibilidad:**
  - TOTP estándar; cualquier app autenticadora sirve.
  - Login y perfil usables a 390 px.

## API

Todas las rutas propias usan `requireUser`, validación Zod y
`Cache-Control: no-store`. Los errores usan `{ "error": "mensaje" }`.

### `GET /api/2fa/status`

- **Auth:** sesión válida.
- **Response 200:**

```json
{
  "enabled": true,
  "recoveryCodesRemaining": 7,
  "confirmedAt": "2026-10-26T10:00:00.000Z"
}
```

- No devuelve el secreto.

### `POST /api/2fa/setup`

- **Auth:** sesión válida; falla si ya hay 2FA activo.
- **Response 200:**

```json
{
  "secret": "BASE32...",
  "otpauth": "otpauth://totp/casa-os:usuario@ejemplo.com?secret=...",
  "qrDataUrl": "data:image/png;base64,..."
}
```

- `secret` y `qrDataUrl` solo se devuelven aquí.
- **Errores:** `400` si ya está activo; `503` si falta
  `TOTP_ENCRYPTION_KEY`.

### `POST /api/2fa/enable`

- **Auth:** sesión válida.
- **Body:** `{ "code": "123456" }`.
- **Response 200:**

```json
{
  "ok": true,
  "recoveryCodes": ["ABCD-EFGH", "..."]
}
```

- Activa 2FA y devuelve los 10 códigos una sola vez.
- **Errores:** `400` código inválido; `409` si ya está activo.

### `POST /api/2fa/disable`

- **Auth:** sesión válida.
- **Body:** `{ "password": "...", "code": "123456" }` o
  `{ "password": "...", "recoveryCode": "ABCD-EFGH" }`.
- **Response 204.**
- **Errores:** `400` datos inválidos; `401` contraseña o código incorrectos.

### `POST /api/2fa/recovery-codes`

- **Auth:** sesión válida con 2FA activo.
- **Body:** `{ "password": "...", "code": "123456" }`.
- **Response 200:** `{ "recoveryCodes": ["..."] }`.
- Invalida los códigos anteriores.
- **Errores:** `400`, `401`.

### `POST /api/users/[id]/2fa/reset`

- **Auth:** `requireAdmin`; el admin debe tener 2FA activo.
- **Body:** `{ "confirm": true }`.
- **Response 204.**
- **Errores:** `400` si intenta resetearse a sí mismo; `403` sin 2FA o sin rol;
  `404` miembro inexistente.

### Login NextAuth

- El proveedor de credenciales acepta `email`, `password` y `totp` opcional.
- No se crea una ruta de login nueva: se mantiene `/api/auth/callback/credentials`.
- Si el usuario tiene 2FA y el código no es válido, `authorize` devuelve `null`.

## Modelo de datos

```prisma
model User {
  // ...
  twoFactorEnabled     Boolean   @default(false)
  twoFactorSecret      String?
  twoFactorConfirmedAt DateTime?
  sessionVersion       Int       @default(0)
  recoveryCodes        TwoFactorRecoveryCode[]
  authEvents           AuthEvent[]
}

model TwoFactorRecoveryCode {
  id        String    @id @default(cuid())
  userId    String
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  codeHash  String    @unique
  usedAt    DateTime?
  createdAt DateTime  @default(now())

  @@index([userId, usedAt])
}

model AuthEvent {
  id        String   @id @default(cuid())
  userId    String?
  user      User?    @relation(fields: [userId], references: [id], onDelete: SetNull)
  action    String   // LOGIN_SUCCESS, LOGIN_FAILED, TOTP_FAILED, 2FA_ENABLED, ...
  ipHash    String?  @db.VarChar(64)
  createdAt DateTime @default(now())

  @@index([userId, createdAt])
  @@index([action, createdAt])
}
```

Reglas:

- `twoFactorSecret` guarda el payload cifrado, no el secreto en claro.
- `sessionVersion` empieza en `0`; los tokens sin versión se tratan como `0`.
- `AuthEvent.action` se valida en la lógica; no se usa un enum para evitar una
  migración extra por cada acción nueva.
- `ipHash` es SHA-256 de la IP con un sufijo secreto; no se guarda la IP.
- Migración aditiva `add_2fa`; no modifica columnas existentes.

## UI/UX

### `/perfil` → Seguridad

- Tarjeta con estado **Activado** / **Desactivado**.
- Si está desactivado:
  - Botón **Activar 2FA**.
  - Texto: «Protege el acceso a tus cuentas con un código de tu móvil».
- Si está activado:
  - Botón **Desactivar 2FA**.
  - «Códigos de recuperación restantes: N».
  - Botón **Regenerar códigos**.
- Asistente de activación:
  1. QR + clave manual.
  2. Campo de código.
  3. Códigos de recuperación con aviso de copiarlos.
  4. Cierre y re-login.
- Errores claros y accesibles.

### Login

- Campo opcional «Código 2FA o de recuperación» debajo de la contraseña.
- Ayuda contextual.
- Error genérico si falla cualquier credencial.
- Enlace «¿Has perdido el acceso?» con instrucciones para usar un código de
  recuperación o pedir a un ADMIN.

### `/familia`

- En el detalle del miembro, si tiene 2FA activo, acción **Restablecer 2FA**.
- Confirmación con el email del miembro.
- Solo visible para ADMIN.
- Si el ADMIN no tiene 2FA, la acción muestra un aviso y no se ejecuta.

## Seguridad y privacidad

- **Clave de cifrado:** `TOTP_ENCRYPTION_KEY` de 32 bytes en base64; solo en
  Vercel y en el gestor de contraseñas. Se documenta cómo generarla
  (`openssl rand -base64 32`), nunca su valor.
- **Pérdida de la clave:** los secretos TOTP no se pueden descifrar; se usa el
  script de emergencia para desactivar 2FA de los usuarios afectados y que
  vuelvan a configurarlo.
- **Script de emergencia:** `npm run 2fa:reset -- <email>` requiere
  `DATABASE_URL`, desactiva 2FA, borra secreto/códigos, incrementa
  `sessionVersion` y muestra solo el email afectado. No imprime secretos.
- **Sin secretos en logs:** ni contraseñas, ni TOTP, ni códigos de recuperación,
  ni `TOTP_ENCRYPTION_KEY`.
- **Códigos de recuperación:** hash SHA-256 con comparación directa por hash;
  cada código se marca `usedAt` al consumirse.
- **Rate limit:** 5 fallos/15 min por email o usuario; ventana deslizante.
- **Sesiones:** `sessionVersion` invalida JWT tras cambios sensibles.
- **CSRF:** se mantiene la protección de NextAuth.
- **Auditoría:** eventos sin datos sensibles; `ipHash` no reversible.

## Criterios de aceptación

1. Un usuario puede activar 2FA con QR o clave manual y confirmar con un código.
2. Al activar, se muestran 10 códigos de recuperación una sola vez.
3. El login exige TOTP cuando 2FA está activo.
4. Un código de recuperación válido permite entrar una vez y queda consumido.
5. Un código TOTP inválido o ausente no permite entrar y no revela la causa.
6. Desactivar 2FA exige contraseña + TOTP o código de recuperación.
7. Regenerar códigos invalida los anteriores.
8. Un ADMIN con 2FA puede resetear el 2FA de otro miembro; queda auditado.
9. Un ADMIN no puede resetear su propio 2FA desde la ruta de admin.
10. `sessionVersion` invalida sesiones tras cambiar contraseña o 2FA.
11. Rate limit bloquea tras 5 fallos en 15 minutos.
12. `cuentas` podrá exigir 2FA con el helper `requireTwoFactor`.
13. No hay secretos en logs, respuestas posteriores al setup ni documentación.
14. `lint`, `typecheck`, `test`, `build` y `docs:check -- 2fa` pasan.
15. UI verificada a 390 px y en escritorio.

## Fuera de alcance

- SMS, email o llamada.
- Passkeys/WebAuthn.
- Recordar dispositivos.
- Step-up 2FA por acción.
- Rotación automática de la clave.
- 2FA obligatorio para toda la app.
- Recuperación por preguntas secretas.
- Soporte multi-dispositivo autenticador más allá del estándar TOTP.

## Preguntas abiertas

Ninguna bloqueante. Si el usuario quiere 2FA obligatorio para toda la app desde
el primer día, se puede añadir una tarea extra; la propuesta es exigirlo solo
para `cuentas` y para la gestión de la bóveda.
