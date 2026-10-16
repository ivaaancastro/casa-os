# Plan — Layout premium para el editor de notas

## Problema actual
El layout de 3 columnas (carpetas / lista / editor) comprime el editor,
solapa elementos y hace la toolbar inaccesible. El espacio está mal repartido.

## Enqueque: layout tipo "documento" (Notion/Craft)
- **Sidebar izquierdo** (240px): solo navegación (carpetas + lista de notas).
- **Editor** (resto del ancho): sin comprimir, con toolbar fija arriba.
- **Sin 3 columnas**: las carpetas se integran en el sidebar, no como columna separada.
- **Toolbar sticky**: siempre visible al hacer scroll del contenido.
- **Título grande** arriba, contenido debajo con max-width de 720px para lectura cómoda.

## Referencias
- Notion: sidebar colapsable + editor full-width + toolbar sticky.
- Craft: sidebar + editor centrado con max-width.
- Google Docs: toolbar fija arriba, contenido centrado.

## Criterios
- Toolbar siempre accesible (sticky).
- Editor usa todo el ancho disponible.
- Sin solapamientos ni scroll innecesario.
- Responsive: en móvil, sidebar se oculta y el editor es full-width.

