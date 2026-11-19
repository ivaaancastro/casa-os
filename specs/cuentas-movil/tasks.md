# Tasks — Fase 2: Cuentas móvil

Ordenadas por dependencia. Checkboxes marcados solo con verificación real; lo no
verificado se mueve a `cierre.md` → follow-ups.

## Fase 0 — Preparación

- [x] 1. Confirmar rama `feat/cuentas-movil` desde `main` actualizado, sin PRs
      abiertos y con `spec.md` aprobada (19 nov 2026). Archivos: git.

## Fase 1 — Sesión a nivel de app

- [x] 2. Crear `src/components/cuentas/VaultSessionProvider.tsx` (cliente):
      contexto con `session`, `unlock`, `lock`; auto-bloqueo a los **15 min** de
      inactividad (sustituye el valor de 5 min de `constants.ts`), `memzero` en
      `lock`, escucha `visibilitychange`→`hidden` y `pagehide`, y llama a
      `POST /api/cuentas/lock`. Sin persistencia en storage. Archivos: nuevo
      provider + `src/lib/vault/constants.ts`.
- [x] 3. Montar el provider en `src/components/AppShell.tsx` y refactorizar
      `src/components/cuentas/VaultApp.tsx` para consumirlo en lugar de su
      `useState` local. Conservar estados de carga/error/onboarding/recuperación
      y el aviso de grant caducado. El provider está en el layout raíz: navegar
      entre pestañas no lo desmonta.
- [x] 4. Test unitario del ciclo de vida del provider en
      `tests/vault-session.test.ts`: lock al ocultar/cerrar, lock por inactividad
      con temporizadores falsos, `memzero` de la clave y limpieza del grant.
- [x] 5. Ajustar el copy del auto-bloqueo en `VaultApp`/`VaultWorkspace`/settings
      para que diga 15 min en lugar de «unos minutos».

## Fase 2 — Desbloqueo biométrico-first

- [x] 6. Servidor: en `src/lib/vault/schemas.ts` hacer `code` opcional en
      `passkeyUnlockSchema`, y en `src/app/api/cuentas/unlock/passkey/route.ts`
      verificar solo WebAuthn (sin `verifySecondFactor`), manteniendo rate
      limit, eventos `UNLOCK_OK`/`UNLOCK_FAILED` y compatibilidad con clientes
      que envíen código. La vía password (`unlock/route.ts`) conserva 2FA.
      Actualizar `tests/api/vault.schemas.test.ts` y cualquier test de ruta.
- [x] 7. En `src/components/cuentas/passkey.ts` añadir helpers para detectar
      autenticador de plataforma disponible y distinguir cancelación del usuario
      de error real; documentar que el auto-intento es best-effort.
- [x] 8. Rediseñar `src/components/cuentas/VaultUnlock.tsx` a móvil: botón
      «Desbloquear con Face ID / Huella» prioritario con auto-intento al montar,
      enlace «Usar la master password» siempre visible, estados (bloqueada,
      esperando autenticador, error, sin passkey, PRF no soportado), cancelación
      silenciosa y `aria-live`. Sin TOTP en la vía biométrica; 2FA intacto en la
      vía password. Sin Bodoni duplicado, título Jost 21 px en móvil.

## Fase 3 — Búsqueda y lista móvil (sin swipe actions)

- [x] 9. Extraer la lógica de filtrado de `VaultWorkspace.tsx` a una función pura
      `src/components/cuentas/search.ts` (`filterAccounts(accounts, {query,
      category, visibility})` o equivalente) y añadir `tests/vault-search.test.ts`
      con título, usuario, URL/app, notas, categoría y compatibilidad con
      registros no descifrables. Sin cambiar el comportamiento actual.
- [x] 10. Adaptar `src/components/cuentas/VaultWorkspace.tsx` a 390 px: buscador
      fijo arriba (placeholder «Buscar por nombre, app o página»), tarjetas a una
      columna, cabecera Jost 21 px, «Nueva cuenta» accesible, filtros legibles.
      Conservar `AccountDialog`, `ShareDialog` y `VaultSettings` sin cambios
      funcionales. No añadir swipe actions.

## Fase 4 — Tests y verificación

- [x] 11. Preparar helper de setup E2E (2FA + bóveda con password conocida) en
      `tests/e2e/helpers/` y añadir `tests/e2e/cuentas-movil.spec.ts`: desbloquear
      con password, ir a Notas y volver **sin que vuelva a pedir**, simular
      `visibilitychange` a `hidden` y comprobar que vuelve a pedir, y buscar por
      nombre y por URL filtrando la lista. `playwright.config.ts` sigue con
      Chromium/Pixel 7.
- [x] 12. Ejecutar `npm run lint && npm run typecheck && npm run test && npm run build`.
      Corregir cualquier fallo antes de continuar.
- [x] 13. Ejecutar `npm run test:e2e` contra la BD local levantada y sembrada;
      reiniciar `next dev` si `next build` sobrescribió `.next` (lección Fase 1).
- [x] 14. Verificación de UI con Chrome MCP a 390×844: desbloqueo, ida/vuelta de
      pestañas, bloqueo por background y búsqueda; sin errores de consola ni
      overflow horizontal.
- [x] 15. Auditoría con la skill `design-audit` sobre esas capturas; guardar
      `specs/cuentas-movil/auditoria.md` y corregir P0/P1 (P2 si es bajo coste).

## Fase 5 — Entrega y cierre

- [ ] 16. Commits atómicos, push y PR referencing la spec; CI en verde; squash
      merge y borrado de rama.
- [ ] 17. Cierre documental (PR `docs/cierre-cuentas-movil`): `cierre.md`,
      `MEMORY.md`, `CHANGELOG.md`, `README.md`, `docs/roadmap.md` y
      `npm run docs:check -- cuentas-movil`. La verificación biométrica en
      dispositivo real (Face ID/huella) queda como follow-up honesto: Chromium no
      puede probarla y no se presenta como verificada.
