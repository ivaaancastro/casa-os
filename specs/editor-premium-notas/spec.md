# Spec — Editor premium para notas

## Objetivo
Ofrecer un editor de estilo premium, alineado a la estética editorial/Inditex:
espacio generoso, sin marco, tipografía mejor escala y control completo de fuente,
tamaño y color. Opciones aprobadas por el usuario:
- toolbar fija (no flotante)
- paleta completa de colores
- fuentes de la familia base de la app.

## Requisitos funcionales
1. Toolbar fija arriba del campo de texto.
2. Selectors:
   - Fuente: Bodoni Moda / Jost / Georgia / Inter / Courier / system-ui.
   - Tamaño: 8, 10, 12, 14, 16, 18, 20, 24, 30, 36, 48, 60, 72.
   - Altura de línea: 1.1, 1.4, 1.7, 2.0.
3. Estilos: bold/italic/underline/strike, listas, align, quote, code, HR.
4. Color de texto (24 colores completos).
5. Color de resaltado (8 tonos).
6. Undo/redo.
7. No marco visible alrededor del editor: solo abajo; se siente como hoja en blanco.
8. Autosave y create flow existentes intactos.

## Diseño visual
- Sin rounded corners, sin shadow en el editor container.
- Editor área grande `min-h-[60vh]` con max width 760px, padding horizontal amplio.
- Toolbar con separadores y hover minimalista sin alterar icono negros a ink.
- Selector tipográfico en dropdown con texto y color desconectados.
- Paleta en grid de cuadritos 4x6.

## Funcionalidad y datos
- El estilo se persiste en HTML; sanitización permitirá style color/font-size/font-family/font-weight/font-style/text-align/line-height.
- Sanitize filter ampliada.
- Asegurar estilo real con TipTap y triples Mark attributes.

## Accesibilidad
- Foco visible en toolbar actions.
- Menus cerrados con click outside/escape.
- Edición con teclado shortcuts.
- reduced-motion no aplica (este es UI de trabajo).

## Criterios de aceptación
- Crear nota y aplicar fuente/tamaño/color -> guardar y reabrir mantiene.
- Sanitize produce estilo válido y no elimina font-family.
- Lint/typecheck/test/build pasan.
- Responsive en móvil.

