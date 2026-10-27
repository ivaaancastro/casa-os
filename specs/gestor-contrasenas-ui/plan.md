# Plan: UI Gestor de contraseñas (feat/gestor-contrasenas-ui)

## Contexto
Backend completado en `feat/gestor-contrasenas` (PR #32, mergeado a main):
- Modelo: `User.encryptedPasswords` (JSON cifrado AES-256-GCM)
- API: `GET/POST /api/passwords` funcionando en producción
- Crypto helpers listos en `src/lib/crypto.ts`

## Enfoque técnico
- **Sección independiente** en `/contrasenas` con sidebar (misma estructura que `/calendario`, `/notas`)
- **Componentes React** en `src/components/passwords/`
- **Hook** `usePasswords` con SWR para fetch/mutate
- **Estilo**: Editorial Inditex (Bodoni/Jost, mobile-first, sin over-engineering)
- **Accesibilidad**: focus-visible, aria-labels, teclado completo

## Dependencias
- Backend ya en `main` (no hay migraciones nuevas)
- SWR ya en proyecto (usado en otras secciones)
- Tipografías y tokens Tailwind ya configurados

## Riesgos
- **Cifrado**: El cliente nunca ve la clave maestra; solo envía/recibe contraseñas en claro vía HTTPS (session cookie). OK.
- **Export/Import**: Archivos JSON cifrados end-to-end; el servidor no los descifra. Implementar en cliente con FileReader API.
- **Mobile**: Lista responsive (cards en móvil, tabla en desktop), modal a pantalla completa en móvil.

## Archivos a crear/modificar
1. `src/app/contrasenas/page.tsx` — página principal `/contrasenas`
2. `src/components/passwords/PasswordList.tsx` — lista (tabla desktop / cards móvil)
3. `src/components/passwords/PasswordModal.tsx` — modal crear/editar
4. `src/components/passwords/PasswordActions.tsx` — botones export/import
5. `src/components/layout/sidebar.tsx` — añadir ítem "Contraseñas" al menú lateral
6. `src/hooks/usePasswords.ts` — SWR hook
7. Tests en `tests/passwords-ui.test.tsx` (vitest + testing-library)