# Tasks: Auth + Layout con Sidebar

## Fase 1 — Base de datos y dependencias

- [ ] **1.1** Instalar `bcryptjs` y `@types/bcryptjs` — `package.json`
- [ ] **1.2** Añadir campo `password` al modelo `User` en `prisma/schema.prisma`
- [ ] **1.3** Crear migración: `npm run db:migrate -- --name add-user-password`
- [ ] **1.4** Actualizar seed para hashear contraseña del usuario admin — `prisma/seed.ts`

## Fase 2 — Autenticación

- [ ] **2.1** Crear API route de NextAuth: `src/app/api/auth/[...nextauth]/route.ts`
- [ ] **2.2** Modificar `src/lib/auth.ts` para verificar contraseña con bcrypt
- [ ] **2.3** Añadir callbacks JWT con `id` y `role` al token — `src/lib/auth.ts`
- [ ] **2.4** Crear página de login: `src/app/auth/login/page.tsx`
- [ ] **2.5** Crear componente `LoginForm` con email + contraseña + manejo de errores — `src/components/LoginForm.tsx`

## Fase 3 — Layout y Sidebar

- [ ] **3.1** Crear componente `Sidebar` con links de navegación — `src/components/Sidebar.tsx`
- [ ] **3.2** Crear componente `LogoutButton` — `src/components/LogoutButton.tsx`
- [ ] **3.3** Modificar `src/app/layout.tsx` para incluir el sidebar
- [ ] **3.4** Añadir responsive: drawer en móvil con botón hamburguesa — `src/components/Sidebar.tsx`
- [ ] **3.5** Crear página de dispositivos (placeholder): `src/app/devices/page.tsx`
- [ ] **3.6** Crear página de notas (placeholder): `src/app/notas/page.tsx`

## Fase 4 — Tests y verificación

- [ ] **4.1** Test de verificación de contraseña (bcrypt) — `tests/auth.test.ts`
- [ ] **4.2** Test de protección de rutas (middleware) — `tests/middleware.test.ts`
- [ ] **4.3** `npm run lint && npm run typecheck && npm run test` pasan sin errores
- [ ] **4.4** Commit atómico con conventional commits
- [ ] **4.5** Push de la rama `feat/auth-layout` y creación de PR
