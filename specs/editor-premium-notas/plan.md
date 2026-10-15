# Plan — Editor premium para notas

## Contexto
La toolbar anterior era completa pero el editor sentía “enmarcado” y con tamaños
tipográficos genéricos. El usuario quiere una experiencia premium y sin marcos: tamaño
y fuente editables, paleta de colores completa y controles claros.

## Enfoque técnico
- Reutilizar TipTap v3 (extensions de fonts/sizes presentes en @tiptap/extension-text-style).
- Añadir testimonio de tipografía premium: selector de fuente, tamaño (8–72), line-height.
- Añadir paleta completa (24 colores).
- Eliminar marco/borde alrededor del editor; toolbar fija minimalista y alto aire.
- Sanitización: permitir estilo font-family además de color/font-size.
- Sanitizar lógica sin tocar lógica de guards existentes.
- Mantener autosave debounce y create flow.

## Riesgos
- Caer en "SaaS card kit" si no se cuida spacing.
- No olvidar sanitizar propiedades nuevas.
- Exceso de controles que ensombrezcan el texto. (Mitigar con agrupación.)

## Criterios
- appearance<rfl:parameter name=" premium, no marco rectangular; toolbar subtle con fine lines.
- Rango de tamaños y fuentes funcionando.
- Lint/typecheck/test/build pasan.
- Persistencia correcta de estilos.

