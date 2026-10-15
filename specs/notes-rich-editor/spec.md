# Spec: Editor de Texto Enriquecido para Notas

## Requisitos funcionales

1. **Toolbar de herramientas**
   - Barra superior con botones de formato:
     - H1, H2, H3 (titulos)
     - P (parrafo normal)
     - **B** (negrita), *I* (cursiva), U (subrayado), S (tachado)
     - Lista con bullets, lista numerada
     - Checkbox (lista de tareas)
     - Blockquote (cita)
     - Codigo en linea, bloque de codigo
     - Selector de color de texto
     - Selector de color de resaltado
     - Alineacion: izquierda, centro, derecha
     - Deshacer, rehacer

2. **Editor enriquecido**
   - Escribir texto con formato en tiempo real
   - Atajos de teclado (Ctrl+B, Ctrl+I, Ctrl+U)
   - Placeholder cuando esta vacio ("Escribe aqui...")
   - Auto-guardado con debounce (500ms)
   - Indicador de estado: "Guardando..." / "Guardado"

3. **Listas con checkbox**
   - Crear lista de tareas con checkboxes
   - Marcar/desmarcar items haciendo click
   - Reordenar items con drag & drop (opcional, si es facil)

4. **Colores y estilos**
   - Color de texto: paleta de 8 colores + color personalizado
   - Color de resaltado: paleta de 6 colores
   - Tamaño de fuente: normal, pequeno, grande

5. **Preview en la lista**
   - La vista previa en la lista de notas muestra el HTML renderizado
   - Sin mostrar tags HTML crudos

6. **Seguridad**
   - Sanitizar HTML con DOMPurify antes de mostrar
   - Permitir solo tags seguros
   - Bloquear scripts, iframes, y otros elementos peligrosos

## Requisitos no funcionales

- **Rendimiento**: Editor fluido sin lag al escribir
- **UX**: Toolbar fija en la parte superior del editor
- **Accesibilidad**: Atajos de teclado, aria-labels en botones
- **Responsive**: Toolbar compacta en movil

## API / Endpoints

Sin cambios. El contenido sigue siendo un string, pero ahora contiene HTML.

| Metodo | Ruta | Funcion |
|--------|------|---------|
| PATCH | `/api/notes/[id]` | Guardar contenido HTML |
| GET | `/api/notes` | Listar notas (con HTML en content) |

## Modelo de datos

Sin cambios en el schema. El campo `content` de la nota ahora almacena HTML en vez de texto plano.

```prisma
content  String  // Ahora contiene HTML sanitizado
```

## UI/UX

### Desktop

```
┌─────────────────────────────────────────────────────────────┐
│ [H1] [H2] [H3] │ [B] [I] [U] [S] │ [•] [1.] [✓] │ [A▾] [🖍] │
│                 │                  │           │ [◄] [■] [►] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Titulo de la nota                                          │
│                                                             │
│  Contenido con formato:                                     │
│  - Texto **negrita** y *cursiva*                            │
│  - Lista con items                                          │
│  - Colores y resaltados                                     │
│                                                             │
│                                    [Completada] [Eliminar]  │
│                                    Guardado                 │
└─────────────────────────────────────────────────────────────┘
```

### Movil

```
┌─────────────────────────────┐
│ [H] [B] [I] [•] [✓] [A▾] [🖍] │
├─────────────────────────────┤
│                             │
│  Titulo de la nota          │
│                             │
│  Contenido con formato      │
│                             │
└─────────────────────────────┘
```

## Criterios de aceptacion

- [ ] Puedo crear titulos H1, H2, H3
- [ ] Puedo aplicar negrita, cursiva, subrayado, tachado
- [ ] Puedo crear listas con bullets, numeradas y con checkbox
- [ ] Puedo cambiar el color del texto (8 colores)
- [ ] Puedo resaltar texto (6 colores)
- [ ] Puedo alinear texto a izquierda, centro, derecha
- [ ] Puedo deshacer y rehacer cambios
- [ ] El auto-guardado funciona con debounce
- [ ] La vista previa en la lista muestra HTML renderizado
- [ ] El HTML se sanitiza con DOMPurify (sin XSS)
- [ ] Tests de sanitizacion pasan (minimo 6 tests)
- [ ] Doble check: lint, typecheck, test, build
