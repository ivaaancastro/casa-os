# Spec — Fase 5: Dispositivos y red en móvil

**Estado:** aprobada el 2026-11-20
**Feature:** `dispositivos-movil`
**Depende de:** Fases 1-4 (`fundacion-movil`, `cuentas-movil`, `notas-movil`,
`calendario-movil`) y de las features cerradas `dispositivos-crud`,
`dispositivos-estado` y `escaneo-red`

## Objetivo

Que `/devices` se use con una mano en el móvil: ver el inventario como tarjetas,
dar de alta/editar/borrar desde una hoja inferior, importar un escaneo con el
mismo flujo de preview y copiar el comando `nmap` sin teclado. Se reutiliza toda
la lógica cerrada (CRUD, IP/MAC únicas, estados, `dryRun`, roles); solo se
completa la presentación móvil y se verifica.

> **Aclaración de alcance:** el roadmap dice «lista, no tabla de escritorio».
> Hoy **ya es una lista** (`<ul>` de tarjetas en `DeviceManager.tsx`), sin
> desbordamiento horizontal y revisada a 390 px en tres cierres. Esta fase **no
> reescribe esa lista ni su dominio**: añade el patrón de vistas por breakpoint,
> hojas inferiores, FAB portalado, objetivos táctiles y la cobertura E2E/visual
> que nunca tuvo.

## Situación actual (lo que cambia)

| Hoy en móvil | Fase 5 |
|---|---|
| Un solo `DeviceManager` con clases `md:` | `DeviceLayout` + `DeviceMobileView` / `DeviceDesktopView`, un solo árbol montado |
| Sin FAB; «Añadir dispositivo» e «Importar escaneo» en la cabecera (~41 px) | FAB portalado a `body` que abre dos acciones táctiles |
| `DeviceForm` inline de 6 campos empuja la lista | Hoja inferior con campos apilados y acciones pegajosas |
| `ScanImportPanel` es un `card` en flujo, sin safe-area | Hoja inferior con `data-mobile-panel`, checkboxes ≥ 44 px y acciones pegajosas |
| Comando `nmap` visible pero no copiable | Botón «Copiar comando» con estado anunciado |
| `<h1>` en Bodoni 48 px | Jost 21 px en móvil; Bodoni solo en `md:` |
| Editar/Eliminar/Sí/No/Cerrar de 16-20 px | Objetivos ≥ 44 px |
| Sin `data-testid` ni E2E de devices | `devices-mobile-list` y `devices-mobile-scan-preview` + E2E con login real |

El escritorio conserva el layout actual (lista con filas `md:flex-row`,
formulario inline y panel de importación en tarjeta).

## Requisitos funcionales

1. **RF1 — Breakpoint único y una sola vista.** `DeviceLayout` usa el hook
   compartido `useIsMobile()` (`< 1024px`) y monta solo `DeviceMobileView` o
   `DeviceDesktopView`. Sigue siendo dueño de `error`, `pending`, `creating`,
   `importingScan`, `editingId` y `confirmingId`. Sin dos `DeviceForm` montados
   ni ids duplicados.
2. **RF2 — Lista móvil.** Se conserva el orden alfabético, nombre/tipo/estado,
   IP/MAC/propietario, notas y el aviso de frescura > 24 h. En móvil cada
   tarjeta ocupa una columna, con `data-testid="devices-mobile-list"` y
   acciones de ≥ 44 px. Sin desbordamiento horizontal a 390 px.
3. **RF3 — FAB portalado.** Un FAB (+) en móvil, creado con `createPortal` a
   `body` tras `mounted` (el wrapper `animate-fade-rise` rompe `position:
   fixed`), sobre la tab bar y `env(safe-area-inset-bottom)`. Abre una hoja de
   acciones con «Añadir dispositivo» e «Importar escaneo», mutuamente
   excluyentes. Solo ADMIN; FAMILY no ve el FAB.
4. **RF4 — Formulario táctil.** `DeviceForm` en móvil se convierte en hoja
   inferior portalada (`role="dialog"`, `aria-modal`, `data-mobile-panel`,
   scrim, Escape, foco inicial, bloqueo de scroll, safe-area), con los seis
   campos en una columna y acciones pegajosas ≥ 44 px. Se conservan la
   validación local, `useId`, el envío `POST /api/devices` / `PATCH
   /api/devices/[id]` y el borrado en dos pasos «¿Eliminar? · Sí / No». En
   escritorio el formulario sigue inline.
5. **RF5 — Importación táctil.** `ScanImportPanel` se convierte en hoja inferior
   en móvil con `data-testid="devices-mobile-scan-preview"`, file input y
   checkboxes ≥ 44 px, resumen, «Estado tras aplicar», avisos de escaneo
   antiguo/sin CIDR y acciones pegajosas. El flujo `dryRun: true` → preview →
   `dryRun: false`, el límite de 1 MB, las 512 filas y los schemas quedan
   intactos. En escritorio sigue siendo un `card` en flujo.
6. **RF6 — Comando copiable.** Junto al `<code>` se añade «Copiar comando» que
   copia `npm run scan -- --out scan-latest.json` con `navigator.clipboard`
   (fallback si no está disponible) y anuncia el resultado con
   `role="status"`. El texto explica que `nmap` corre en un ordenador de la red
   de casa y que el JSON se elige desde el móvil. No se añade campo para pegar
   JSON ni botón «Escanear» en la app.
7. **RF7 — Permisos intactos.** ADMIN ve FAB, alta, edición, borrado e
   importación; FAMILY ve la lista completa y el aviso «Solo los
   administradores pueden editar el inventario.». La defensa `requireAdmin`
   (403) en las tres rutas no cambia.
8. **RF8 — Accesibilidad y estética.** Objetivos ≥ 44 px en botones de lista,
   hojas, file input y checkboxes; foco visible de 2 px; `aria-live`/`role`
   en estados; `prefers-reduced-motion` respetado; Jost 21 px en cabecera y
   títulos móviles, Bodoni solo en `md:`; paleta cerrada, radios 0, sin sombras
   decorativas, rojo `alarm` solo en error/eliminación.
9. **RF9 — Sin cambios de datos ni API.** No se añaden modelos, migraciones,
   endpoints, campos ni dependencias. `device.ts`, `deviceStatus.ts`, `scan.ts`,
   los schemas Zod, `scripts/scan-network.ts` y las rutas API quedan intactos.
10. **RF10 — Evidencia.** E2E con login real y auditoría `design-audit` a
    390×844 con capturas; lo que no se pueda verificar (iOS/Android, `nmap`
    real, smoke autenticado en producción) se documenta como follow-up.

## Requisitos no funcionales

- **Rendimiento**: el preview sigue siendo un solo POST de `dryRun` y otro de
  aplicación; no se pide por fila ni se virtualiza (fuera de alcance).
- **Compatibilidad**: los dispositivos existentes, sus IP/MAC únicas, estados y
  notas se muestran y editan igual que hoy; el escritorio no se reescribe.
- **UX**: una mano, sin sombras, tab bar siempre visible; FAB y hojas por
  encima de la zona segura.
- **Seguridad**: el escaneo sigue ejecutándose solo en local; la app nunca
  llama a `nmap` ni recibe credenciales de red.

## API / Endpoints

Ninguno nuevo. Se reutilizan:

- `GET /api/devices` (carga inicial en servidor), `POST /api/devices`,
  `PATCH /api/devices/[id]`, `DELETE /api/devices/[id]`.
- `POST /api/devices/import` (preview `dryRun: true` y aplicación `dryRun: false`).

## Modelo de datos

Ninguno. Sin migraciones ni cambios en `prisma/schema.prisma`.

## UI / UX

### Lista (entrada en móvil)

```
Dispositivos                        ← Jost 21 px; contadores en ash
[En línea · N]  [Visto hace X]      ← aviso de frescura si aplica
────────────────────────────────
Router de casa                      ← tarjeta ≥ 88 px
  Router · En línea · visto hace 5 min
  IP · 192.168.1.1   MAC · AA:BB:…
  Propietario · Iván
  [ Editar ]  [ Eliminar ]          ← ≥ 44 px (solo ADMIN)
...
                          [  +  ]   ← FAB portalado a body
```

### Hoja inferior (alta / edición / importación)

```
┌───────────────────────────────┐
│  Añadir dispositivo      [×]  │  ← Jost 21 px, portal a body
│  Nombre                       │
│  IP                           │
│  MAC (opcional)               │
│  Tipo / Propietario           │
│  Notas (opcional)             │
│  [ Guardar ]   [ Cancelar ]   │  ← pegajosas, ≥ 44 px
└───────────────────────────────┘  + safe-area-inset-bottom
```

## Criterios de aceptación

- [x] Entrar en `/devices` a 390 px muestra la lista de tarjetas con
      `devices-mobile-list` y sin desbordamiento horizontal (E2E + captura).
- [x] Solo se monta una vista por breakpoint; `DeviceLayout` conserva el estado
      al abrir/cerrar hojas (revisión de código + E2E).
- [x] El FAB está portalado a `body`, flota sobre la tab bar y abre las dos
      acciones; no se ancla al wrapper animado (medición en Chrome + E2E).
- [x] FAMILY no ve el FAB ni acciones de edición/importación (E2E con ese rol
      o revisión del guard en UI; la API ya está cubierta).
- [x] Alta y edición funcionan desde la hoja inferior; borrado en dos pasos;
      el dispositivo aparece/desaparece de la lista (E2E + captura).
- [x] La importación muestra preview y «Estado tras aplicar» en la hoja
      inferior con un fixture JSON, y aplica los cambios (E2E + captura).
- [x] «Copiar comando» copia el comando y anuncia el resultado (E2E con
      clipboard permitido + captura del estado).
- [x] Todos los botones/file input/checkboxes nuevos miden ≥ 44 px y el
      `<h1>` móvil usa Jost (medición en Chrome + captura).
- [x] Sin desbordamiento horizontal, sin errores en consola y con foco visible
      en los controles nuevos (Chrome MCP / auditoría).
- [x] No hay cambios en BD, migraciones, schemas, auth ni API (revisión de diff).
- [x] `npm run lint && npm run typecheck && npm run test && npm run build` pasan.
- [x] E2E y auditoría `design-audit` con capturas a 390×844 documentados.
- [x] CI del PR en verde, squash merge y cierre documental completado.

## Decisiones aprobadas (2026-11-20)

El usuario aprobó la spec con la **opción A en las seis decisiones**. Se recogen
aquí con su resultado para trazabilidad.

### 1. Entrada a Dispositivos → **A: mantener la lista y separar vistas** (aprobada)

- **A (aprobada)**: conservar la `<ul>` de tarjetas que ya funciona y
  extraer `DeviceMobileView` / `DeviceDesktopView` con `DeviceLayout` como
  dueño del estado. Cumple el roadmap sin rehacer una lista que ya pasó tres
  revisiones a 390 px.
- **B**: reescribir como lista agrupada por tipo con acordeones. Más jerarquía,
  pero rompe el orden alfabético cerrado y añade estado de expansión nuevo.

### 2. Acciones de alta/importación → **A: FAB portalado con hoja de acciones** (aprobada)

- **A (aprobada)**: FAB (+) sobre la tab bar que abre dos acciones táctiles.
  Una mano y coherente con Notas/Calendario; se porta a `body` por el
  `animate-fade-rise` de la página.
- **B**: mantener los dos botones en la cabecera, solo agrandados. Menos
  cambio, pero siguen quedando lejos del alcance del pulgar, arriba.

### 3. Formulario de dispositivo → **A: hoja inferior portalada** (aprobada)

- **A (aprobada)**: mismos `DeviceForm`, `useId` y validación, pero en hoja
  inferior en móvil con safe-area y acciones pegajosas; inline en escritorio.
- **B**: dejarlo inline y añadir solo `padding`/tamaños. No resuelve que los
  seis campos empujen la lista fuera de pantalla.

### 4. Panel de importación → **A: hoja inferior con preview intacto** (aprobada)

- **A (aprobada)**: portar `ScanImportPanel` a body en móvil con
  `data-mobile-panel`, checkboxes grandes y acciones pegajosas, sin tocar
  `dryRun`/preview/deduplicación.
- **B**: mantenerlo en flujo y agrandar controles. Menos cambio, pero el
  selector de archivos y el teclado siguen tapando el preview.

### 5. Origen del JSON en móvil → **A: subida de archivo + comando copiable** (aprobada)

- **A (aprobada)**: mantener el file picker `.json` con texto honesto de que
  el escaneo se hace en un ordenador de casa, y botón «Copiar comando» para
  enviarlo/desde el móvil. No amplía la superficie de validación.
- **B**: añadir un campo para pegar el JSON como texto. Alternativa cómoda,
  pero duplica validación, manejo de 1 MB/512 filas y estados de error.

### 6. Frescura del estado → **A: mantener el cálculo en servidor** (aprobada)

- **A (aprobada)**: conservar `formatDeviceStatus` y el aviso > 24 h
  calculados en servidor; documentar como follow-up el reloj en cliente. No
  cambia un comportamiento ya cerrado.
- **B**: añadir reloj en cliente con `aria-live` y recálculo periódico. Más
  preciso, pero modifica `dispositivos-estado` (cerrado) y puede anunciar
  cambios cada minuto con lector de pantalla.

## Supuestos

- «Móvil» = viewport `< 1024px` (`lg:` de Tailwind), igual que en Fases 1-4.
- `nmap` sigue sin estar disponible en Vercel ni en el entorno del agente; no
  se ejecuta en esta fase y su verificación real queda como follow-up.
- La autenticación y roles no cambian: FAMILY lee, ADMIN escribe; `/devices`
  sigue en el drawer «Más» de Perfil (decisión cerrada en Fases 1 y 3).
- No hay dispositivo iOS/Android en el entorno del agente; la verificación es
  en Chromium a 390×844.
- El contenido de `device.ts`, `deviceStatus.ts`, `scan.ts`, los schemas Zod,
  las rutas API y `scripts/scan-network.ts` se conserva; se cambia su
  presentación móvil y el punto de entrada de las acciones.
