# MEMORY.md — Memoria del Proyecto

> Este archivo es la memoria persistente del proyecto. Aquí se registran decisiones
> clave, contexto, preferencias y estado actual. Los agentes deben leerlo al empezar
> a trabajar en el proyecto.

## Contexto

**casa-os** nace de la necesidad de centralizar toda la información del hogar en un
solo lugar. Es un proyecto de uso personal/familiar, no comercial. El objetivo es
tener una app que toda la familia pueda usar desde sus móviles y ordenadores.

### Familia usuarios
- Iván (admin)
- [Otros miembros — pendiente de definir]

### Problemas que resuelve
- No saber qué dispositivos hay conectados a la red de casa
- Perder la lista de la compra
- No tener un sitio central para notas familiares

## Decisiones clave

| Fecha | Decisión | Razón |
|-------|----------|-------|
| 2026-10-14 | Next.js como framework | Full-stack, React conocido, fácil despliegue |
| 2026-10-14 | SQLite como base de datos | Cero infraestructura, ideal para hogar |
| 2026-10-14 | Prisma como ORM | Migraciones limpias, tipos automáticos |
| 2026-10-14 | NextAuth para auth | Estándar, soporta roles, JWT |
| 2026-10-14 | Tailwind CSS | Rápido, responsive de fábrica |
| 2026-10-14 | Autoalojado en casa | Privacidad, cero coste, control total |
| 2026-10-14 | Cloudflare Tunnel para acceso externo | Sin abrir puertos, HTTPS gratis |
| 2026-10-14 | TypeScript strict | Evitar bugs, mejor DX |

## Preferencias del usuario

- **Idioma del proyecto**: Español (código en español, comentarios en español)
- **Estilo de código**: Directo, sin over-engineering
- **Commits**: Conventional Commits en español
- **Diseño**: Simple, funcional, mobile-first

## Estado del roadmap

### ✅ Completado
- [x] Definición del proyecto y stack
- [x] Estructura base del repositorio
- [x] Configuración de herramientas (ESLint, TypeScript, Tailwind)
- [x] Esquema inicial de base de datos

### 🚧 En desarrollo
- [ ] Autenticación con NextAuth
- [ ] Layout principal con sidebar
- [ ] Dashboard
- [ ] CRUD de notas (lista de la compra)

### 📋 Próximos hitos
- [ ] Escaneo de red de dispositivos
- [ ] Sección de dispositivos
- [ ] Calendario familiar
- [ ] Inventario del hogar

### 💡 Ideas futuras
- [ ] Control de domótica (luces, enchufes)
- [ ] Gestión de gastos
- [ ] Documentos del hogar
- [ ] Notificaciones push
- [ ] App móvil (React Native / PWA)

## Notas técnicas

- La red local es `192.168.1.0/24`
- El router principal es `192.168.1.1`
- Usar `nmap` para escaneo de red (requiere instalación en el equipo)
- SQLite es suficiente para el volumen de datos esperado

## Lecciones aprendidas

_(Se irán añadiendo con el tiempo)_

---

*Última actualización: 2026-10-14*
