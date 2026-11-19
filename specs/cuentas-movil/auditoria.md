# Auditoría de diseño — Fase 2 (Cuentas móvil)

> Realizada con la skill `design-audit` el 19 nov 2026. Capturas nuevas con
> Chrome MCP en `http://127.0.0.1:3000`, viewport 390×844, sesión real contra BD
> local sembrada (bóveda con 2 cuentas y 2FA activo). Capturas guardadas en el
> directorio temporal de la sesión y referenciadas por nombre.

## Alcance y objetivo

- **Flujo auditado**: entrada a `/cuentas` bloqueada → desbloqueo con master
  password + 2FA → lista y búsqueda → ida a Notas y vuelta → salida de la app y
  nuevo bloqueo.
- **Objetivo del usuario**: desbloquear una vez, encontrar una cuenta por nombre
  o página y no volver a introducir la clave mientras siga en la app.
- **Modo**: combinada (UX + diseño visual + accesibilidad).
- **No verificado**: ruta biométrica Face ID/huella (no hay passkey registrada en
  este navegador ni autenticador real), dispositivos iOS/Android, teclado/lector
  de pantalla, tema oscuro y el temporizador real de 15 min.

## Veredicto

El ciclo de desbloqueo y la búsqueda funcionan y se leen bien en móvil; lo que
pide pulimiento es el espacio que ocupan los filtros antes de la primera cuenta
y una pequeña incoherencia en el copy del auto-bloqueo.

## Pasos del flujo

1. **Pantalla bloqueada** — `f2-01-locked.png` · **bueno**. Título Jost 21 px,
   eyebrow 13 px, sin wordmark duplicado y una sola acción principal. Al no haber
   passkey, se muestra directamente la master password.
2. **Bóveda abierta** — `f2-02-workspace.png` · **bueno**. Buscador visible,
   «Nueva cuenta» a la vista y dos tarjetas legibles a una columna.
3. **Vuelta desde Notas** — `f2-03-vuelta-sin-pedir.png` · **bueno**. No vuelve a
   aparecer la pantalla de desbloqueo: se cumple «una vez por estancia».
4. **Búsqueda por nombre/app** — `f2-04-busqueda.png` · **bueno**. Escribir
   «amazon» deja solo esa tarjeta, sin recarga ni petición adicional visible.
5. **Salida de la app** — `f2-05-background-lock.png` · **bueno**. Se bloquea y
   el aviso explica por qué; la contraseña no queda expuesta.

## Fortalezas

- Jerarquía editorial coherente con `specs/rediseno-inditex/spec.md`: Bodoni solo
  en el wordmark, Jost para títulos de pantalla, metadatos en 13 px color `ash`
  (pasos 1–5).
- Paleta cerrada, sin sombras, radios 0 y sin acentos de color: el único negro
  es la acción y el estado activo de la tab bar (pasos 1–5).
- El buscador queda arriba y el botón «Nueva cuenta» no exige desplazarse (paso 2).
- El aviso de bloqueo por background es explícito y no culpable al usuario (paso 5).
- Sin overflow horizontal: `scrollWidth - clientWidth = 0` a 390 px; sin errores
  en consola durante la sesión.

## Hallazgos por prioridad

- **[P2 → corregido] Los filtros empujaban la primera cuenta al final del pliegue.**
  Capturas: antes `f2-02-workspace.png`, después `f2-06-workspace-final.png`.
  Corrección aplicada: los dos `select` van en una fila de dos columnas en móvil
  (`grid-cols-2 sm:contents`), con `min-w-0` para que no desborden. La primera
  tarjeta entra ahora en el primer pliegue.

- **[P2 → corregido] Anillo de foco en la primera tarjeta tras desbloquear.**
  Capturas: antes `f2-02-workspace.png`, después `f2-06-workspace-final.png`.
  Corrección aplicada: `VaultApp` mueve el foco al buscador con
  `requestAnimationFrame` justo después de desbloquear; el cursor y el anillo se
  ven en el campo, no en una tarjeta.

- **[P3 → corregido] Copy del auto-bloqueo inconsistente.**
  Capturas: antes `f2-02-workspace.png`, después `f2-06-workspace-final.png`.
  El subtítulo dice ahora «se bloquea al salir de la app o tras 15 min», igual
  que la pantalla de desbloqueo.

- **[P3] Barra de desplazamiento visible en la pantalla bloqueada tras el aviso.**
  Captura: `f2-05-background-lock.png`. Qué se ve: una franja gris a la derecha.
  Es el scroll normal del documento, no un overflow horizontal; no bloquea.
  Solo valorar compactar el `py-8` inicial si se quiere eliminar.

## Riesgos de accesibilidad

- **Visible en capturas**: etiquetas en todos los campos, anillo de foco de 2 px,
  avisos con `role="status"`/`alert`, objetivo táctil del botón biométrico
  (planeado `min-h-14`) y del buscador (`min-h-11`), tab bar con zona segura.
- **Requiere prueba específica**: orden de lectura al aparecer el aviso de
  bloqueo, foco tras desbloquear, contraste de `ash` a 13 px y comportamiento del
  auto-intento WebAuthn con lector de pantalla. No se afirma cumplimiento WCAG
  completo desde capturas.

## Límites de evidencia

- No se registró ninguna passkey en este navegador, así que **no se capturó la
  pantalla con el botón «Desbloquear con Face ID / Huella»**. Solo se verificó el
  fallback de master password, que es el estado que corresponde a este equipo.
- El intento biométrico automático (decisión 3) no se pudo observar: Chromium de
  escritorio no aporta un autenticador de plataforma con PRF. Queda como
  follow-up en dispositivo real y no se presenta como verificado.
- No se esperaron 15 min para ver el auto-bloqueo por inactividad; ese caso se
  cubre con tests unitarios del `AutoLockController` y con el E2E de background.

## Checklist accionable

1. [x] Compactar los filtros en móvil (P2) — verificado en
      `f2-06-workspace-final.png`.
2. [x] Mover el foco al buscador tras desbloquear (P2) — misma captura.
3. [x] Unificar el copy de auto-bloqueo (P3) — misma captura.
4. [ ] Verificar en dispositivo real la ruta biométrica y el auto-intento antes
      de dar por cerrada la experiencia móvil de Cuentas.
