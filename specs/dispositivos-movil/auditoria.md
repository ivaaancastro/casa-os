# Auditoría de diseño — Fase 5 (Dispositivos y red en móvil)

> Realizada con la skill `design-audit` el 20 nov 2026. Capturas nuevas con
> Chrome MCP en `http://localhost:3000`, viewport 390×844, sesión real contra BD
> local sembrada (ADMIN y FAMILY). Capturas guardadas en el directorio temporal
> de la sesión (`…/opencode/dispositivos-movil-audit/`) y referenciadas aquí.

## Alcance y objetivo

- **Flujo auditado**: entrar en `/devices` → abrir el FAB → dar de alta →
  importar un escaneo (preview) → ver la vista de solo lectura de FAMILY.
- **Objetivo del usuario**: inventariar y actualizar los equipos de casa desde
  el móvil con una mano, entendiendo qué viene del archivo antes de aplicarlo.
- **Modo**: combinada (UX + diseño visual + accesibilidad ligera).
- **No verificado**: dispositivos iOS/Android reales, teclado/lector de
  pantalla, teclado virtual, `nmap` real (no instalado aquí) y smoke
  autenticado en producción.

## Veredicto

La lista, el FAB, las hojas inferiores y el preview de importación funcionan y
se leen bien a 390 px; **no hay hallazgos P0/P1**. Quedan tres detalles de
pulido (espaciado de la cabecera, densidad de botones por tarjeta y preview
largo) que se documentan sin bloquear la entrega.

## Pasos del flujo

1. **Lista al entrar** — `01-lista.png` · **bueno**. `h1` en Jost 21 px,
   contadores y frescura en `ash`, tarjetas de una columna con IP/MAC/propietario,
   botones «Editar»/«Eliminar» de 44 px y FAB por encima de la tab bar. Sin
   desbordamiento horizontal; consola sin errores ni avisos.
2. **Acciones del FAB** — `02-acciones.png` · **bueno**. El FAB portado a `body`
   flota en su sitio (no ocurre el fallo de anclaje de la Fase 4) y abre una
   hoja con dos acciones amplias. Scrim y foco correctos.
3. **Formulario de alta** — `03-formulario.png` · **bueno**. Cabecera Jost,
   seis campos apilados, `datetime` no aplica aquí; acciones pegajosas visibles
   sin tapar la tab bar ni la zona segura.
4. **Importación** — `04-importacion.png` · **bueno**. Comando completo en
   monoespacio con «Copiar comando», texto honesto sobre el origen del JSON,
   selector de archivo de 44 px, resumen, «Estado tras aplicar» y acciones
   pegajosas. La fila «Nuevo» con su checkbox queda más abajo (ver P2).
5. **Vista FAMILY** — `05-family.png` · **bueno**. Mismo inventario, aviso de
   solo lectura, sin FAB ni acciones de edición/importación. El aviso de
   instalación PWA visible es propio del origen `localhost` usado en la
   captura, no de esta feature.

## Fortalezas

- El FAB es realmente flotante: se verificó visualmente y con medición en E2E;
  se evitó repetir el fallo de `animate-fade-rise` de la Fase 4 (pasos 1-2).
- Las hojas inferiores conservan identidad (misma `BottomSheet` para acciones,
  formulario e importación) y dejan ver el contexto difuminado (pasos 2-4).
- «Copiar comando» resuelve el problema real de usar `nmap` desde el móvil: el
  texto no asume que haya `npm` en el teléfono (paso 4).
- El preview explica por qué una fila se ignora y qué pasaría con el estado
  antes de aplicar, sin cambiar las reglas cerradas de importación (paso 4).
- FAMILY ve exactamente lo que debe y nada más (paso 5).

## Hallazgos por prioridad

- **[P2] Espacio vacío entre la cabecera y la primera tarjeta.** Capturas:
  `01-lista.png` y `05-family.png`. Dos reglas horizontales con ~40 px entre
  ellas antes del primer dispositivo. Causa: `gap-y-8` del wrapper de la página
  más el `border-t` de la sección; el patrón es compartido por otras secciones.
  No corregido: tocar `page.tsx` afectaría a páginas ya cerradas y no impide
  usar la lista. Se deja como follow-up de pulido global.

- **[P2] La fila importable queda fuera del primer viewport del panel.**
  Captura: `04-importacion.png`. El resumen y las acciones llegan hasta abajo,
  pero la lista de dispositivos con su checkbox aparece tras desplazarse. Con
  hasta 512 filas no hay virtualización. No corregido: el resumen y «Estado tras
  aplicar» están deliberadamente arriba para decidir antes de aplicar, y
  virtualizar queda fuera de alcance. El checkbox sí mide 44 px de zona táctil.

- **[P3] Repetición de botones «Editar»/«Eliminar» con borde en cada tarjeta.**
  Captura: `01-lista.png`. Tres pares de botones compiten visualmente con los
  datos del equipo. No corregido: se priorizó la claridad de la acción y el
  objetivo de 44 px; un patrón de «···» requeriría reabrir la decisión de CRUD
  cerrada en `dispositivos-crud`.

## Riesgos de accesibilidad

- **Visible en capturas**: `h1` Jost, botones y FAB ≥ 44 px, foco visible en
  el botón del FAB, `role="status"` en «Comando copiado», `role="alert"` en
  errores y `aria-label` en el selector de archivo y los checkboxes.
- **Requiere prueba específica**: orden de lectura de los tres portales
  (FAB, hoja de acciones, hoja de formulario/importación), anuncio del preview
  al cambiar de archivo, foco al cerrar con Escape, contraste de `ash` a
  10-13 px y comportamiento con teclado virtual. No se afirma verificado.

## Límites de evidencia

- Capturas en Chromium de escritorio emulando 390×844 con `touch`; no
  sustituyen a iOS Safari ni a Android Chrome.
- No se ejecutó `nmap` (no está instalado en el entorno). El fixture JSON
  ejercita el flujo de importación, no el escaneo real.
- No se comprobó el picker de archivos de un móvil real: el `.json` se subió
  con el selector de Chromium. En iOS/Android puede depender del origen del
  archivo (Drive/AirDrop/correo).
- La vista FAMILY se capturó con un usuario determinista creado solo en la BD
  local por `devices-setup.ts`.

## Checklist accionable

1. Mantener el FAB portalado a `body`; es la regresión más costosa de esta
   feature si se revierte.
2. Mantener una sola `BottomSheet` para acciones, formulario e importación:
   es la garantía de safe-area, Escape y foco.
3. No mover el resumen del preview por debajo de la lista de filas.
4. Revisar el espaciado de la cabecera en una feature de pulido global, no
   dentro del alcance de Dispositivos.
5. Repetir la auditoría con dispositivo real, teclado virtual y lector de
   pantalla antes de dar por cerrada la experiencia móvil.
