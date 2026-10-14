# Spec: Auth + Layout con Sidebar

## Requisitos funcionales

1. **Login con email y contraseña**
   - El usuario introduce email y contraseña en `/auth/login`
   - Si las credenciales son correctas, redirige al dashboard
   - Si son incorrectas, muestra error "Credenciales incorrectas"
   - La contraseña se verifica con bcrypt contra la BD

2. **Protección de rutas**
   - Las rutas `/devices`, `/notas`, `/api` requieren autenticación
   - Si no autenticado, redirigir a `/auth/login`
   - El login es accesible sin autenticación

3. **Layout con sidebar**
   - Sidebar visible en todas las páginas autenticadas
   - Links de navegación: Dashboard (`/`), Dispositivos (`/devices`), Notas (`/notas`)
   - Indicador de usuario: nombre + email
   - Botón "Cerrar sesión" funcional
   - Responsive: en móvil, sidebar se convierte en drawer con botón hamburguesa

4. **Cerrar sesión**
   - Botón en el sidebar que llama a `signOut()` de NextAuth
   - Redirige a `/auth/login` tras cerrar sesión

## Requisitos no funcionales

- **Seguridad**: Contraseñas hasheadas con bcrypt (cost factor 12)
- **UX**: Login centrado, limpio, con feedback de error
- **Rendimiento**: Sidebar estático, sin data fetching innecesario
- **Accesibilidad**: Labels en inputs, aria-labels en botones de navegación

## API / Endpoints

### `POST /api/auth/callback/credentials`

- **Auth**: No (es el callback interno de NextAuth)
- **Body**: `{ email, password }`
- **Response**: Token JWT con `{ id, email, name, role }`

### `POST /api/auth/signout`

- **Auth**: Sí
- **Response**: Redirige a `/auth/login`

## Modelo de datos

Sin cambios en el esquema Prisma. El modelo `User` ya tiene `email` y `name`.
Se añade campo `password` (String?) al modelo User.

### Cambio en `prisma/schema.prisma`

```diff
model User {
  id            String    @id @default(cuid())
  name          String?
  email         String?   @unique
  emailVerified DateTime?
+ password      String?
  image         String?
  role          String    @default("FAMILY")
  ...
}
```

## UI/UX

### Página de Login (`/auth/login`)

```
┌─────────────────────────────────┐
│                                 │
│           🏠 casa-os            │
│                                 │
│  ┌───────────────────────────┐  │
│  │ Email                     │  │
│  │ [________________________] │  │
│  │                           │  │
│  │ Contraseña                │  │
│  │ [________________________] │  │
│  │                           │  │
│  │ [ Iniciar sesión ]        │  │
│  │                           │  │
│  │ ⚠ Credenciales incorrectas│  │
│  └───────────────────────────┘  │
│                                 │
└─────────────────────────────────┘
```

### Layout con Sidebar (autenticado)

```
┌──────┬──────────────────────────┐
│ 🏠   │                          │
│ casa │    Contenido de la       │
│ -os  │    página actual         │
│      │                          │
│──────│                          │
│ 📊   │                          │
│ Dash │                          │
│      │                          │
│ 🖥️   │                          │
│ Disp │                          │
│      │                          │
│ 🛒   │                          │
│ Notas│                          │
│      │                          │
│──────│                          │
│ 👤   │                          │
│ User │                          │
│      │                          │
│ [Salir]                         │
└──────┴──────────────────────────┘
```

### Móvil (drawer)

```
┌──────────────────────────┐
│ ☰ 🏠 casa-os        👤  │
├──────────────────────────┤
│                          │
│    Contenido de la       │
│    página actual         │
│                          │
└──────────────────────────┘

Al tocar ☰:
┌──────┬───────────────────┐
│ 🏠   │                   │
│ casa │    Contenido      │
│ -os  │                   │
│      │                   │
│ 📊   │                   │
│ Dash │                   │
│      │                   │
│ 🖥️   │                   │
│ Disp │                   │
│      │                   │
│ 🛒   │                   │
│ Notas│                   │
│      │                   │
│ [Salir]                  │
└──────┴───────────────────┘
```

## Criterios de aceptación

- [ ] Puedo registrarme un usuario con contraseña hasheada en la BD
- [ ] Puedo hacer login con email + contraseña correctos
- [ ] No puedo hacer login con contraseña incorrecta
- [ ] Si no estoy autenticado, `/devices` y `/notas` redirigen a `/auth/login`
- [ ] El sidebar muestra los 3 links de navegación
- [ ] El sidebar muestra mi nombre de usuario
- [ ] El botón "Cerrar sesión" me devuelve al login
- [ ] En móvil, el sidebar se convierte en drawer con botón hamburguesa
- [ ] `npm run lint && npm run typecheck` pasan sin errores
