# Spec — Cuentas zero-knowledge

**Feature:** `cuentas`
**Estado:** propuesta — pendiente de aprobación del usuario
**Fecha:** 2026-10-28
**Rama:** `feat/cuentas`
**Depende de:** auth, usuarios/roles, perfil y 2FA (cerradas)
**Sustituye a:** `gestor-contrasenas` y `gestor-contrasenas-ui` (descartados)

> **No implementado.** Este documento describe lo que se va a construir. No hay
> tablas, rutas, componentes ni tests de Cuentas en el repositorio todavía.

## Objetivo

Añadir **Cuentas**, una bóveda de credenciales familiar en `/cuentas` donde el
servidor nunca puede leer el contenido. Cada miembro tiene su bóveda, protegida
por una master password, con 2FA obligatorio, recuperación offline, contacto de
confianza opcional y desbloqueo con passkey (WebAuthn PRF) cuando el dispositivo
lo permita.

La bóveda guarda credenciales de Google, correo y servicios domésticos. **No**
guarda datos bancarios ni tarjetas.

## Decisiones que se piden aprobar

1. **Criptografía**: Argon2id (ops 3, 64 MiB), `crypto_kdf` para separar `kek` y
   `authKey`, XChaCha20-Poly1305 para contenido y keyring, X25519
   (`crypto_box_seal`) para envolver DEKs.
2. **El servidor nunca recibe** la master password, `MK`, `kek`, `sk`, las
   DEKs ni el contenido. Solo recibe `authKey` para verificar y blobs cifrados.
3. **2FA obligatorio**: sin TOTP activo no se puede crear ni abrir la bóveda.
   Cada desbloqueo exige un código TOTP o de recuperación.
4. **Grant de 15 minutos** en cookie HttpOnly firmada; las APIs de cuentas no
   aceptan solo el JWT de sesión.
5. **Passkey solo para desbloquear**, nunca para iniciar sesión en casa-os. Sin
   PRF real no se registra la passkey.
6. **Visibilidad**: `Solo yo`, `Toda la familia` (por defecto) y `Personas
   concretas`. La familia es una foto del momento: los miembros nuevos no ven
   cuentas antiguas hasta que el dueño vuelve a compartirlas.
7. **Edición**: solo el dueño concede `canEdit`; el dueño siempre puede editar,
   compartir, revocar y borrar. Un ADMIN no tiene acceso especial.
8. **Recuperación**: kit offline obligatorio al crear la bóveda + contacto de
   confianza opcional. Sin ninguno de los dos, perder la master password es
   irreversible.
9. **Nombre y ruta**: **Cuentas** en `/cuentas`, entrada en el sidebar.
10. **Dependencias**: `libsodium-wrappers`, `@simplewebauthn/server` y
    `@simplewebauthn/browser`. Nada más.

## Requisitos funcionales

### RF-1 — Requisito de 2FA

- Si el usuario no tiene 2FA activo, `/cuentas` muestra una tarjeta que explica
  el requisito y enlaza a **Perfil → Seguridad**.
- Las APIs de creación, desbloqueo y recuperación devuelven `403` con
  `{ "error": "2FA requerido" }`.
- Activar 2FA después permite crear la bóveda sin volver a iniciar sesión.

### RF-2 — Crear la bóveda

- El asistente pide master password y confirmación. Mínimo **12 caracteres**;
  se recomienda una frase de varias palabras. Se muestra un medidor de
  fortaleza local (longitud, variedad y lista de contraseñas comunes).
- El cliente genera sal, `MK`, `kek`, `authKey` y el par X25519.
- El servidor recibe: sal, parámetros KDF, `bcrypt(authKey)`, `pk`, keyring
  cifrado y nonce. Rechaza cualquier campo que parezca contenido en claro.
- Antes de terminar, el usuario **debe** descargar o copiar el kit de
  recuperación. Sin confirmación explícita no se crea la bóveda.
- Al terminar, la bóveda queda desbloqueada en esa pestaña y se muestra la
  lista vacía.
- Solo puede existir una bóveda por usuario (`Vault.userId` único).
- Crear la bóveda registra `VAULT_CREATED` y emite grant.

### RF-3 — Desbloquear

- Pantalla con master password y código TOTP (o código de recuperación de 2FA).
- El cliente deriva `authKey` y llama a `POST /api/cuentas/unlock`.
- El servidor, en este orden:
  1. Comprueba rate limit (5 fallos / 15 min).
  2. Verifica el código TOTP o de recuperación.
  3. Compara `bcrypt(authKey)`.
  4. Devuelve el keyring cifrado y emite el grant.
- Si algo falla, respuesta genérica `401` («No se pudo desbloquear») y se
  registra `UNLOCK_FAILED` sin guardar `authKey` ni el código.
- El cliente descifra el keyring y mantiene `sk` solo en memoria.
- Un fallo de red no borra la bóveda ni el grant anterior.
- El desbloqueo no requiere volver a iniciar sesión en casa-os.

### RF-4 — Bloqueo y grant

- El grant dura **15 minutos** desde el último desbloqueo y se renueva con otro
  desbloqueo.
- Las rutas `status`, `unlock` y `recovery/reset` no exigen grant; el resto sí.
- Sin grant: `401 { "error": "Bóveda bloqueada" }`.
- `POST /api/cuentas/lock` borra la cookie y el cliente descarta las claves.
- Auto-lock por inactividad a los **5 minutos** (configurable 1–15). Al bloquear
  se limpian los campos descifrados y se vuelve a la pantalla de desbloqueo.
- Cerrar sesión de casa-os borra también el grant.

### RF-5 — Listar y buscar cuentas

- La lista muestra solo las cuentas donde el usuario tiene una
  `VaultAccountKey`.
- El descifrado es local; el servidor nunca recibe el término de búsqueda.
- Búsqueda por título, usuario, URL y notas (todo ya descifrado en memoria).
- Filtros por categoría y visibilidad. Orden por `updatedAt` descendente.
- Una cuenta sin descifrar (clave corrupta) se muestra como «No se pudo
  descifrar» sin romper la lista; se ofrece eliminar solo al dueño.

### RF-6 — Crear y editar una cuenta

- Campos: título (obligatorio), usuario, contraseña, URL, notas, categoría y
  campos personalizados (pares etiqueta/valor).
- Generador de contraseñas local: 20 caracteres por defecto, longitud 12–64,
  mayúsculas, minúsculas, dígitos y símbolos configurables.
- Copiar al portapapeles con confirmación visual; intento de limpiar a los 60 s
  (limitación del navegador documentada).
- Revelar contraseña solo bajo acción explícita y se vuelve a ocultar al
  cerrar el detalle.
- `POST` crea la cuenta con `revision = 1`, la DEK envuelta para el dueño y los
  destinatarios elegidos.
- `PATCH` exige `revision` actual; si no coincide, `409` y la UI ofrece recargar
  o sobrescribir.
- Editar una cuenta compartida no cambia destinatarios ni visibilidad.
- El dueño puede borrar con confirmación en dos pasos; se borran también sus
  claves envueltas.

### RF-7 — Visibilidad y compartir

- `Solo yo`: solo el dueño tiene `VaultAccountKey`.
- `Toda la familia` (por defecto al crear): todos los miembros **activos con
  bóveda creada** en el momento de guardar. Si un miembro no tiene bóveda, no
  recibe clave y la UI lo indica.
- `Personas concretas`: selección múltiple de miembros con bóveda.
- El dueño puede activar `canEdit` por destinatario.
- Cambiar destinatarios usa `PUT /api/cuentas/accounts/[id]/keys` en una
  transacción: valida que el solicitante es dueño, sustituye el conjunto y
  actualiza `visibility`.
- Si hay miembros activos con bóveda que no están en una cuenta `FAMILY`, la UI
  muestra «N miembros nuevos sin acceso» con la acción **Volver a compartir**.
- Compartir requiere la `pk` del destinatario; si no tiene bóveda, no aparece
  como opción.
- Toda concesión o revocación se audita con `targetId` de la cuenta.

### RF-8 — Revocar acceso

- Solo el dueño puede revocar.
- Revocar **siempre** rota la DEK: se genera una nueva, se re-cifra el
  contenido y se envuelve para los destinatarios restantes, en la misma
  transacción.
- Si el usuario revocado tenía una copia antigua, se documenta que no se puede
  borrar de su dispositivo.
- La UI advierte antes de revocar: «Dejará de ver la versión actual; no podemos
  borrar lo que ya haya copiado».

### RF-9 — Kit de recuperación offline

- Al crear la bóveda se genera una `recoveryKey` de 32 B y se muestra como
  código Crockford base32 con checksum, agrupado para copiar a mano.
- Se puede descargar un `.txt` con: versión, email, fecha, código, instrucciones
  y la advertencia de que casa-os no guarda ninguna copia.
- El servidor guarda el keyring cifrado con `recoveryKek`.
- Rotar el kit invalida el anterior y registra `RECOVERY_ROTATED`.
- La UI no vuelve a mostrar el código; solo permite descargar uno nuevo previa
  confirmación de la master password.

### RF-10 — Recuperar con el kit

- Enlace **He olvidado la master password** en la pantalla de desbloqueo.
- Flujo: código TOTP → código de recuperación → nueva master password.
- El cliente descifra el keyring con `recoveryKek`, lo vuelve a cifrar con la
  nueva `kek`, deriva el nuevo `authKey` y llama a
  `POST /api/cuentas/recovery/reset`.
- El servidor verifica TOTP, actualiza sal, parámetros, `authHash`, keyring,
  nonce y borra las passkeys (envuelven el keyring anterior). Incrementa
  `keyringVersion`.
- Se invalidan los grants anteriores. Las cuentas y sus DEKs **no** cambian.
- Rate limit: 3 intentos por hora.
- El kit sigue siendo válido después del reset (envuelve el keyring nuevo con la
  misma `recoveryKey`) salvo que el usuario lo rote.

### RF-11 — Contacto de confianza

- Opcional. El dueño invita a otro miembro activo con bóveda.
- El contacto debe **aceptar** desde `/cuentas` → Ajustes.
- Al aceptar, el dueño envuelve la `recoveryKey` actual con la `pk` del contacto
  (`crypto_box_seal`) y se guarda `VaultRecoveryShare` en `ACCEPTED`. El
  servidor no puede abrir esa copia.
- **Ayudar a recuperar**: el contacto, con su bóveda desbloqueada y grant,
  descifra la copia y obtiene el código de recuperación del dueño. Se lo
  entrega en persona. Cada consulta se audita.
- El dueño introduce el código en el flujo normal de recuperación junto con su
  TOTP y la nueva master password.
- El contacto no puede leer la bóveda por su cuenta: solo tiene la clave de
  recuperación, no el blob cifrado del dueño. Aun así puede ayudar a un
  impostor; se avisa antes de invitar.
- Revocar el contacto borra su fila y registra el evento. Si el dueño rota el
  kit, las copias de los contactos quedan `STALE` hasta que las renueve; la UI
  lo avisa.

### RF-12 — Passkey con PRF

- En **Ajustes → Passkeys** se puede registrar una passkey.
- El registro pide `userVerification: required` y la extensión PRF.
- Si el autenticador no devuelve `prf.enabled`, se aborta con un mensaje claro:
  «Este dispositivo no permite desbloquear con passkey; usa la master
  password».
- Se guardan `credentialId`, clave pública COSE, contador, transports,
  `prfSalt` y el keyring envuelto con la clave derivada del PRF.
- Desbloqueo: aserción WebAuthn + TOTP + descifrado local. Sin TOTP no se
  desbloquea.
- Borrar una passkey no afecta a la master password ni al kit.
- Nunca se muestra «Desbloquear con huella» si no hay PRF verificado.

### RF-13 — Cambiar la master password

- Requiere grant y conocer la actual.
- El cliente descifra el keyring con la `kek` actual, lo vuelve a cifrar con la
  nueva y envía sal, parámetros, `authHash` y keyring.
- No se re-cifran las cuentas: la clave privada `sk` es la misma y las DEKs ya
  están envueltas a su `pk`.
- Se borran los grants anteriores y las passkeys (envuelven el keyring), y se
  emite uno nuevo.
- No cierra la sesión de casa-os ni cambia `sessionVersion`.

### RF-14 — Auditoría

- Eventos: `VAULT_CREATED`, `UNLOCK_OK`, `UNLOCK_FAILED`, `RATE_LIMITED`,
  `ACCOUNT_CREATED`, `ACCOUNT_UPDATED`, `ACCOUNT_DELETED`, `SHARE_GRANTED`,
  `SHARE_REVOKED`, `KEY_ROTATED`, `RECOVERY_SET`, `RECOVERY_ROTATED`,
  `RECOVERY_USED`, `PASSKEY_ADDED`, `PASSKEY_REMOVED`, `CONTACT_INVITED`,
  `CONTACT_ACCEPTED`, `CONTACT_REVOKED`, `CONTACT_REVEALED`.
- Guardan `userId`, `actorId`, `action`, `targetId` (cuenta o miembro), `ipHash`
  y fecha. **Nunca** contenido, títulos, usuarios, URLs, DEKs ni códigos.
- El usuario ve sus últimos eventos en Ajustes.

### RF-15 — Borrar la bóveda

- Solo el dueño, con master password + TOTP y confirmación escribiendo
  `BORRAR`.
- Borra `Vault`, cuentas, claves, kit, passkeys, contactos y eventos.
- Las cuentas compartidas dejan de estar disponibles para el dueño; los demás
  destinatarios conservan su copia (no se puede revocar lo ya compartido).
- Se avisa de que la operación es irreversible.

## Requisitos no funcionales

### RNF-1 — Zero-knowledge verificable

- El servidor no recibe en ningún request: master password, `MK`, `kek`, `sk`,
  DEKs ni JSON de cuenta en claro.
- Los logs, errores y eventos no incluyen secretos ni ciphertext completo.
- Los tests revisan que los handlers solo escriben campos opacos.

### RNF-2 — Defensa en profundidad

- 2FA obligatorio.
- Grant de 15 min con HMAC y `sessionVersion`.
- `Cache-Control: no-store` en todas las respuestas de `/api/cuentas/*`.
- CSP con `'wasm-unsafe-eval'` y sin scripts de terceros.
- El service worker no cachea `/cuentas` ni `/api/cuentas/*`.
- Auto-lock y borrado best-effort de claves en memoria.

### RNF-3 — Rendimiento

- Desbloqueo percibido < 2 s en un móvil reciente (Argon2id 64 MiB).
- Lista de 200 cuentas descifrada y filtrada en < 200 ms en cliente.
- Sin peticiones por pulsación en la búsqueda.

### RNF-4 — Accesibilidad y diseño

- Formularios con `label`, foco visible, navegación por teclado.
- Contraste AA y estados de error anunciados.
- Mobile-first 390 px; escritorio editorial coherente con el resto.
- `prefers-reduced-motion` respetado.

### RNF-5 — Compatibilidad

- Navegadores con WebCrypto y WASM (Chrome, Edge, Safari 17+, Firefox ESR+).
- Passkey PRF: solo donde el autenticador lo soporte; el resto usa master
  password sin degradar la seguridad.
- Sin soporte de PRF no se fuerza el registro.

### RNF-6 — Datos y migración

- Migración aditiva; ninguna tabla existente se modifica.
- Sin migraciones destructivas.
- Probada en una base temporal antes del merge.
- El prototipo `/api/passwords` y `User.encryptedPasswords` se retiran al cerrar
  la feature.

### RNF-7 — Calidad

- `lint`, `typecheck`, `test` y `build` verdes.
- Tests de cripto, permisos, validación Zod, rate limit y recuperación.
- Cobertura de la lógica de negocio, no de la UI.
- Documentación en `docs/cuentas.md` y actualización de `MEMORY.md`,
  `CHANGELOG.md`, `README.md` y `docs/architecture.md`.

## Modelo de datos

Se añaden siete tablas nuevas (`Vault`, `VaultAccount`, `VaultAccountKey`,
`VaultRecovery`, `VaultPasskey`, `VaultRecoveryShare`, `VaultEvent`) descritas
en el [plan](plan.md#modelo-de-datos-migración-aditiva). Puntos que la
implementación debe respetar:

- `Vault.userId` único.
- `VaultAccountKey` único por `(accountId, userId)` e indexado por `userId`.
- `VaultAccount.revision` entero que empieza en 1.
- `VaultRecoveryShare` único por `(ownerId, contactId)`.
- Borrado en cascada desde `User` y desde `VaultAccount`.
- `VaultEvent` sin campos de contenido.
- El dueño siempre tiene una fila en `VaultAccountKey`.

## API

Las rutas y contratos están en el [plan](plan.md#api). Reglas transversales:

- Zod en body, params y query.
- `401` sin sesión o sin grant; `403` sin 2FA o sin permiso; `404` si la cuenta
  no existe o el usuario no es destinatario (no se filtra su existencia);
  `409` si `revision` no coincide; `429` con `Retry-After`.
- Nunca se devuelve el contenido en claro ni claves privadas.
- `GET /api/cuentas/accounts` devuelve `ciphertext`, `nonce`, `revision`,
  `visibility`, `ownerId`, `canEdit` y la DEK envuelta **del solicitante**,
  más la lista de destinatarios (ids y `canEdit`), sin sus DEKs.
- Las mutaciones de destinatarios son transaccionales.
- Los handlers usan runtime Node.js (bcrypt, WebAuthn).

## UI / UX

### Estados de `/cuentas`

| Estado | Qué ve el usuario |
|---|---|
| Sin 2FA | Requisito y enlace a Perfil → Seguridad |
| Sin bóveda | Asistente de creación |
| Bloqueada | Master password + TOTP; passkey si existe; enlace de recuperación |
| Abierta | Lista, búsqueda, filtros y ajustes |
| Grant caducado | Aviso y vuelta a desbloqueo sin perder la lista |

### Pantallas

1. **Onboarding** (4 pasos): requisito, master password, kit obligatorio,
   passkey opcional.
2. **Desbloqueo**: formulario claro, errores genéricos, contador de intentos
   restantes solo si el servidor lo expone.
3. **Lista**: cabecera con búsqueda y botón **Nueva cuenta**; tarjetas con
   título, usuario, badge de visibilidad y acciones.
4. **Detalle**: panel lateral en escritorio, hoja completa en móvil; copiar,
   revelar, editar y borrar.
5. **Compartir**: radios de visibilidad, lista de miembros, `canEdit`, aviso de
   miembros nuevos.
6. **Ajustes**: master password, kit, passkeys, contactos, auditoría y borrado.

### Mensajes clave

- «casa-os no puede leer tus cuentas. Si olvidas la master password y pierdes
  el kit, no hay forma de recuperarlas.»
- «Toda la familia incluye a los miembros con bóveda de ahora. Si entra alguien
  nuevo, vuelve a compartir.»
- «Revocar corta el acceso futuro; no borra lo que la otra persona ya haya
  visto.»

## Criterios de aceptación

1. Un usuario sin 2FA no puede crear ni abrir la bóveda (`403`).
2. Crear la bóveda exige confirmar la descarga del kit.
3. Desbloquear exige TOTP + master password; con cualquiera de los dos mal, no
   se abre.
4. Sin grant, `GET /api/cuentas/accounts` devuelve `401`.
5. El contenido descifrado nunca aparece en requests, logs ni respuestas del
   servidor (test explícito).
6. Crear, editar, borrar y buscar cuentas funciona con cifrado local.
7. Compartir con `Solo yo`, `Toda la familia` y `Personas concretas` produce el
   conjunto de destinatarios correcto.
8. Un miembro nuevo no recibe cuentas `FAMILY` antiguas y la UI lo avisa.
9. Revocar rota la DEK y el revocado no puede descifrar la versión nueva.
10. Recuperar con el kit restablece el acceso y conserva las cuentas.
11. Recuperar con contacto de confianza funciona solo tras aceptación y deja
    auditoría.
12. Una passkey sin PRF no se registra; con PRF desbloquea pidiendo TOTP.
13. Cambiar la master password no pierde cuentas e invalida grants y passkeys.
14. `revision` obsoleta devuelve `409` y no pisa cambios.
15. Un ADMIN no puede leer ni borrar la bóveda de otro usuario.
16. `lint`, `typecheck`, `test`, `build` y `docs:check` pasan.
17. UI verificada en Chromium a 390 px y escritorio, y en producción tras el
    deploy.
18. `/api/passwords` y `User.encryptedPasswords` ya no existen al cerrar.

## Límites de seguridad (se documentarán en `docs/cuentas.md`)

- **Metadatos visibles**: el servidor ve dueño, visibilidad, destinatarios,
  fechas, número de cuentas, tamaño de los blobs, versiones y patrones de acceso.
- **El servidor sirve el código**: un servidor comprometido podría servir JS
  malicioso. El modelo protege los datos en reposo y ante una fuga de base de
  datos, no ante un servidor que controla la aplicación.
- **XSS**: mientras la bóveda está desbloqueada, un XSS podría leer claves en
  memoria. Se mitiga con CSP, auto-lock y no usar scripts de terceros.
- **Revocación imperfecta**: no se puede borrar lo que un destinatario ya vio.
- **Contacto de confianza**: custodia la clave de recuperación y puede ayudar a
  un impostor; no puede leer la bóveda por su cuenta. Revocar + rotar el kit
  invalida su copia.
- **Pérdida total**: sin master password, kit ni contacto, los datos son
  irrecuperables. No hay backdoor ni recuperación por ADMIN.
- **Memoria del navegador**: el borrado es best-effort; no se puede garantizar
  el zeroizado físico.
- **Metadatos de 2FA**: el servidor conoce si el usuario tiene 2FA y cuándo se
  usó, pero no el secreto (cifrado con AES-256-GCM).

## Fuera de alcance

- Login con passkey.
- Importación/exportación desde otros gestores.
- Extensión, autofill y apps nativas.
- Adjuntos y archivos.
- Datos bancarios.
- Búsqueda en servidor.
- Compartir fuera de casa-os.
- Recuperación sin kit ni contacto.
- Rotación automática de claves.

## Preguntas abiertas para el usuario

1. **Contacto de confianza en v1**: ¿se incluye en la primera entrega (fase 5)
   o se pospone a `feat/cuentas-recuperacion-contacto`? Recomendación:
   incluirlo, porque sin él la única recuperación es el kit.
2. **Longitud mínima de la master password**: 12 caracteres con medidor.
   ¿Prefieres exigir 16 o una frase de 4 palabras?
3. **Auto-lock**: 5 minutos por defecto, configurable 1–15. ¿Te encaja?
4. **Cuentas por defecto**: al crear, `Toda la familia`. ¿Mantener ese valor por
   defecto o empezar en `Solo yo`?
5. **Borrado de la bóveda**: ¿permitirlo desde la UI con doble confirmación o
   dejarlo solo para el script de administración?

## Plan de verificación

1. Tests unitarios de cripto: derivación, round-trip de keyring, DEK, sealing,
   base32 con checksum y detección de manipulación.
2. Tests de API con Prisma mockeado: permisos, validación, rate limit,
   `revision`, grant caducado y 2FA ausente.
3. Test de «el servidor no ve contenido»: inspeccionar los argumentos de
   Prisma y las respuestas.
4. Prueba manual en Chromium: onboarding, crear, compartir, revocar, recuperar,
   passkey (si el entorno la soporta) y auto-lock.
5. Migración en base temporal y verificación en el preview de Vercel.
6. Smoke en producción con una cuenta de prueba y datos ficticios; borrar la
   cuenta de prueba al terminar.
