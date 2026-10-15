# Plan: CRUD de Notas y Lista de la Compra

## Contexto

La sección de notas actualmente es un placeholder. Necesitamos implementar el CRUD
completo para que la familia pueda crear, editar, eliminar y marcar notas como
completadas. El caso de uso principal es la lista de la compra compartida.

## Enfoque técnico

### Backend

- API Routes REST en `src/app/api/notes/`
- Validación de entrada con Zod
- Autenticación obligatoria vía `getServerSession`
- Prisma para persistencia

### Frontend

- Server Components para renderizado inicial
- Client Components para interactividad (crear, editar, toggle)
- Optimistic UI para toggle de completado
- Formulario modal o inline para crear/editar

### Tipos de notas

| Tipo | Descripcion | Uso |
|------|-------------|-----|
| `SHOPPING` | Lista de la compra | Checkbox para marcar comprado |
| `GENERAL` | Notas generales | Texto libre |
| `TODO` | Pendientes | Checkbox para marcar hecho |

## Estructura de archivos

```
src/
├── app/
│   ├── notas/
│   │   └── page.tsx              ← Modificado: CRUD completo
│   └── api/
│       └── notes/
│           ├── route.ts          ← GET (listar), POST (crear)
│           └── [id]/
│               └── route.ts      ← PATCH (editar), DELETE (eliminar)
├── components/
│   ├── notes/
│   │   ├── NoteList.tsx          ← Lista de notas
│   │   ├── NoteCard.tsx          ← Nota individual
│   │   ├── NoteForm.tsx          ← Formulario crear/editar
│   │   └── NoteFilters.tsx       ← Filtros por tipo
│   └── ui/
│       └── Modal.tsx             ← Modal reutilizable
├── lib/
│   └── schemas/
│       └── note.ts               ← Schemas Zod
└── tests/
    └── notes.test.ts             ← Tests del CRUD
```

## Dependencias

- [x] Prisma (modelo Note ya existe)
- [x] Zod ya instalado
- [ ] Crear schemas Zod para validación
- [ ] Crear API routes
- [ ] Crear componentes UI

## Riesgos

| Riesgo | Probabilidad | Impacto | Mitigacion |
|--------|-------------|---------|------------|
| Concurrent edits de notas familiares | Media | Bajo | Los cambios son simples, ultimo en escribir gana |
| Modal rompe en movil | Baja | Medio | Usar drawer en vez de modal en pantallas pequeñas |

## Fuera de alcance

- Colaboracion en tiempo real (WebSockets)
- Adjuntar imagenes a notas
- Categorias o etiquetas personalizadas
- Recordatorios programados
