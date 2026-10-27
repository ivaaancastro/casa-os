# Spec: UI Gestor de contraseñas (feat/gestor-contrasenas-ui)

## Resumen
Sección independiente en el menú lateral izquierdo (igual que "Calendario", "Notas", "Dispositivos") con ruta `/contrasenas`. Permite CRUD completo de contraseñas familiares, integrada con el estilo editorial Inditex del proyecto (tipografías Bodoni/Jost, mobile-first, sin over-engineering, sin iconos nuevos — solo texto como el sidebar existente).

## Alcance (MVP)
- **Ítem nuevo** en menú lateral izquierdo, después de "Familia", con label "Contraseñas" (solo texto, sin icono nuevo — mantener consistencia con `Sidebar.tsx`)
- Ruta `/contrasenas` con layout App Router + sidebar (misma estructura que `/calendario`, `/notas`, `/devices`)
- Página con header (`Casa · Contraseñas` + subtítulo descriptivo)
- Lista de entradas: título, usuario, categoría, notas, acciones (ver/ocultar, copiar, editar, borrar)
- Ver/ocultar contraseña (toggle tipo `input[type="password"]` ↔ `text`, sin icono ojo)
- Copiar al portapapeles (toast confirmación, sin icono)
- Crear entrada (modal con validación Zod)
- Editar entrada (modal pre-llenado)
- Eliminar entrada (confirmación `window.confirm` en dos pasos)
- Exportar: descarga `passwords-<fecha>.json.cifrado` (nombre de archivo solo texto)
- Importar: file input + merge (evita duplicados por título, solo texto)
- Responsive: mobile-first (390px), desktop (contenido fluido con sidebar)
- Sin dependencias de icon libraries nuevas — usar solo estilos Tailwind existentes

## Fuera de alcance (follow-ups)
- Compartir contraseñas entre miembros familia
- Generador de contraseñas integrado
- Extensión navegador
- Auditoría de accesos visual

## Estilo y consistencia visual

### Sidebar (consistencia obligatoria)
- `Sidebar.tsx` usa `navItems` como `{ href, label }` — **solo texto**, sin `icon` property
- El nuevo ítem "Contraseñas" debe añadirse igual: `{ href: '/contrasenas', label: 'Contraseñas' }`
- Clases activas: `bg-ink text-canvas` (igual que el resto)
- Mobile: `-translate-x-full` / `translate-x-0` (mismo transition)
- Sin SVG nuevo, sin fuentes de iconos — mantener el patrón actual 100%

### Página `/contrasenas` (consistencia con `/calendario` / `/devices`)
- **Contenedor**: `div className="mx-auto max-w-7xl px-5 py-10 md:px-10 md:py-12 lg:px-16 lg:py-16"`
- **Grid**: `div className="grid animate-fade-rise grid-cols-12 gap-y-8"`
- **Header**: `div className="col-span-12 border-t border-mist pt-8"` con:
  - `p className="mb-4 text-xs tracking-wider2 text-ash"` → `Casa · Contraseñas`
  - `h1 className="font-display text-5xl leading-[0.9] tracking-editorial md:text-6xl"` → `Contraseñas`
  - `p className="mt-4 max-w-xl text-sm text-ash"` → subtítulo descriptivo: "Gestión segura de credenciales familiares. Crea, comparte (solo tuyo) y respalda tus passwords."
- **Section**: `div className="col-span-12 border-t border-mist pt-8"` → contenido principal

### Tipografía
- **Titles**: `font-display` (Bodoni Moda) — ya usado en todas las pages
- **Body/text**: `font-ui` / `text-ash` / `text-ink` — tokens Tailwind ya configurados
- **Small print**: `text-[10px] tracking-wider2 text-ash` — mismo que devices/calendario

### Componentes (estilo minimalista)
- **Botones**: `group flex items-center justify-between border border-transparent px-3 py-3 text-sm transition-colors duration-200` — igual que navItems sidebar
- **Estado activo**: `bg-ink text-canvas` — patrón existente
- **Hover**: `text-ink hover:border-ink` — patrón existente
- **Skeleton**: usar `animate-pulse` class si es loading (estilo existente en proyecto)
- **Toast**: usar patrón `toast` existente (sin iconos nuevos)

### Mobile (390px)
- Sin overflow, contenido fluido
- Header apilado verticalmente en móvil (grid-cols-12 en mobile es 1 columna)
- Sidebar collapsed (`-translate-x-full`), visible en hamburger button
- Cards o lista simple sin tablas complejas

## API (ya implementada, backend en `main`)
| Método | Endpoint | Request | Response |
|--------|----------|---------|----------|
| GET | `/api/passwords` | — | `PasswordEntry[]` |
| POST | `/api/passwords` | `{title, username?, password, notes?, category?}` | `{success: true}` |

> *DELETE y PUT son follow-ups del backend; si no existen, la UI deshabilita editar/borrar con tooltip "Próximamente" (solo texto).*

## Componentes a crear

### 1. `src/components/layout/sidebar.tsx` — añadírsele el ítem
```typescript
// Añadir al array navItems (después de Familia):
{ href: '/contrasenas', label: 'Contraseñas' }
```
- Sin `icon` property
- Mismo tipo que los demás: `{ href, label }`

### 2. `src/app/contrasenas/page.tsx` — página principal
Estructura idéntica a `src/app/calendario/page.tsx` y `src/app/devices/page.tsx`:
- Header con `Casa · Contraseñas` + subtítulo
- Section con lista de entradas

### 3. `src/components/passwords/PasswordList.tsx` — lista
- **Desktop (≥768px)**: tabla simple (sin íconos columna)
  | Título | Usuario | Categoría | Acciones |
  |--------|---------|-----------|----------|
  | GitHub | ivan | desarrollo | [Ver] [Copiar] [Editar] [Borrar] |
- **Móvil (<768px)**: cards apiladas
  ```
  GitHub
  ivan • desarrollo
  [Ver] [Copiar] [Editar] [Borrar]
  ```
- Empty state: `p className="text-ash text-center py-12"` → "Sin contraseñas aún. [Añadir primera]"
- Loading: skeleton rows (mismo patrón que otras lists del proyecto)

### 4. `src/components/passwords/PasswordModal.tsx` — modal crear/editar
- Dialog centrado (desktop) / full-screen (móvil `fixed inset-0`)
- Campos: Título* (solo texto), Usuario, Contraseña*, Notas, Categoría (select: personal, trabajo, banca, desarrollo, streaming, **otro** — todas opciones texto, sin emojis/avatares)
- Validación Zod cliente (título requerido, máximo 50 caracteres)
- Botones: `Cancelar` / `Guardar` (disabled mientras inválido)
- Focus trap, ESC cierra, click backdrop cierra
- Sin nuevos SVG — usar `close` text link o `X` texto

### 5. `src/components/passwords/PasswordActions.tsx` — export/import
- **Exportar**: botón/link `descargar passwords-YYYY-MM-DD.json` → `click` → `fetch('/api/passwords', {headers: {'Accept': 'application/json'}})` → `Blob` → `window.download`
- **Importar**: `<input type="file" accept=".json" />` → `FileReader` → parsear JSON → mapear `POST /api/passwords` por cada entrada nueva → toast "X importadas, Y omitidas"
- Sin nuevos componentes visuales — botones con clases existentes

### 6. `src/hooks/usePasswords.ts` — hook SWR
- `useSWR('/api/passwords', fetcher, { revalidateOnFocus: true })`
- `mutate` para create/edit/delete después de mutations exitosas
- Error handling: `onError` toast "Error al cargar contraseñas"

## Navegación y routing
- Ruta: `/contrasenas` protegida por `getSessionUser()` redirección `/auth/login` (mismo patrón que `/calendario`, `/devices`)
- Links en sidebar: `<Link href="/contrasenas">Contraseñas</Link>` (solo texto, sin icono)
- `usePathname()` para highlight active en sidebar (mismo código que el resto)

## Criterios de aceptación
1. Usuario logueado ve ítem "Contraseñas" en menú lateral izquierdo (mismo estilo que Dispositivos/Calendario/Notas)
2. Navegar a `/contrasenas` muestra página con header `Casa · Contraseñas` + subtítulo
3. Lista muestra entradas existentes (si las hay) con acciones funcionando (texto, sin íconos)
4. Crear entrada → aparece en lista sin recargar (SWR mutate), validación Zod, toast solo texto
5. Ver/ocultar togglea tipo input (password ↔ text), label solo texto "Ver contraseña" / "Ocultar contraseña"
6. Copiar → portapapeles + toast "Copiado" (solo texto)
7. Editar → modal pre-llenado → guardar → lista actualizada
8. Eliminar → confirmación `window.confirm` → entrada desaparece
9. Exportar → archivo descargado con nombre `passwords-YYYY-MM-DD.json` (solo texto)
10. Importar archivo JSON → entradas nuevas añadidas, duplicados omitidos (solo texto en mensajes)
11. Mobile 390px: sin overflow, header/apilan vertical, sidebar collapsed, lista cards apiladas
12. `npm run test && npm run lint && npm run typecheck && npm run build` — todo verde
13. Sin importar nuevas librerías de iconos — todo consistente con `Sidebar.tsx` y las pages existentes

## Follow-ups (features posteriores, nueva feature)
- `feat/gestor-contrasenas-import` — mejora import/export con progreso visual
- `feat/gestor-contrasenas-share` — compartir entre miembros familia (UI separada)
- `feat/gestor-contrasenas-extension` — extensión navegador autollenado