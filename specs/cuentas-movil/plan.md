# Plan — Fase 2: Cuentas móvil (desbloqueo y búsqueda)

## Contexto

El usuario quiere que `/cuentas` se comporte en móvil como una app de banca o
como Contraseñas de Apple:

1. **Un solo desbloqueo por estancia en la app**. Al entrar en Cuentas se pide
   desbloquear una vez; mientras se navega por Notas/Calendario/Perfil dentro de
   la app, la bóveda sigue abierta. Al salir de la app (cerrar, pasar a otra app
   o background), se bloquea y vuelve a pedir al volver a Cuentas.
2. **Biometría primero, contraseña después**. Se intenta Face ID / huella
   (passkey WebAuthn con PRF) y, si no está disponible o falla, se ofrece la
   master password. El objetivo es "desbloquear el móvil", no rellenar un
   formulario.
3. **Búsqueda cómoda una vez dentro**, por nombre, app/página, usuario o notas,
   con crear/ver/editar ya existentes y adaptados al móvil.

Hoy (`specs/cuentas/spec.md`, Fase 0) la bóveda es zero-knowledge y ya tiene
prácticamente toda la base: Argon2id + XChaCha20-Poly1305, passkey WebAuthn PRF,
búsqueda local, ABM/compartir y auto-bloqueo por inactividad. **Esta fase no
rehace el cifrado**: cambia el ciclo de vida del desbloqueo y la experiencia
móvil.

### Conflicto con la Fase 0 (requiere decisión explícita)

La spec aprobada en Fase 0 dice:

- **RF-4 / CA9**: auto-bloqueo por inactividad (5 min por defecto) y sesión solo
  en memoria del componente (`VaultApp`), que se destruye al desmontar la página.
- **RF-12 / CA12**: «Desbloqueo: aserción WebAuthn + TOTP + descifrado local.
  Sin TOTP no se desbloquea» y «Nunca se muestra «Desbloquear con huella» si no
  hay PRF verificado».

La petición actual cambia ambas cosas. La spec de esta fase las declara
**supersedidas solo para Fase 2**, y el usuario debe aprobarlo al aprobar la
spec. Las alternativas y su riesgo están en la sección «Decisiones pendientes».

## Enfoque técnico

### 1. Sesión de bóveda a nivel de app (no de página)

- Extraer el `session` de `VaultApp` a un **`VaultSessionProvider`** (cliente)
  montado en `AppShell` (dentro del layout raíz). El layout raíz no se desmonta
  al cambiar de pestaña, así que la clave descifrada sobrevive a la navegación
  Notas ↔ Cuentas ↔ Calendario ↔ Perfil.
- El provider expone `session`, `unlock(session)`, `lock(reason)` y el estado de
  bloqueo. Las claves siguen **solo en memoria** (`memzero` en `lock`), nunca en
  `localStorage`/`sessionStorage`.
- Escuchar `visibilitychange` (a `hidden`) y `pagehide` para `lock()`, y llamar
  a `POST /api/cuentas/lock` (ya existe) para limpiar el grant del servidor.
  Opcionalmente mantener un temporizador de inactividad largo como red de
  seguridad (ver decisión 2).
- Los datos descifrados de cuentas **no** se guardan en el provider: se
  vuelven a descifrar en local al montar `VaultWorkspace` (rápido y limita el
  tiempo que el plaintext está en memoria).

### 2. Desbloqueo biométrico-first

- Rediseñar `VaultUnlock` como pantalla de "desbloqueo de móvil":
  - Si hay passkey con PRF: al entrar se **intenta la aserción WebAuthn** (o se
    muestra un botón grande «Desbloquear con Face ID / Huella» si el navegador
    exige gesto del usuario). El error/cancelación no bloquea: aparece «Usar la
    master password».
  - Si no hay passkey o el dispositivo no soporta PRF: se muestra directamente
    el formulario de master password (que sigue exigiendo 2FA, como hoy).
  - Texto y jerarquía sobrios, coherentes con `specs/rediseno-inditex/spec.md`:
    título Jost 21 px en móvil, sin Bodoni duplicado, sin rojo decorativo.
- `authenticatePasskeyOnDevice` ya implementa PRF. Se añade un helper para
  detectar autenticador de plataforma y para distinguir cancelación de error.
- **TOTP en la vía biométrica**: ver decisión 1. Si se aprueba quitarlo, el
  endpoint `POST /api/cuentas/unlock/passkey` pasa a verificar solo WebAuthn
  (que ya usa `userVerification: required`, es decir posesión + biometría) y
  `passkeyUnlockSchema.code` pasa a ser opcional. La vía master password mantiene
  2FA. Se registran igualmente `UNLOCK_OK` / `UNLOCK_FAILED`.

### 3. Búsqueda y lista móvil

- La búsqueda ya existe en `VaultWorkspace` (título, usuario, URL, notas,
  categoría) y es **100 % local**, sin peticiones por pulsación. No se reescribe:
  se extrae a una función pura `filterAccounts()` para poder testearla, se fija
  arriba de la lista en móvil (sticky) y se aumenta el objetivo táctil.
- Añadir ordenación simple (Recientes / A–Z) solo si cabe sin recargar la
  interfaz; no es obligatoria.
- `AccountDialog`, `ShareDialog` y el resto de ABM/compartir **se conservan**.
  Solo se revisan clases y layout a 390 px.

### 4. Verificación

- Unitarias: ciclo de vida del provider (lock al ocultar/cerrar, memzero),
  `filterAccounts`, y esquema/ruta de passkey sin TOTP si aplica.
- E2E (Playwright, viewport móvil): desbloquear con password → ir a Notas →
  volver a Cuentas → **no vuelve a pedir desbloqueo**; simular background →
  vuelve a pedir; buscar por nombre y por URL filtra la lista.
- WebAuthn real (Face ID/huella) no se puede probar en Chromium de escritorio:
  se documenta como follow-up en dispositivo, sin presentarlo como verificado.
- Auditoría con skill `design-audit` a 390×844 sobre el flujo completo.

## Dependencias

- [x] Fase 1 cerrada (shell, tab bar y cabeceras móviles).
- [x] Fase 0 cerrada (bóveda zero-knowledge, passkey PRF, grant y ABM).
- [x] `@playwright/test` disponible y usado en Fase 1.
- [x] Aprobación de `specs/cuentas-movil/spec.md` (19 nov 2026), incluidas las
      decisiones que superseden la Fase 0: passkey sin TOTP, auto-bloqueo a
      15 min, auto-intento biométrico y sin swipe actions.
- [ ] Dispositivo con Face ID / huella para la verificación biométrica real
      (follow-up si no está disponible).

## Riesgos

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| El provider en el layout raíz no sobrevive a ciertas navegaciones | Baja | Alto | Montarlo en `AppShell` (layout raíz, cliente); E2E explícito de ida/vuelta a Notas |
| `navigator.credentials.get()` no se puede auto-lanzar al entrar en la página | Alta | Medio | Botón grande siempre visible; auto-intento solo como mejora, nunca bloqueante |
| Quitar el TOTP debilita la defensa en profundidad | Media | Alto | Decisión explícita del usuario; WebAuthn `userVerification: required`; la vía password sigue con 2FA; audit events |
| Passkeys antiguas sin `authenticatorAttachment: platform` | Media | Bajo | No invalidarlas; solo cambiar el registro de nuevas; fallback password siempre disponible |
| La clave quede en memoria más tiempo del debido | Media | Alto | `memzero` en `lock`, sin persistencia, lock en `visibilitychange`/`pagehide` |
| Búsqueda sobre `payload` no descifrado | Baja | Medio | Los registros no descifrables se excluyen si hay término (comportamiento actual) |
| No se pueda verificar biometría en escritorio | Alta | Medio | Registrar como follow-up honesto; no afirmar verificado en iOS/Android |
| Cambiar el endpoint de passkey rompa clientes antiguos | Baja | Medio | Hacer `code` opcional (no obligatorio) y mantener compatibilidad con clientes que lo envíen |

## Fuera de alcance

- Cambios en el modelo de datos, migraciones ni esquema Prisma.
- Rehacer el cifrado, el kit de recuperación, los contactos de confianza ni el
  motor de compartir.
- Login con passkey en casa-os (sigue siendo solo desbloqueo de bóveda).
- Búsqueda en servidor (el servidor nunca ve el término ni el plaintext).
- Tema oscuro o animaciones coreografiadas.
- Verificación en dispositivo real: se deja como follow-up documentado.

## Verificación final

- `npm run lint && npm run typecheck && npm run test && npm run build`.
- `npm run test:e2e` con login real contra BD local sembrada.
- Chrome MCP a 390×844 + informe con skill `design-audit`.
- CI del PR en verde, squash merge y cierre documental (Paso 8 de `AGENTS.md`).
