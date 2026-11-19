# Referencias premium — Awwwards → rediseño de casa-os

> Documento de investigación para la spec `rediseno-inditex`. No cambia criterios de
> aceptación: convierte patrones observados en Awwwards (19 nov 2026) en decisiones
> concretas para la Fase 1 del roadmap móvil. Las capturas se guardaron en la sesión
> del agente; aquí se registran los patrones, nunca activos de marca de terceros.

## Método

- Revisadas en vivo las secciones: portada, **UI design**, **Minimal**, **Typography**,
  **Mobile & Apps** y **Luxury**.
- Inspeccionadas visualmente: la portada de Awwwards con el SOTD *Carter Ogunsola*
  (19-11) y las fichas de *Estheet*, *Hole Money — Finance Manager* y *Santal*.
  *Sweet Tape* solo apareció en el listado de UI design (SOTD 17-11, Developer
  Award): se cita como referencia a explorar, no como evidencia inspeccionada.
- Filtro aplicado: patrones que sobreviven a un gestor del hogar usado a diario en
  móvil. Se descartan WebGL, parallax, scroll-jacking y animaciones de portfolio:
  en casa-os el movimiento debe responder a una acción, no competir con la tarea.

## Hallazgos que sí aplican

### 1. El título tipográfico ES la identidad (SOTD Carter Ogunsola, Santal, Estheet)

El nombre del proyecto se resuelve como una palabra enorme en sans grotesca, con
todo el espacio alrededor vacío. No hay logo, ilustración ni gradiente compitiendo.

**Aplicación a casa-os:** el wordmark en Bodoni Moda sigue siendo la firma, pero
debe aparecer **una sola vez por pantalla**, a tamaño editorial (28–40 px en móvil,
hasta 96 px en splash), con el resto de la jerarquía en Jost. El error actual sería
repetir el wordmark en sidebar + cabecera + dashboard.

### 2. Escala de contraste extrema, no más colores (todas las secciones)

Blanco roto / gris claro como canvas, negro casi puro para titulares y CTA,
gris medio para secundario. El acento escasea: en *Santal* un único bloque negro
profundo; en la propia interfaz de Awwwards, un amarillo vivísimo reservado al
único botón «Visit Site».

**Aplicación a casa-os:** confirma los tokens `Canvas #FFFFFF`, `Ink #0A0A0A`,
`Ash #6B6B6B`, `Mist #E4E4E4`, `Pearl #F5F5F5`. El rojo sigue siendo **solo
estado** (`#8E2222` para error/eliminación). El `#C41E3A` del roadmap se descarta
como acento decorativo para no romper esta disciplina — decisión pendiente de
confirmación en la spec de Fase 1.

### 3. Una sola señal de color, usada con intención (UI de Awwwards)

El botón «Visit Site» de Awwwards es amarillo sobre una interfaz gris/blanco/negro
y funciona porque es el único punto de color de la pantalla. En casa-os el
equivalente no es decorativo: es el estado de la bóveda, un aviso pendiente o una
acción destructiva.

**Aplicación:** regla de "un acento por pantalla como máximo". Si en una vista hay
un botón principal y un dato en rojo, uno de los dos debe perder intensidad.

### 4. La cuadrícula se ve, aunque no tenga bordes (Hole Money, SANTAL)

Las secciones se alinean a columnas invisibles; los separadores son líneas finas
y el espacio en blanco hace el trabajo de agrupar. No hay tarjetas con sombra.

**Aplicación:** grid de 12 columnas en desktop / una columna en móvil, radios 0,
sin sombras. Las tarjetas de notas se distinguen por borde de 1 px + hueco,
no por elevación.

### 5. Metadatos pequeños y muy espaciados (todas las fichas)

Fechas, autores, puntuaciones y etiquetas aparecen en 11–13 px, con tracking
amplio y mucho aire alrededor. Nunca compiten con el título.

**Aplicación:** "Actualizado hace 2 h", "12 notas", "Sin conexión" van en Jost
13 px, color Ash, sin negrita. Es el lenguaje de los estados en la tab bar y en
las cabeceras de lista.

### 6. Navegación flotante compacta, no barra pesada (barra inferior de Awwwards, mobile apps)

La propia Awwwards resume sus secciones en una píldora oscura flotante con
separadores finos y un único botón activo en blanco. Las apps de la categoría
Mobile & Apps (Hole Money, Woday, VELTO) llevan esa misma lógica al móvil:
pocos destinos, etiqueta corta, icono discreto y estado activo evidente.

**Aplicación directa a la Fase 1:** la tab bar inferior de 4 pestañas
(Notas, Cuentas, Calendario, Perfil) debe ser una barra clara fija con borde
superior de 1 px; el activo se marca con Ink + una línea de 2 px, sin badges
de color. Zona segura inferior (`env(safe-area-inset-bottom)`) y altura mínima
de 44 px por objetivo táctil. Es el patrón más trasladable de toda la visita.

### 7. El dark mode es una decisión de producto, no un extra (Hole Money)

La app de finanzas ofrece cambio de tema desde la propia cabecera y mantiene la
misma jerarquía: fondo neutro, superficie apenas más clara, texto alto contraste.

**Aplicación:** preparar los tokens para tema oscuro desde el inicio (variables
CSS con los mismos nombres semánticos), aunque la Fase 1 solo entregue el tema
claro. Evita reescribir componentes después.

### 8. Detalles que se notan al segundo uso (microinteractions)

Sin entrada de página coreografiada: hover sutil, foco visible, transiciones
cortas (120–200 ms) y un único gesto de carga. En móvil, el feedback táctil
limpio importa más que la animación.

**Aplicación:** respetar `prefers-reduced-motion`, transiciones solo en
interacción, never spinner decorativo en el arranque.

## Patrones descartados explícitamente

| Patrón Awwwards | Por qué no va en casa-os |
|---|---|
| WebGL / 3D / parallax | peso, batería y ruido en una app de uso diario |
| Scroll-jacking y secciones a pantalla completa | rompe la lectura de listas y calendarios |
| Tipografía de display ilegible a 13 px | aquí la UI se lee con prisa y a pulgar |
| Gradientes y texturas de portfolio | contradicen el sistema editorial Inditex |
| Copiar sites premiados | inspiración de patrones, nunca de activos o composición literal |

## Cómo se incorpora al feat de rediseño

1. Añadir esta referencia a `specs/rediseno-inditex/spec.md` como insumo, sin
   cambiar los criterios de aceptación ya aprobados.
2. Llevar los puntos 1–6 a tokens/componentes de la Fase 1: wordmark único,
   paleta cerrada, una señal de color por pantalla, grid sin sombras, metadatos
   13 px y tab bar de 4 pestañas con estado activo sobrio.
3. El punto 7 queda como preparación técnica de tokens (sin UI de tema en Fase 1).
4. La auditoría posterior usa la skill `design-audit` con estas referencias como
   contexto, sustituyendo cualquier captura antigua por evidencia nueva.

## Enlaces revisitados

- <https://www.awwwards.com> — portada y SOTD
- <https://www.awwwards.com/websites/ui-design/>
- <https://www.awwwards.com/websites/minimal/>
- <https://www.awwwards.com/websites/typography/>
- <https://www.awwwards.com/websites/mobile-apps/>
- <https://www.awwwards.com/websites/luxury/>
- Fichas inspeccionadas: `/sites/estheet`, `/sites/hole-money-finance-manager`,
  `/sites/santal`. El SOTD se vio en la portada; `/sites/sweet-tape` queda como
  referencia pendiente de inspección.
