# Spec — Fase 2: Cuentas móvil

**Estado:** aprobada el 2026-11-19
**Feature:** `cuentas-movil`
**Depende de:** Fase 0 (`specs/cuentas/spec.md`, bóveda zero-knowledge) y Fase 1
(`specs/fundacion-movil/spec.md`, shell y tab bar)

## Objetivo

Que `/cuentas` se use en móvil como una app de banca o como Contraseñas de
Apple: **un desbloqueo por estancia en la app**, con biometría primero y
contraseña como respaldo, y una búsqueda inmediata una vez dentro. Sin tocar el
cifrado, el modelo de datos ni el resto de funcionalidad ya cerrada.

## Relación con la Fase 0 (cambios que se proponen)

Esta spec **supersede** estas decisiones de `specs/cuentas/spec.md` solo para
Fase 2, y requiere aprobación explícita:

| Fase 0 | Fase 2 (aprobado) |
|---|---|
| RF-4/CA9: auto-bloqueo a los 5 min de inactividad; sesión en el estado local de `VaultApp`, se destruye al salir de la página | Sesión en un provider del layout raíz: sigue abierta al cambiar de pestaña; se bloquea al salir/background de la app **o tras 15 min de inactividad** (decisión 2 = B) |
| RF-12/CA12: desbloqueo con passkey = WebAuthn **+ TOTP** siempre | Desbloqueo con passkey = **solo WebAuthn** (decisión 1 = A); la master password sigue exigiendo TOTP |

Ambos cambios han sido aprobados explícitamente por el usuario el 19 nov 2026.
El resto de la spec de Fase 0 (cifrado, recuperación, compartir, 2FA para
crear/recuperar) se mantiene intacto.

## Requisitos funcionales

1. **RF1 — Un desbloqueo por estancia en la app.** Al entrar en `/cuentas` con la
   bóveda bloqueada se pide desbloquear una vez. Una vez desbloqueada, navegar a
   Notas, Calendario o Perfil y volver **no vuelve a pedir** la clave. La sesión
   se mantiene mientras la app siga en primer plano.
2. **RF2 — Bloqueo al salir o por inactividad.** Al cerrar la pestaña, background
   (cambiar de app, pantalla bloqueada), acción explícita «Bloquear» o **15 min
   de inactividad**, se destruyen las claves en memoria (`memzero`) y se limpia
   el grant del servidor. Al volver a Cuentas se pide desbloquear de nuevo.
   Cambiar de pestaña dentro de casa-os no cuenta como salida.
3. **RF3 — Biometría primero, con auto-intento.** Si hay una passkey con PRF
   registrada en este dispositivo, la pantalla de desbloqueo ofrece
   «Desbloquear con Face ID / Huella» de forma prioritaria y **lanza la aserción
   WebAuthn al entrar** (decisión 3 = A); si el navegador exige gesto del
   usuario, el botón queda a un toque. Si el autenticador falta, no soporta PRF,
   cancela o falla, se ofrece sin fricción la vía de la master password.
4. **RF4 — Contraseña como respaldo.** El formulario de master password sigue
   funcionando y sigue exigiendo el código 2FA/TOTP. «He olvidado la master
   password» continúa disponible. Si no hay passkey, es la vía principal.
5. **RF5 — Búsqueda inmediata.** Una vez desbloqueada, la lista permite buscar
   por título/nombre, usuario, URL o página/app, notas y categoría, sin peticiones
   al servidor por pulsación. El campo de búsqueda queda fijo y visible en móvil.
6. **RF6 — ABM y compartir intactos.** Crear, ver, editar, borrar y compartir
   cuentas funcionan igual que en Fase 0; solo se revisa su layouts a 390 px. No
   se añaden nuevos campos ni flujos.
7. **RF7 — Avisos y estados claros.** La pantalla distingue: bóveda bloqueada,
   desbloqueo en curso, credenciales incorrectas, sin passkey, PRF no soportado,
   bóveda caducada y bóveda vacía. Los errores son genéricos y no filtran
   detalles de seguridad; una cancelación del usuario no se muestra como error.
8. **RF8 — Accesibilidad móvil.** Objetivos táctiles ≥ 44 px, foco visible,
   `aria-label` en el campo de búsqueda y en el botón biométrico, mensajes de
   estado con `role="status"`/`aria-live` y `prefers-reduced-motion` respetado.

## Requisitos no funcionales

- **Seguridad**: las claves descifradas y los secretos solo en memoria; nunca en
  `localStorage`, `sessionStorage`, cookies ni logs. `memzero` al bloquear.
  La verificación biométrica usa WebAuthn con `userVerification: 'required'`.
  Se conservan rate limiting y eventos de auditoría (`UNLOCK_OK`,
  `UNLOCK_FAILED`, `RATE_LIMITED`).
- **Rendimiento**: sin peticiones por pulsación en la búsqueda; el descifrado
  local de la lista ocurre al entrar a Cuentas, no en cada cambio de pestaña.
- **UX**: una mano, sin sombras, radios 0, paleta cerrada (`canvas`, `ink`,
  `ash`, `mist`, `pearl`); rojo `alarm` solo para error.
- **Compatibilidad**: las passkeys ya registradas siguen funcionando; el
  endpoint acepta peticiones con y sin código 2FA según la decisión 1.

## API / Endpoints

### `POST /api/cuentas/unlock/passkey` (modificado)

- **Auth**: sí (sesión de casa-os), 2FA activado.
- **Body**: `{ response, code? }`. `code` pasa a ser **opcional** (decisión 1 = A):
  la biometría ya aporta posesión + verificación de usuario. Se aceptan también
  peticiones antiguas que envíen `code`.
- **Response**: `200` con el vault blob y el `passkeyKeyring`, más el grant;
  `401` si falla la verificación, `403` sin 2FA, `429` si hay rate limit.
- Sin cambios en `GET /api/cuentas/status` ni en `POST /api/cuentas/lock`, que
  ya exponen `grantActive` y limpian el grant respectivamente.

### Sin nuevos endpoints

No se añaden rutas ni campos. La búsqueda y el descifrado son locales.

## Modelo de datos

Ninguno. Sin migraciones ni cambios en `prisma/schema.prisma`.

## UI / UX

### Pantalla de desbloqueo (bloqueada)

```
Cuentas                         ← eyebrow 13 px ash
Desbloquea tus cuentas.         ← Jost 21 px (Bodoni solo en md:)
[  ◉  Desbloquear con Face ID / Huella  ]   ← botón principal si hay passkey
   Usar la master password                 ← enlace, siempre disponible
```

- Al entrar: si hay passkey con PRF, se lanza la aserción WebAuthn en cuanto
  sea posible (decisión 3 = A); si el navegador exige gesto, queda el botón
  principal a un toque.
- Cancelar la biometría vuelve al estado anterior sin mensaje de error.
- Sin passkey: se muestra directamente el formulario de master password + 2FA.

### Sesión dentro de la app

```
AppShell (layout raíz)
└── VaultSessionProvider       ← session en memoria; escucha visibilitychange / pagehide
    └── /cuentas → VaultApp    ← consume el provider
    └── /notas, /calendario, /perfil  ← no desmontan el provider
```

- Ir a otra pestaña **no** bloquea.
- Pasar a otra app / bloquear la pantalla / cerrar la pestaña **sí** bloquea.
- El botón «Bloquear» de la bóveda sigue disponible.

### Lista desbloqueada

- Buscador fijo arriba con placeholder «Buscar por nombre, app o página».
- Tarjetas de una columna a 390 px: título, usuario, categoría y visibilidad.
- «Nueva cuenta» accesible sin desplazamiento excesivo; se mantiene
  `AccountDialog` / `ShareDialog`.

## Criterios de aceptación

- [ ] Al entrar en `/cuentas` se pide desbloquear una sola vez.
- [ ] Desbloquear y navegar a Notas → Calendario → Perfil → volver a Cuentas no
      vuelve a mostrar la pantalla de desbloqueo (verificado con E2E).
- [ ] Simular salida de la app (visibilitychange a `hidden` / cerrar pestaña)
      bloquea la bóveda; al volver se pide de nuevo.
- [ ] Tras 15 min de inactividad la bóveda se bloquea también con la app abierta.
- [ ] Con passkey PRF, se intenta la biométrica al entrar y el botón aparece
      primero; si falla o se cancela, se puede usar la master password sin
      recargar y sin escribir TOTP en la vía biométrica.
- [ ] Con master password se sigue exigiendo 2FA y se mantiene «He olvidado…».
- [ ] La búsqueda filtra por título, usuario, URL/app, notas y categoría sin
      peticiones de red por pulsación.
- [ ] Crear, ver, editar, borrar y compartir siguen funcionando a 390 px.
- [ ] No hay cambios en BD, migraciones, login de casa-os ni motor de cifrado.
- [ ] Claves nunca persisten; `memzero` y limpieza de grant verificados.
- [ ] `npm run lint && npm run typecheck && npm run test && npm run build` pasan.
- [ ] E2E y auditoría `design-audit` con capturas a 390×844 documentados.
- [ ] CI del PR en verde y cierre documental completado.

## Decisiones aprobadas (2026-11-19)

1. **TOTP con la vía biométrica → A: quitarlo solo para passkey.** Un paso, como
   desbloquear el móvil. WebAuthn ya exige verificación de usuario (posesión +
   biometría/PIN del dispositivo). La master password **sí** sigue pidiendo 2FA.
   Riesgo aceptado: menos defensa en profundidad si el PIN del dispositivo es
   débil; se mitiga con el temporizador de 15 min y los eventos de auditoría.
2. **Inactividad → B: temporizador largo de 15 min.** Sigue siendo «una vez»
   en el uso normal, pero se bloquea si dejas la app abierta y abandonada.
   Coincide con el TTL del grant de Fase 0. Se sustituye el valor actual de
   5 min (`DEFAULT_AUTO_LOCK_MINUTES`) por 15.
3. **Auto-lanzamiento de la biometría → A: intentarlo al entrar.** Se lanza
   WebAuthn en cuanto sea posible; el botón permanece visible para navegadores
   que exigen gesto del usuario o si el auto-intento falla/cancela.
4. **Alcance de la lista → solo buscador + lista móvil.** Sin acciones al
   deslizar: se conserva el buscador local y el ABM existente, adaptados a
   390 px. Quedan fuera del alcance los swipe actions.

## Supuestos

- «Salir de la app» = background, cierre de pestaña o bloqueo de pantalla;
  **no** cambiar de pestaña dentro de casa-os.
- La autenticación de casa-os (NextAuth) no cambia: la passkey sigue siendo
  solo para la bóveda.
- No se dispone de Face ID/huella en el entorno de desarrollo; la verificación
  biométrica real queda como follow-up documentado, igual que en Fase 1.
