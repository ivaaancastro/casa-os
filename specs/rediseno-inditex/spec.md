# Spec — Rediseño visual inspirado en Inditex

## Objetivo
Dar a casa-os una identidad visual editorial minimalista inspirada en Inditex/Zara,
sin copiar activos de marca: usar su vocabulario visual (espacio, malla, tipografía
serif para los títulos y sans neutra en la interfaz) aplicada a un gestor del hogar.

## audiencia y trabajo principal
- Público: familia/hogar, uso cotidiano desde el móvil.
- Trabajo principal: localizar y gestionar notas, dispositivos y futuras secciones
  sin ruido, con la sensación de un espacio curado.

## Sistema de tokens
### Color
- Canvas: `#FFFFFF` — fondo principal (blanco editorial).
- Ink: `#0A0A0A` — texto principal y CTA principal (negro directo, no `#111`).
- Ash: `#6B6B6B` — texto secundario (minimal, sin gris pastel).
- Mist: `#E4E4E4` — separadores y bordes.
- Pearl: `#F5F5F5` — superficies secundarias (tarjetas vacías, hover neutro).
- No usar colores de acento cálidos por defecto (terracota). La única señal de color
  en la UI será el estado: rojo oscuro `#8E2222` únicamente para errores/eliminación.

### Tipografía
- Titulares: `Bodoni Moda` (serif editorial, alto contraste).
- Interfaz y cuerpo: `Jost` (sans neutra, tamaños 13/14/16/18/21/28/40).
- Longitud de línea < 80 caracteres; line-height 1.5 (sans) / 1.6 (serif).
- Reglas del skill frontend-design:
  - No acentuar una sola palabra de un titular.
  - No usar ALL CAPS en etiquetas.
  - No añadir etiquetas tipográficas innecesarias.

### Layout
- Contenedor principal: max 1440px, padding lateral 20px (mobile) / 40px (desktop).
- Alineación: izquierda en todo el contenido (sin centrar por defecto).
- Grid editorial de 12 columnas; en mobile una sola columna.
- Espaciado base 8px.
- Radios: 0 en botones/tarjetas/inputs (editorial nítido); 2px solo en focos.
- Sombras: ninguna por defecto (solo para foco accesible de teclado).

### Principios únicos
- Un único elemento memorable: la palabra/marca "casa-os" en Bodoni como firma visual.
  Todo lo demás se mantiene disciplinado.
- Pocos contornos: los bordes separan, no decoran.
- Un único momento orquestado de carga; el resto de movimiento responde a acciones.
- Imágenes/visuales sobre texto (estilo editorial).

## Componentes a modificar
1. `layout.tsx` (sidebar/top): nav superior minimal + wordmark Bodoni.
2. `notas`: listado (tarjetas cuadradas, borde fino), editor (espaciado generoso), sidebar
   de carpetas (líneas finas).
3. Dashboard: grid editorial de módulos con títulos grandes.
4. `auth/login`: layout vertical calmado, formulario limpio.
5. `components/ui/*`: botones, inputs, badges; actualización de tokens.

## Accesibilidad y calidad
- Foco de teclado visible (borde negro de 2px).
- `prefers-reduced-motion`: desactivar animaciones no esenciales.
- Contraste AAA para texto.
- Responsive en toda la UI.
- Mantener tests existentes; no cambiar lógica de negocio.

## Criterios de aceptación
- [ ] Tokens aplicados de forma consistente.
- [ ] Tipografía nueva cargada y usada.
- [ ] No regresiones: `lint && typecheck && test && build` pasan.
- [ ] Responsive correcta en mobile/tablet/desktop.
- [ ] Documentación actualizada (MEMORY.md + diseño en specs).

## Fuera de alcance
- No cambiar modelo de datos ni APIs.
- No añadir nuevas secciones funcionales (calendario/inventario queda para otro hito).

