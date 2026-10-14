# Plan: Auth + Layout con Sidebar

## Contexto

Actualmente la app tiene un layout básico sin navegación ni autenticación real.
El login acepta cualquier email sin verificar contraseña, y no hay forma de
moverse entre secciones. Necesitamos:

1. Autenticación real con email + contraseña (bcrypt)
2. Layout principal con sidebar de navegación
3. Protección de rutas (redirigir a login si no autenticado)
4. Página de login funcional

## Enfoque técnico

### Autenticación

- **NextAuth.js** con `CredentialsProvider`
- Contraseñas hasheadas con **bcryptjs** (ligero, sin dependencias nativas)
- Middleware de NextAuth protegiendo rutas privadas
- Callbacks JWT para incluir `role` y `id` en el token
- Página de login en `/auth/login` con formulario email + contraseña

### Layout

- **Sidebar** fijo a la izquierda (desktop) / drawer (mobile)
- Links: Dashboard, Dispositivos, Notas
- Indicador de usuario autenticado (nombre + botón logout)
- Responsive: sidebar colapsable en móvil

### Estructura de archivos

```
src/
├── app/
│   ├── layout.tsx              ← Modificado: incluye Sidebar
│   ├── page.tsx                ← Dashboard (ya existe)
│   ├── auth/
│   │   └── login/
│   │       └── page.tsx        ← Nueva: página de login
│   └── api/
│       └── auth/
│           └── [...nextauth]/
│               └── route.ts    ← Nueva: handler de NextAuth
├── components/
│   ├── Sidebar.tsx             ← Nueva: navegación lateral
│   └── LogoutButton.tsx        ← Nueva: botón de cerrar sesión
├── lib/
│   ├── auth.ts                 ← Modificado: añadir bcrypt
│   └── prisma.ts               ← Sin cambios
└── middleware.ts               ← Sin cambios (ya existe)
```

## Dependencias

- [x] NextAuth ya configurado (básico)
- [ ] Instalar `bcryptjs` + `@types/bcryptjs`
- [ ] Crear API route de NextAuth (`/api/auth/[...nextauth]`)
- [ ] Modificar `lib/auth.ts` para verificar contraseña con bcrypt

## Riesgos

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|------------|
| NextAuth v4 tiene breaking changes con App Router | Baja | Alto | Usar configuración estándar documentada |
| bcryptjs en server components | Baja | Medio | Solo usar en API routes y Server Actions |
| Sidebar rompe en pantallas pequeñas | Media | Bajo | Diseño responsive con drawer en móvil |

## Fuera de alcance

- Registro de usuarios (se hará manualmente o en spec separado)
- Recuperación de contraseña
- Roles granulares (solo ADMIN/FAMILY como está)
- OAuth (Google, GitHub, etc.)
