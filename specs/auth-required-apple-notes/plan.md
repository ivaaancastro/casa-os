# Plan: Auth Obligatoria + Notas estilo Apple Notes

## Contexto

Dos cambios solicitados:

1. **Auth obligatoria**: Actualmente el dashboard es accesible sin login. El usuario
   quiere que toda la app requiera autenticación, sin excepciones.

2. **Notas estilo Apple Notes**: Rediseñar la sección de notas para que funcione
   igual que Apple Notes: sidebar con carpetas, lista de notas, editor en línea,
   sin modales ni formularios separados.

## Enfoque técnico

### 1. Auth obligatoria

- Modificar `src/middleware.ts` para proteger TODAS las rutas excepto `/auth/login`
- El dashboard `/` también requiere login
- Redirección automática a `/auth/login?callbackUrl=/` si no autenticado

### 2. Notas estilo Apple Notes

Apple Notes tiene esta estructura:

```
┌──────────┬─────────────────────┬──────────────────────────┐
│ Carpetas │ Lista de notas      │ Editor                   │
│          │                     │                          │
│ Todas    │ Nota 1 (preview)    │ Título de la nota        │
│          │                     │                          │
│ Compras  │ Nota 2 (preview)    │ Contenido de la nota     │
│          │                     │                          │
│ Ideas    │ Nota 3 (preview)    │                          │
│          │                     │                          │
│ [+]      │                     │                          │
└──────────┴─────────────────────┴──────────────────────────┘
```

**Características clave de Apple Notes:**

- **3 columnas**: Carpetas | Lista | Editor
- **Vista de lista**: Preview de cada nota (título + primeras líneas + fecha)
- **Editor en línea**: Click en una nota se abre en la columna derecha
- **Crear nota**: Botón "+" en la lista de notas
- **Eliminar nota**: Botón de papelera en el editor
- **Búsqueda**: Campo de búsqueda en la lista de notas
- **Carpetas**: Filtrar por carpeta (en nuestro caso: tipo de nota)
- **Sin modales**: Todo en línea, sin popups
- **Auto-guardado**: Los cambios se guardan automáticamente al salir del campo

### Estructura de archivos

```
src/
├── app/
│   ├── notas/
│   │   └── page.tsx              ← Modificado: layout de 3 columnas
│   └── api/
│       └── notes/
│           ├── route.ts          ← Sin cambios
│           └── [id]/
│               └── route.ts      ← Sin cambios
├── components/
│   ├── notes/
│   │   ├── NotesLayout.tsx       ← Nuevo: layout 3 columnas
│   │   ├── NotesSidebar.tsx      ← Nuevo: carpetas/filtros
│   │   ├── NotesList.tsx         ← Nuevo: lista de notas con preview
│   │   ├── NoteEditor.tsx        ← Nuevo: editor en línea
│   │   └── NoteItem.tsx          ← Nuevo: item en la lista
│   └── ui/
│       └── Modal.tsx             ← Se elimina (ya no se usa)
├── middleware.ts                 ← Modificado: proteger todo
└── tests/
    └── notes-apple.test.ts       ← Nuevo: tests del flujo
```

## Dependencias

- [x] API de notas ya existe
- [ ] Rediseñar UI de notas
- [ ] Modificar middleware
- [ ] Tests del nuevo flujo

## Riesgos

| Riesgo | Probabilidad | Impacto | Mitigacion |
|--------|-------------|---------|------------|
| 3 columnas no funciona bien en movil | Alta | Medio | En movil: mostrar 1 columna con navegacion entre vistas |
| Auto-guardado pierde datos | Baja | Alto | Guardar en cada cambio con debounce |
| El rediseño rompe funcionalidad existente | Media | Medio | Tests exhaustivos del CRUD |

## Fuera de alcance

- Sincronizacion en tiempo real
- Notas compartidas con otros usuarios (colaboracion)
- Adjuntar imagenes o archivos
- Formato de texto enriquecido (bold, italic, etc.)
- Carpetas personalizadas (usar tipos existentes)
