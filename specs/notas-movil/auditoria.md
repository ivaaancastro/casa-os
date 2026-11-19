# Auditoría de diseño — Fase 3 (Notas móvil)

> Realizada con la skill `design-audit` el 19 nov 2026. Capturas nuevas con
> Chrome MCP en `http://127.0.0.1:3000`, viewport 390×844, sesión real contra BD
> local sembrada. Capturas guardadas en el directorio temporal de la sesión
> (`…/opencode/notas-movil-audit/`) y referenciadas aquí por nombre.

## Alcance y objetivo

- **Flujo auditado**: entrar en `/notas` → buscar y filtrar por carpeta → abrir
  una nota → desplegar «Más formato» → volver → crear con el FAB → marcar una
  lista de tareas.
- **Objetivo del usuario**: abrir Notas y ver la lista, encontrar una nota con una
  mano, crear una al instante y marcar tareas con el pulgar.
- **Modo**: combinada (UX + diseño visual + accesibilidad ligera).
- **No verificado**: dispositivos iOS/Android reales, teclado físico/lector de
  pantalla, tema oscuro y el comportamiento del teclado virtual al editar.

## Veredicto

La lista-first, los chips y el FAB funcionan y se leen bien a 390 px; el editor
compacto queda condicionado por el ancho cuando hay acciones, y el buscador
mostraba un control azul del navegador que rompía la paleta. Todo lo bloqueante
está corregido y reverificado.

## Pasos del flujo

1. **Lista al entrar** — `01-lista.png` · **bueno**. Cabecera Jost 21 px,
   contador en `ash` 13 px, buscador fijo, chips con contadores, filas de 76 px y
   FAB cuadrado sobre la tab bar. Sin desbordamiento horizontal.
2. **Búsqueda por contenido** — `02-busqueda.png` · **bueno**. Escribir
   «leche-e2e» deja sola la nota; el filtro es inmediato y no hay petición de red.
3. **Editor con una fila de herramientas** — `03-editor.png` · **con fricción**.
   Las cinco acciones caben, pero «Más formato» aparece recortado como «Más form»
   cuando están visibles «completar» y borrar.
4. **Panel «Más formato»** — `04-mas-formato.png` · **bueno**. Despliega el
   toolbar completo debajo de la barra, sin flotar ni tapar la nota.
5. **Vuelta a la lista** — `07-lista-final.png` · **bueno**. Conserva el término
   de búsqueda y el filtro; la nota creada aparece arriba.
6. **Creación con el FAB** — `05-crear.png` · **bueno**. Abre el editor con foco
   en la primera línea y solo la acción de borrar (no hay «completar» en un
   borrador).
7. **Checklist táctil** — `06-checklist.png` · **bueno**. Casillas amplias,
   estado activo del botón de lista de tareas y «Guardado» visible.

## Fortalezas

- Entrar muestra la lista, no un editor vacío: se elimina el paso muerto de la
  versión anterior (paso 1).
- Una sola mano: búsqueda, filtros y FAB quedan en el tercio superior/inferior
  accesible con el pulgar (pasos 1–2).
- El toolbar compacto mantiene los formatos esenciales y deja el resto detrás de
  un botón, sin comerse la pantalla (pasos 3–4).
- Paleta cerrada y radios 0; el rojo aparece solo en borrado/error, sin acentos
  decorativos (pasos 1–7).
- «Volver» no recarga ni pierde el filtro: la navegación se siente local (paso 5).
- Sin errores en consola en las capturas finales; solo el aviso conocido de
  TipTap/`immediatelyRender` con Next.js 14.

## Hallazgos por prioridad

- **[P1 → corregido] «Más formato»quedaba recortado.** Capturas: antes
  `03-editor.png` y `06-checklist.png`; después `08-editor-final.png` y
  `09-checklist-final.png`. Qué se veía: «Más form» al lado de «completar» y
  borrar. Corrección: el botón muestra «Más» y conserva `aria-label="Más
  formato"`; se quitó `overflow-x-auto` de la barra compacta, que ya no hace
  falta con la etiqueta corta.

- **[P2 → corregido] Control azul del navegador en el buscador.** Captura:
  `02-busqueda.png`. Qué se veía: la «×» nativa de `type="search"` en azul, fuera
  de la paleta (`canvas`/`ink`/`ash`/`mist`/`pearl`). Corrección: `type="text"`
  y un botón «Limpiar búsqueda» con SVG en `ash`, objetivo de 36 px, dentro del
  mismo marco. Captura verificada: `07-lista-final.png` (campo en reposo).

- **[P3 → corregido] Franjas grises de scroll.** Capturas: antes `01-lista.png`
  (bajo los chips) y `03-editor.png` (bajo el toolbar); después
  `07-lista-final.png` y `08-editor-final.png`. Corrección: clase `.no-scrollbar`
  en la fila de chips y eliminación del scroll horizontal en el toolbar compacto.

- **[P3] La primera línea de una nota nueva usa Jost, no Bodoni.** Captura:
  `09-checklist-final.png` («Lista final auditada» en sans) frente a
  `08-editor-final.png` («Nota E2E de la compra» en serif). Motivo: la primera
  línea es el primer bloque del HTML; al escribir en un borrador vacío nace como
  `<p>`, mientras las notas antiguas la tienen como `<h1>`. No se corrigió en
  esta entrega: al intentar inicializar el borrador con `<h1></h1>` vacío, TipTap
  v3 lanzó `RangeError: Applying a mismatched transaction` en
  `editor.commands.focus('start')`; se revirtió esa variante y se deja como
  follow-up para investigar con calma. No afecta al guardado ni al título.

## Riesgos de accesibilidad

- **Visible en capturas**: etiquetas de búsqueda y acciones, foco visible de
  2 px en el campo activo (`02-busqueda.png`), objetivo ≥ 44 px en chips,
  toolbar y casillas (`09-checklist-final.png`), tab bar con zona segura.
- **Requiere prueba específica**: orden de lectura al abrir el editor apilado,
  anuncio del estado «Guardado» con lector de pantalla, foco al cerrar «Más
  formato» y contraste de `ash` a 13 px. No se afirma verificado.

## Límites de evidencia

- Las capturas se hicieron en Chromium de escritorio emulando 390×844 con
  `touch`; no sustituyen a iOS Safari ni a Android Chrome.
- Durante la auditoría se probó y descartó una variante de código que
  inicializaba el borrador con un `<h1>` vacío: provocó un error de TipTap y se
  revirtió antes de las capturas finales. Todas las capturas «finales» muestran
  el código entregado.
- No se comprobó el teclado virtual del móvil: en las capturas el contenido no
  queda tapado, pero con teclado real habría que repetir la revisión.

## Checklist accionable

1. Mantener el botón «Más» con `aria-label="Más formato"` en el toolbar compacto.
2. Mantener el buscador como `type="text"` con el botón «Limpiar búsqueda» neutral.
3. Mantener `.no-scrollbar` en los chips y sin `overflow-x-auto` en la barra compacta.
4. Investigar en una feature futura la inicialización del borrador con `<h1>` para
   unificar la jerarquía del título sin romper `focus('start')` de TipTap v3.
5. Repetir la auditoría con teclado/lector de pantalla y en un dispositivo real.
