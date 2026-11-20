# Plan — Fase 5: Dispositivos y red en móvil

## Contexto

El roadmap vivo (`MEMORY.md` → *Fase 5*) pide «`/devices` en móvil (lista, no
tabla de escritorio)» y «escaneo de red e importación JSON (ajuste UI móvil)».
El usuario quiere gestionar el inventario de casa desde el móvil con una mano.

**Hallazgo que ajusta el alcance:** `/devices` **ya no es una tabla**. Es una
`<ul>` de tarjetas flexibles (`DeviceManager.tsx:189-305`) que pasó revisiones a
390 px en tres cierres (`dispositivos-crud`, `dispositivos-estado`,
`escaneo-red`). No hay scroll horizontal. Lo que falta no es convertir una
tabla en lista, sino completar los patrones móviles que ya se aplicaron en
Fases 3 y 4:

- No hay separación de vistas por breakpoint ni `useIsMobile`: un solo
  componente con clases `md:` para todo.
- El formulario de alta/edición y el panel de importación son **bloques en
  flujo**: empujan la lista, no tienen hoja inferior, safe-area ni foco
  gestionado.
- No hay FAB. Los botones «Añadir dispositivo» / «Importar escaneo» están en la
  cabecera y miden ~41 px; «Editar», «Eliminar», «Sí», «No», «Cerrar» y los
  checkboxes de importación son de 16-20 px.
- El `<h1>` usa `font-display text-5xl` en móvil; la regla global
  `h1,h2,h3,h4 → font-display` de `globals.css` rompe la regla Jost 21 px de
  la Fase 1.
- El comando `npm run scan -- --out scan-latest.json` se muestra en un `<code>`
  con `break-words`, pero no se puede copiar desde el móvil (no hay `npm` ni
  `nmap` en el teléfono).
- **No existe ningún E2E de devices** ni `data-testid` en la vista móvil.
- El wrapper de la página usa `animate-fade-rise`, que deja un `transform` y
  ancla cualquier `position: fixed` al div en vez del viewport (fallo P1 real
  de la Fase 4: FAB a 1181 px). Cualquier FAB nuevo debe portarse a `body`.

La base funcional está cerrada y en producción: CRUD con IP/MAC únicas,
normalización de MAC, estados online/ausente con reglas conservadoras,
importación con `dryRun`, preview y deduplicación, roles ADMIN/FAMILY y escaneo
`nmap` **solo en local**. **Esta fase no rehace nada de eso.**

## Enfoque técnico

### 1. Un solo breakpoint y una sola vista montada

`DeviceManager` pasa a ser `DeviceLayout` (dueño del estado: `error`, `pending`,
`creating`, `importingScan`, `editingId`, `confirmingId`) y delega el render en
`DeviceMobileView` / `DeviceDesktopView` usando el hook compartido
`src/components/mobile/useIsMobile.ts` (`< 1024px`). Un solo árbol montado por
breakpoint evita dos `DeviceForm` con ids duplicados (`useId`) y effects
compitiendo. El marcado actual se extrae sin cambiar su lógica: la vista de
escritorio conserva sus clases `md:`.

### 2. Lista móvil con FAB portalado

La tarjeta de dispositivo se adapta a una sola columna con nombre/tipo/estado,
datos en dos líneas y acciones separadas. En móvil se añade un **FAB (+) con
createPortal a `body`** tras `mounted`, siguiendo el patrón de
`CalendarMobileView.tsx`, que abre una pequeña hoja de acciones con dos opciones:
«Añadir dispositivo» y «Importar escaneo» (solo ADMIN). El FAB queda sobre la
tab bar y `env(safe-area-inset-bottom)`; la lista añade `padding-bottom`.
FAMILY sigue viendo la lista completa y el aviso de solo lectura, sin FAB.

### 3. Formulario y panel de importación como hojas inferiores

- `DeviceForm` se convierte en hoja inferior portalada (`role="dialog"`,
  `aria-modal`, `data-mobile-panel`, scrim, Escape, foco inicial, bloqueo de
  scroll de `body`, `pb-[calc(1rem+env(safe-area-inset-bottom))]`). Campos en
  una columna y acciones pegajosas ≥ 44 px. En escritorio se mantiene el
  formulario inline actual.
- `ScanImportPanel` recibe el mismo tratamiento: hoja inferior en móvil con
  `data-testid="devices-mobile-scan-preview"`, file input y checkboxes ≥ 44 px,
  resumen y «Estado tras aplicar» intactos, y acciones pegajosas. En escritorio
  sigue siendo el `card` en flujo de hoy. El flujo de dos peticiones
  (`dryRun: true` → preview → `dryRun: false`) y la validación Zod no cambian.

### 4. Comando de escaneo copiable y texto honesto

Junto al `<code>` del comando se añade un botón «Copiar comando» que usa
`navigator.clipboard.writeText` con fallback y estado anunciado
(`role="status"`). El texto deja claro que `nmap` corre en un ordenador de la
red de casa y que el JSON se elige desde el móvil (AirDrop/Drive/correo). No se
añade campo para pegar JSON: sería una superficie de validación nueva. No se
pone botón «Escanear» en la app (Vercel no puede ver la red local).

### 5. Objetivos táctiles, tipografía y accesibilidad

Reglas en `globals.css` bajo `@media (max-width: 1023px)` para:
`.date-nav`-equivalentes, botones de acción de lista, `.btn`, `.input`,
file input y checkboxes ≥ 44 px; `[data-mobile-panel] .panel-actions` pegajosas
(ya existe el patrón). `font-ui` explícito en el `<h1>` móvil y en los títulos
de las hojas, dejando Bodoni para `md:`. Sin desbordamiento a 390 px, foco
visible de 2 px, `aria-live` en estados y paleta cerrada.

### 6. Verificación

- Unitarias: se reutilizan las existentes de `device`, `deviceStatus`, `scan` y
  schemas sin cambiar su semántica. Solo se añade una función pura si hace
  falta para el copiado (se evita).
- E2E nuevo `tests/e2e/dispositivos-movil.spec.ts` con login real (Pixel 7 /
  Chromium, `workers: 1`, `globalSetup` compartido): entrada a la lista,
  alta con FAB, edición y borrado en dos pasos, importación con un fixture JSON
  (preview → aplicar), visibilidad de FAMILY, deep link/limpitez mediante
  `tests/e2e/helpers/devices-setup.ts` con ids/IPs deterministas (cuidado con
  409 por IP/MAC únicas), objetivos ≥ 44 px y sin overflow. El comando copiado
  se comprueba con permisos de clipboard o leyendo el botón de estado.
- Auditoría visual con la skill `design-audit` a 390×844 sobre el flujo
  completo (lista → alta → edición → importación → FAMILY), con capturas.
- Sin cambios en `prisma/schema.prisma`, migraciones, esquemas Zod, API, auth ni
  navegación global. Sin añadir dependencias.

## Decisiones aprobadas

Ver `spec.md` → *Decisiones aprobadas (2026-11-20)*. El usuario aprobó la opción
A en las seis: mantener la lista con vistas separadas, FAB portalado con dos
acciones, formulario e importación en hojas inferiores, subida de archivo con
comando copiable y sin reloj de frescura en cliente.

## Dependencias

- [x] Fases 1-4 cerradas: shell, tab bar, vistas por breakpoint, hook compartido,
  FAB portalado, hojas inferiores y auditoría visual.
- [x] CRUD/estado/escaneo de dispositivos cerrado y en producción
  (`specs/dispositivos-crud`, `dispositivos-estado`, `escaneo-red`).
- [x] `@playwright/test` y la skill `design-audit` disponibles.
- [ ] Aprobación de `specs/dispositivos-movil/spec.md` por el usuario.

## Riesgos

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| Partir `DeviceManager` en dos vistas rompa el estado | Media | Alto | `DeviceLayout` dueño único, `sharedProps`, un solo árbol montado |
| FAB anclado al wrapper animado | Alta | Alto | `createPortal` a `body` tras `mounted`, patrón de Fase 4 |
| Hoja de importación con 512 filas sea larga | Media | Medio | Conservar el resumen y «Estado tras aplicar» arriba; no virtualizar (fuera de alcance) y documentar |
| File picker móvil no muestre `.json` | Media | Medio | Mantener `accept` actual y añadir texto con el nombre de archivo esperado; no cambiar el schema |
| Colisiones IP/MAC en fixtures E2E | Alta | Medio | Ids/IPs deterministas con upsert y limpieza explícita en `devices-setup.ts` |
| Cambiar el formulario rompa la validación | Baja | Alto | Reutilizar `DeviceForm` y `createDeviceSchema`/`updateDeviceSchema` sin tocarlos |
| Creer que el escaneo ocurre en la app | Media | Bajo | Copy explícito + botón «Copiar comando»; sin botón «Escanear» |
| FAMILY vea acciones de ADMIN | Baja | Alto | `isAdmin` en ambas vistas y FAB solo ADMIN; defensa `requireAdmin` intacta en API |

## Fuera de alcance

- Cambios en `prisma/schema.prisma`, migraciones, esquemas Zod, API, auth ni
  navegación global (`/devices` sigue en el drawer «Más» de Perfil).
- Ejecutar `nmap` desde la app, cron, push de estado, reloj en tiempo real ni
  historial de cambios.
- Recibir JSON pegado como texto, drag & drop ni exportación.
- Virtualizar el preview de 512 filas ni cambiar las reglas de importación.
- Verificación en dispositivo real iOS/Android: follow-up documentado como en
  Fases 1-4.

## Verificación final

- `npm run lint && npm run typecheck && npm run test && npm run build`.
- `npm run test:e2e` con login real contra la BD local sembrada.
- Chrome MCP a 390×844 + informe con la skill `design-audit`.
- CI del PR en verde, squash merge y cierre documental (Paso 8 de `AGENTS.md`).
