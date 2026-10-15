# Spec: CRUD de Notas y Lista de la Compra

## Requisitos funcionales

1. **Listar notas**
   - Ver todas las notas ordenadas por `createdAt` descendente
   - Filtrar por tipo: SHOPPING, GENERAL, TODO
   - Filtrar por estado: completadas / pendientes
   - Indicar quién creo cada nota (nombre del autor)

2. **Crear nota**
   - Formulario con campo titulo, contenido y tipo
   - Al crear, aparece al principio de la lista
   - Validacion: titulo requerido, minimo 3 caracteres

3. **Editar nota**
   - Editar titulo, contenido y tipo de una nota existente
   - Solo el autor o un admin pueden editar

4. **Eliminar nota**
   - Eliminar una nota con confirmacion
   - Solo el autor o un admin pueden eliminar

5. **Toggle completado**
   - Marcar/desmarcar una nota como completada con un click
   - Optimistic UI: el cambio es instantaneo, se sincroniza en segundo plano
   - Las notas completadas aparecen con estilo visual diferenciado (tachado, opacidad)

6. **Lista de la compra (caso especial)**
   - Las notas tipo SHOPPING muestran checkbox grande al inicio
   - Al marcar comprado, el item se tacha y se mueve al final
   - Boton "Limpiar completados" para eliminar todos los items comprados de una nota

## Requisitos no funcionales

- **Rendimiento**: Carga inicial de notas < 200ms con ~50 notas
- **UX**: Interaccion fluida, optimistic updates, sin parpadeos
- **Accesibilidad**: Labels en inputs, aria-labels en botones, navegacion por teclado
- **Seguridad**: Validacion Zod, autenticacion obligatoria, autorizacion por rol

## API / Endpoints

### `GET /api/notes`

- **Auth**: Si
- **Query params**: `?type=SHOPPING&completed=false`
- **Response**: `200 OK`
```json
{
  "notes": [
    {
      "id": "xxx",
      "title": "Lista de la compra",
      "content": "Leche, pan, huevos",
      "type": "SHOPPING",
      "completed": false,
      "createdAt": "2026-10-15T10:00:00Z",
      "updatedAt": "2026-10-15T10:00:00Z",
      "author": {
        "id": "xxx",
        "name": "Ivan"
      }
    }
  ]
}
```

### `POST /api/notes`

- **Auth**: Si
- **Body**:
```json
{
  "title": "Nueva nota",
  "content": "Contenido de la nota",
  "type": "GENERAL"
}
```
- **Response**: `201 Created` con la nota creada
- **Erros**: `400` (validacion), `401` (no autenticado)

### `PATCH /api/notes/[id]`

- **Auth**: Si (solo autor o admin)
- **Body**: `{ "title"?, "content"?, "type"?, "completed"? }`
- **Response**: `200 OK` con la nota actualizada
- **Erros**: `403` (no autorizado), `404` (no encontrada)

### `DELETE /api/notes/[id]`

- **Auth**: Si (solo autor o admin)
- **Response**: `204 No Content`
- **Erros**: `403`, `404`

## Modelo de datos

Sin cambios. Usa el modelo `Note` existente:

```prisma
model Note {
  id        String   @id @default(cuid())
  title     String
  content   String
  type      String   @default("SHOPPING")
  completed Boolean  @default(false)
  authorId  String
  author    User     @relation(fields: [authorId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

## UI/UX

### Pagina de notas (`/notas`)

```
┌──────────────────────────────────────────────────┐
│ Notas                              [+ Nueva]     │
├──────────────────────────────────────────────────┤
│ Filtros: [Todas] [Compra] [General] [Pendientes] │
├──────────────────────────────────────────────────┤
│                                                  │
│ ┌──────────────────────────────────────────────┐ │
│ │ □ Lista de la compra                         │ │
│ │   Leche, pan, huevos                         │ │
│   Creada por Ivan · 2 min                    │ │
│   [Editar] [Eliminar]                          │ │
│ └──────────────────────────────────────────────┘ │
│                                                  │
│ ┌──────────────────────────────────────────────┐ │
│ │ ■ Comprar detergentes          (completada)  │ │
│   Creada por Maria · 1 hora                  │ │
│   [Editar] [Eliminar]                          │ │
│ └──────────────────────────────────────────────┘ │
│                                                  │
└──────────────────────────────────────────────────┘
```

### Formulario crear/editar

```
┌─────────────────────────────────────────┐
│  Crear nota                        [X] │
├─────────────────────────────────────────┤
│                                         │
│  Titulo                                 │
│  [____________________________]         │
│                                         │
│  Contenido                              │
│  [____________________________]         │
│  [____________________________]         │
│                                         │
│  Tipo                                   │
│  ( Compra )  ( General )  ( Pendiente ) │
│                                         │
│           [Cancelar]  [Crear]           │
└─────────────────────────────────────────┘
```

## Criterios de aceptacion

- [ ] Puedo ver todas las notas de la familia ordenadas por fecha
- [ ] Puedo crear una nueva nota con titulo, contenido y tipo
- [ ] Puedo editar una nota existente (solo si soy el autor o admin)
- [ ] Puedo eliminar una nota (solo si soy el autor o admin)
- [ ] Puedo marcar/desmarcar una nota como completada con un click
- [ ] Las notas completadas se ven diferenciadas visualmente
- [ ] Puedo filtrar notas por tipo (compra, general, pendiente)
- [ ] La lista de la compra muestra checkbox y permite limpiar completados
- [ ] Las notas muestran quien las creo
- [ ] Los errores de validacion se muestran al usuario
- [ ] La UI es responsive y funciona en movil
- [ ] Tests del CRUD pasan (al menos 8 tests)
- [ ] `npm run lint && npm run typecheck && npm run test && npm run build` pasan
