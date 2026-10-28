# Autenticación en dos pasos (2FA)

> Estado: **activo** en `/perfil` y en el login. El código está desplegado en
> producción desde el commit `562c9b0`.

casa-os usa TOTP (códigos de 6 dígitos, 30 s) como segundo factor. Es compatible
con Google Authenticator, Authy, 1Password, Apple Passwords y cualquier app
TOTP estándar. No hay SMS ni email.

## Activar 2FA

1. Entra en **Perfil → Seguridad**.
2. Pulsa **Activar 2FA**.
3. Escanea el QR con tu app o introduce la clave manual.
4. Escribe el código de 6 dígitos y confirma.
5. Guarda los **10 códigos de recuperación**. Solo se muestran una vez.

Al activar, la sesión actual se cierra y tendrás que entrar de nuevo con el
código. Es intencionado: el JWT anterior no refleja el nuevo estado.

## Iniciar sesión

El formulario de login tiene un campo opcional **Código 2FA o de
recuperación**:

- Si tu cuenta no tiene 2FA, déjalo vacío.
- Si tiene 2FA, introduce el código de 6 dígitos de la app o uno de los códigos
  de recuperación (formato `ABCD-EFGH`).
- Si el código falla, el mensaje es genérico: no revela si el email existe, si
  la contraseña era correcta o si la cuenta tiene 2FA.

Cada código de recuperación sirve **una sola vez**. La tarjeta de seguridad
muestra cuántos quedan sin usar.

## Desactivar o regenerar

- **Desactivar 2FA** exige la contraseña actual y un TOTP o un código de
  recuperación.
- **Regenerar códigos** invalida todos los anteriores y exige contraseña + TOTP.
- Si pierdes el dispositivo y todos los códigos, un ADMIN puede restablecer tu
  2FA desde **Familia**. El ADMIN debe tener 2FA activo y no puede usar esa ruta
  para resetearse a sí mismo.

## Reset de emergencia (servidor)

Si se pierde el acceso o la clave de cifrado, con acceso a `DATABASE_URL`:

```bash
npm run 2fa:reset -- usuario@ejemplo.com
```

El script desactiva 2FA, borra secreto y códigos, incrementa `sessionVersion` y
solo muestra el email afectado. **No imprime secretos ni códigos.** El usuario
debe volver a configurar 2FA.

## Variables de entorno

```env
# 32 bytes en base64. Genera una con: openssl rand -base64 32
TOTP_ENCRYPTION_KEY="..."
```

La clave se guarda solo en Vercel y en el gestor de contraseñas. Nunca en el
repo, en documentación ni en logs. Si se pierde, los secretos TOTP existentes no
se pueden descifrar: usa el script de emergencia.

## Límites y decisiones

- 2FA es opcional para notas, calendario y el resto de la app; será
  **obligatorio** para entrar en la futura sección **Cuentas**.
- No hay passkeys todavía. La bóveda zero-knowledge de Cuentas las usará para
  desbloquear, no como sustituto del login en v1.
- No se recuerdan dispositivos ni hay step-up por acción.
- Rate limit: 5 fallos de login/TOTP en 15 minutos por email o usuario.
- Los eventos de seguridad no guardan contraseñas, códigos TOTP, códigos de
  recuperación ni secretos; la IP se guarda como hash.

## Verificación

La suite cubre cifrado, TOTP, códigos de recuperación, esquemas, login, rate
limit y `sessionVersion`. El smoke manual local del 2026-10-28 comprobó
activación con QR, códigos de recuperación, login con TOTP y desactivación. El
smoke autenticado de producción queda pendiente de que el usuario lo confirme;
ver [`specs/2fa/cierre.md`](../specs/2fa/cierre.md).
