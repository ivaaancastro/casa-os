# Plan: Editor de Texto Enriquecido para Notas

## Contexto

Las notas actuales solo son texto plano. El usuario quiere que funcionen como Apple Notes
con todas las herramientas de formato: titulos, subtitulos, negrita, cursiva, listas,
colores, tamanos, etc.

## Enfoque tecnico

### Decisión clave: TipTap

**TipTap** (v2) es la mejor opcion para esto:
- Editor headless construido sobre ProseMirror
- Soporte para extensiones: StarterKit (negrita, cursiva, headings, listas, etc.)
- Toolbar personalizable
- React nativo
- Exporta HTML y JSON
- Ligero (~50kb gzip)
- La misma tecnologia que usa Notion

### Alternativas consideradas

| Opcion | Pros | Contras |
|--------|------|---------|
| **TipTap v2** | Headless, React, extensible, moderno | Nueva dependencia |
| Slate.js | Muy flexible | Mas boilerplate, menos mantenido |
| Quill | Simple, classique | Menos moderno, peor integracion React |
| react-contenteditable | Sin dependencias | Inseguro (XSS), buggy |
| contenteditable nativo | Sin dependencias | Inconsistente entre navegadores |

**Decision**: TipTap v2 + StarterKit

### Arquitectura

```
src/components/notes/
├── NoteEditor.tsx          ← Modificado: integra RichTextEditor
├── RichTextEditor.tsx      ← Nuevo: editor TipTap con toolbar
├── Toolbar.tsx             ← Nuevo: barra de herramientas
└── Extensions/
    └── ColorHighlight.ts  ← Nuevo: extension para colores y highlights
```

### Formato de datos

El contenido de las notas cambia de `String` (texto plano) a `String` (HTML).

**Antes:**
```json
{ "content": "Leche, pan, huevos" }
```

**Despues:**
```json
{ "content": "<h1>Lista de la compra</h1><ul><li>Leche</li><li>Pan</li></ul><p><strong>Importante:</strong> no olvidar</p>" }
```

**Razon**: El HTML es compacto, compatible con TipTap, y permite renderizar con dangerouslySetInnerHTML (con sanitizacion).

### Seguridad: Sanitizacion

El HTML de las notas puede contener codigo malicioso (XSS). **SANITIZAR SIEMPRE** al mostrar:

- Usar **DOMPurify** para limpiar el HTML antes de renderizar
- Permitir solo tags seguros: h1-h6, p, strong, em, u, s, ul, ol, li, blockquote, code, a, span[style], mark
- Permitir solo estilos seguros: color, background-color, font-size, font-weight, text-align
- Ejecutar DOMPurify en cliente antes de dangerouslySetInnerHTML

## Estructura de archivos

```
src/
├── app/
│   └── notas/
│       └── page.tsx              ← Sin cambios
├── components/
│   └── notes/
│       ├── NotesLayout.tsx       ← Sin cambios
│       ├── NotesSidebar.tsx      ← Sin cambios
│       ├── NotesList.tsx         ← Sin cambios
│       ├── NoteItem.tsx          ← Sin cambios (mostrar preview HTML)
│       ├── NoteEditor.tsx        ← Modificado: integra RichTextEditor
│       ├── RichTextEditor.tsx    ← Nuevo: editor TipTap
│       └── Toolbar.tsx           ← Nuevo: barra de herramientas
├── lib/
│   ├── schemas/
│   │   └── note.ts               ← Modificado: content sigue siendo string (HTML)
│   └── utils/
│       └── sanitize.ts           ← Nuevo: sanitizacion con DOMPurify
└── tests/
    └── notes-rich.test.ts        ← Nuevo: tests de sanitizacion
```

## Dependencias nuevas

- `@tiptap/react` - Integracion React
- `@tiptap/starter-kit` - Extensiones base (headings, bold, italic, lists, etc.)
- `@tiptap/extension-color` - Colores de texto
- `@tiptap/extension-text-style` - Estilos de texto
- `@tiptap/extension-text-align` - Alineacion
- `@tiptap/extension-highlight` - Resaltado
- `@tiptap/extension-placeholder` - Placeholder
- `@tiptap/extension-underline` - Subrayado
- `dompurify` - Sanitizacion HTML
- `@types/dompurify` - Tipos

## Riesgos

| Riesgo | Probabilidad | Impacto | Mitigacion |
|--------|-------------|---------|------------|
| XSS a traves del contenido de notas | Media | Alto | DOMPurify en cliente + validacion en servidor |
| TipTap no funciona bien con Next.js SSR | Baja | Alto | Usar dynamic import con ssr: false |
| El HTML hace crecer la BD rapidamente | Baja | Bajo | Limpiar HTML viejo, comprimir contenido |
| Rendimiento con notas muy largas | Baja | Medio | Lazy loading, virtualizacion si hace falta |

## Fuera de alcance

- Imagenes o archivos adjuntos
- Tablas
- Codigo con syntax highlighting
- Colaboracion en tiempo real
- Notas anidadas o sub-notas
- Arrastrar y soltar para reordenar bloques
