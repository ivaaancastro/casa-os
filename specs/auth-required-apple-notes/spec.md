# Spec: Auth Obligatoria + Notas estilo Apple Notes

## Requisitos funcionales

### Parte 1: Auth Obligatoria

1. **Proteccion total de la app**
   - Cualquier ruta excepto `/auth/login` requiere autenticacion
   - Si no autenticado, redirigir a `/auth/login?callbackUrl=/`
   - El dashboard `/` tambien requiere login
   - Las API routes ya estan protegidas (sin cambios)

### Parte 2: Notas estilo Apple Notes

1. **Layout de 3 columnas**
   - Columna 1 (240px): Carpetas/filtros
   - Columna 2 (320px): Lista de notas con preview
   - Columna 3 (flex): Editor de la nota seleccionada
   - En movil: 1 columna con navegacion entre vistas

2. **Sidebar de carpetas**
   - "Todas las notas" (sin filtro)
   - "Compra" (tipo SHOPPING)
   - "General" (tipo GENERAL)
   - "Pendientes" (tipo TODO)
   - Contador de notas en cada carpeta

3. **Lista de notas**
   - Preview: titulo + primeras 2 lineas + fecha
   - Nota seleccionada resaltada
   - Buscador en la parte superior
   - Boton "+" para crear nueva nota
   - Ordenacion: mas reciente primero

4. **Editor en linea**
   - Campo de titulo (grande, sin borde)
   - Campo de contenido (textarea auto-expandible)
   - Auto-guardado con debounce (500ms)
   - Indicador de "Guardado..." / "Guardado"
   - Boton de eliminar nota (papelera)
   - Boton de marcar completado (para SHOPPING y TODO)

5. **Crear nota**
   - Click en "+" crea nueva nota vacia
   - Se abre automaticamente en el editor
   - El titulo queda enfocado para escribir

6. **Eliminar nota**
   - Boton de papelera en el editor
   - Confirmacion antes de eliminar
   - Si era la seleccionada, limpiar el editor

7. **Busqueda**
   - Campo de busqueda en la lista de notas
   - Filtra por titulo y contenido
   - Tiempo real (sin debounce en el filtro local)

## Requisitos no funcionales

- **Rendamiento**: Carga inicial < 200ms con 50 notas
- **UX**: Transiciones suaves entre vistas, sin parpadeos
- **Accesibilidad**: Navegacion por teclado, aria-labels
- **Responsive**: En movil, las 3 columnas se apilan con navegacion

## API / Endpoints

Sin cambios en la API. Se usa la misma:

| Metodo | Ruta | Funcion |
|--------|------|---------|
| GET | `/api/notes?type=&completed=` | Listar con filtros |
| POST | `/api/notes` | Crear nota |
| PATCH | `/api/notes/[id]` | Editar nota (auto-guardado) |
| DELETE | `/api/notes/[id]` | Eliminar nota |

## Modelo de datos

Sin cambios. Usa el modelo `Note` existente.

## UI/UX

### Desktop (3 columnas)

```
┌──────────┬─────────────────────┬──────────────────────────┐
│          │ Buscar...      [+] │                          │
│ Carpetas ├─────────────────────┤                          │
│          │                     │                          │
│ Todas 12 │ Nota 1             │ Titulo de la nota        │
│ Compra 5 │ Vista previa...    │                          │
│ General 4│ Hace 2 horas        │                          │
│ Pendien.3│                     │ Contenido de la nota     │
│          ├─────────────────────┤                          │
│          │ Nota 2             │                          │
│          │ Vista previa...    │                          │
│          │ Ayer               │                          │
│          ├─────────────────────┤ [Completada] [Eliminar] │
│          │ Nota 3             │                          │
│          │ Vista previa...    │ Guardado                 │
│          │ Hace 3 dias        │                          │
└──────────┴─────────────────────┴──────────────────────────┘
```

### Movil (1 columna)

```
┌─────────────────────────────┐
│ < Carpetas                  │
├─────────────────────────────┤
│ Buscar...              [+]  │
├─────────────────────────────┤
│ Nota 1                      │
│ Vista previa...             │
│ Hace 2 horas                │
├─────────────────────────────┤
│ Nota 2                      │
│ Vista previa...             │
│ Ayer                        │
└─────────────────────────────┘

Click en nota:
┌─────────────────────────────┐
│ < Lista                     │
├─────────────────────────────┤
│ Titulo de la nota           │
│                             │
│ Contenido de la nota        │
│                             │
│ [Completada] [Eliminar]     │
│ Guardado                    │
└─────────────────────────────┘
```

## Criterios de aceptacion

- [ ] Sin login, no se puede acceder a ninguna pagina excepto /auth/login
- [ ] Al intentar acceder a / sin login, redirige a /auth/login
- [ ] Las notas muestran 3 columnas en desktop
- [ ] Las notas muestran 1 columna en movil con navegacion
- [ ] Se puede crear nota con boton "+"
- [ ] Se puede editar titulo y contenido en linea
- [ ] Auto-guardado funciona (indicador "Guardado")
- [ ] Se puede eliminar nota con confirmacion
- [ ] Se puede buscar notas por titulo o contenido
- [ ] Se puede filtrar por carpeta (tipo)
- [ ] Se puede marcar completada desde el editor
- [ ] Tests del flujo completo pasan
- [ ] Doble check: lint, typecheck, test, build
