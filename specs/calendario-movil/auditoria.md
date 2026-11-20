# Auditoría de diseño — Fase 4 (Calendario móvil + avisos)

> Realizada con la skill `design-audit` el 20 nov 2026. Capturas nuevas con
> Chrome MCP en `http://127.0.0.1:3000`, viewport 390×844, sesión real contra BD
> local sembrada. Capturas guardadas en el directorio temporal de la sesión
> (`…/opencode/calendario-movil-audit/`) y referenciadas aquí por nombre.

## Alcance y objetivo

- **Flujo auditado**: entrar en `/calendario` → tocar un día → agenda → cambiar
  a Semana → crear evento con el FAB → abrir Avisos.
- **Objetivo del usuario**: ver los planes de la casa de un vistazo, encontrar
  el evento de un día con el pulgar y crear/avisar sin menús.
- **Modo**: combinada (UX + diseño visual + accesibilidad ligera).
- **No verificado**: dispositivos iOS/Android reales, teclado/lector de
  pantalla, tema oscuro, teclado virtual y la entrega real de una notificación
  push (el panel solo se revisó en desarrollo; la evidencia de producción está
  en `specs/recordatorios/cierre.md`).

## Veredicto

La agenda, la semana y las hojas inferiores funcionan y se leen bien a 390 px;
el FAB **no flotaba** por un ancestro con `transform` y la jerarquía tipográfica
del título del mes rompía la regla Jost-en-móvil aprobada. Todo lo bloqueante
está corregido y reverificado.

## Pasos del flujo

1. **Mes al entrar** — `01-mes.png` · **con fricción**. Rejilla de 7 columnas,
   celdas de 104 px, Mes/Semana/Hoy/Avisos en una fila y contador «2 eventos».
   Los eventos están en la celda del día 20, pero con el `PageHeader` encima no
   aparecen en el primer viewport. El título «Noviembre de 2026» sale en Bodoni.
2. **Agenda del día** — `02-agenda.png` · **bueno**. Al tocar el 20 se abre la
   agenda con dos filas de 56 px: «Todo el día» y «11:00–12:00», títulos
   completos y «Añadir evento este día». Los chips de la rejilla se truncan a
   «Event…», pero la agenda los deletrea; el `title` del chip conserva el texto.
3. **Semana** — `03-semana.png` · **bueno**. Siete tarjetas con número, día,
   mes y un botón «+» cuadrado de 44 px; los eventos del 20 se ven completos.
4. **Formulario (FAB)** — `04-formulario.png` · **bueno**. Hoja inferior con
   cabecera Jost 21 px, campos apilados, `datetime-local` a ancho completo y
   acciones pegajosas «Crear evento»/«Cancelar» sobre la zona segura. Sin
   desbordamiento.
5. **Avisos** — `05-avisos.png` · **bueno**. Hoja inferior con el estado real
   de desarrollo («los avisos se activan en la versión publicada»), próximos
   avisos y cómo funciona. «Próximos avisos» sale en Bodoni.
6. **Reverificación** — `06-mes-final.png`, `07-avisos-final.png` · **bueno**.
   FAB visible sobre la tab bar y títulos en Jost a 390 px.
7. **Panel Avisos con build de producción** — `08-avisos-produccion.png` ·
   **bueno**. Con `next start` el service worker sí se registra; el panel
   muestra el estado honesto «Los avisos no están configurados en el servidor»
   porque las VAPID keys locales no están presentes. En producción sí lo están
   (evidencia en `specs/recordatorios/cierre.md`). No se solicitó permiso ni se
   envió una notificación real.

## Fortalezas

- La agenda (paso 2) resuelve la legibilidad que la rejilla no puede dar a
  390 px: hora, título completo y acción de alta en una sola columna.
- La semana (paso 3) es cómoda de recorrer con el pulgar; cada tarjeta tiene su
  «+» de 44 px sin abrir el formulario del día equivocado.
- Las hojas inferiores (pasos 4-5) mantienen el portal a `body`, dejan ver el
  contexto difuminado arriba y no tapan la tab bar.
- Paleta cerrada, radios 0, sin sombras decorativas; el rojo no aparece en este
  flujo. Consola sin errores ni avisos en las capturas.

## Hallazgos por prioridad

- **[P1 → corregido] El FAB no flotaba.** Captura: `01-mes.png` (no se ve el
  botón «+» pese a existir en el DOM). Causa: `CalendarMobileView` está dentro
  de `<div class="grid animate-fade-rise …">`, cuya animación deja un
  `transform: matrix(1,0,0,1,0,0)` con `fill-mode: both`; eso convierte al div
  en bloque contenedor de `position: fixed`. Medición con DevTools: FAB a
  `y=1181` con viewport de 844 px, `bottom: 72px` relativo al div, no al
  viewport. Consecuencia: había que desplazarse hasta el final del mes para
  verlo. Corrección: renderizar el FAB con `createPortal(..., document.body)`
  tras el montaje, igual que los paneles. Verificado: `06-mes-final.png`.

- **[P1 → corregido] Bodoni en móvil en dos cabeceras.** Capturas:
  `01-mes.png` y `03-semana.png` («Noviembre de 2026», «16 – 22 nov 2026») y
  `05-avisos.png` («Próximos avisos»). La regla global `h1,h2,h3,h4 →
  font-display` de `globals.css` gana sobre la intención de Jost-en-móvil de la
  Fase 1. Corrección: `font-ui` explícito en el título temporal de la vista
  móvil y en los encabezados «Próximos avisos» / detalle de evento cuando
  `mobile`. Verificado: `06-mes-final.png` y `07-avisos-final.png`.

- **[P2] Los chips de la rejilla no se pueden leer a 390 px.** Captura:
  `02-agenda.png` (celda del 20: «Event…», «Event…»). Con siete columnas cada
  chip mide ~54 px y el título se trunca. Es un límite del patrón de rejilla
  aprobado, no un error de implementación: el `title` del chip y la agenda
  (paso 2) dan el nombre completo. Se documenta para no prometer legibilidad
  que la rejilla no puede ofrecer.

- **[P2] Los eventos quedan fuera del primer viewport si hoy cae tarde en el
  mes.** Captura: `01-mes.png` (fila del 20 a ~950 px con el `PageHeader`
  visible). Corrección no aplicada: autosccroll a la fila de hoy ocultaría la
  cabecera y el selector de vista; se prefiere conservar el contexto y dejar
  que el usuario desplace. Follow-up para evaluar con dispositivo real.

- **[P2] Tocar el centro de una celda con eventos abre el evento, no el día.**
  Captura: `02-agenda.png`; el primer clic con Chrome MCP en el centro de la
  celda del 20 no seleccionó el día porque los chips ocupan esa zona. No se
  cambia: es el comportamiento esperado (chip = abrir evento, número = elegir
  día) y coincide con la E2E, que toca el número. Queda anotado para la prueba
  con pulgar real.

## Riesgos de accesibilidad

- **Visible en capturas**: botones de nav/vista/`+` y chips de agenda ≥ 44 px,
  foco visible en el botón de Mes, estados `aria-pressed` en Mes/Semana,
  `aria-label` en días, navegación y FAB, `aria-live` en el contador,
  `role="status"`/`alert` en los paneles.
- **Requiere prueba específica**: orden de lectura del portal (la hoja va al
  final de `body`), anuncio del estado de carga del panel Avisos, foco al
  cerrar la hoja, contraste de `ash` a 10-13 px y navegación con teclado. No
  se afirma verificado.

## Límites de evidencia

- Capturas en Chromium de escritorio emulando 390×844 con `touch`; no
  sustituyen a iOS Safari ni a Android Chrome.
- El panel Avisos se capturó en desarrollo (estado «versión publicada») y con
  build de producción local (estado «no configurado en el servidor», al no tener
  VAPID keys locales). En ninguno de los dos se solicitó permiso de
  notificaciones ni se envió una notificación real al sistema operativo.
- No se probó el teclado virtual: con él abierto, la hoja inferior podría
  quedar más alta de lo mostrado en `04-formulario.png`.

## Checklist accionable

1. Mantener el FAB portalado a `body` para que `position: fixed` no dependa de
   `animate-fade-rise`.
2. Mantener `font-ui` en los títulos de la vista móvil y en las hojas
   inferiores; Bodoni solo en `md:`/escritorio.
3. No eliminar el `title` de los chips de la rejilla: es el único texto
   completo cuando el título se trunca.
4. Repetir la auditoría con dispositivo real, teclado virtual y lector de
   pantalla antes de dar por cerrada la experiencia móvil.
