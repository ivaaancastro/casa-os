# Cierre — Dispositivos (CRUD)

**Estado:** cerrada
**Fecha:** 2026-10-20
**Feature:** `dispositivos-crud`
**PR de feature:** [#16](https://github.com/ivaaancastro/casa-os/pull/16)
**Commit:** `3e38e80`
**PR de cierre:** #17

## Resumen

Inventario manual de dispositivos en `/devices`: crear, consultar, editar y
borrar equipos con IP/MAC únicas, tipo, propietario y notas. ADMIN escribe;
FAMILY solo lee. El estado `online`/`lastSeen` se muestra pero queda en solo
lectura hasta el escáner.

## Alcance entregado

- CRUD completo con validación Zod y errores en español.
- IP y MAC únicas en base de datos, con MAC normalizada a
  `AA:BB:CC:DD:EE:FF`.
- Migración **no destructiva**: aborta con un mensaje claro si ya hay
  duplicados; no borra filas.
- API protegida por sesión; escritura solo ADMIN (`403` para FAMILY).
- UI editorial responsive, formulario inline, errores visibles y borrado en dos
  pasos (sin `window.confirm`).
- Fuera de alcance: escaneo, importación y actualización automática de estado.

## Cambios principales

| Área | Archivos | Qué cambió |
|---|---|---|
| Datos | `prisma/schema.prisma`, `prisma/migrations/20261020162152_device_unique_ip_mac/` | `ip` y `mac` únicas, migración con guarda de duplicados |
| API | `src/app/api/devices/route.ts`, `src/app/api/devices/[id]/route.ts` | GET/POST/PATCH/DELETE, permisos y `409` |
| Lógica | `src/lib/schemas/device.ts`, `src/lib/utils/device.ts`, `src/lib/devices.ts` | Validación, normalización, estado y errores |
| UI | `src/app/devices/page.tsx`, `src/components/devices/DeviceManager.tsx` | Inventario, alta/edición, borrado y modo FAMILY |
| Tests | `tests/api/device.schemas.test.ts`, `tests/device.test.ts` | Esquemas, MAC, estado y catálogo |
| Docs | `README.md`, `CHANGELOG.md`, `MEMORY.md`, `specs/dispositivos-crud/` | Estado, decisiones y cierre |

## Verificación

### Código y tests

| Comando | Resultado |
|---|---|
| `npm run lint` | OK |
| `npm run typecheck` | OK |
| `npm run test` | 174 tests OK |
| `npm run build` | OK; rutas `ƒ /devices` y `ƒ /api/devices` |
| CI del PR #16 | Verde |
| CI de `main` tras el merge | Verde |

### UI / Chrome

- Chrome con build de producción local.
- ADMIN: alta, edición conservando su propia IP/MAC, borrado en dos pasos y
  recarga con datos persistidos.
- Duplicados: IP y MAC devuelven `409`; `400`/`404`/`403` comprobados.
- FAMILY: lista completa sin acciones; `POST/PATCH/DELETE` por API → `403`.
- Móvil 390 px: sin overflow horizontal.
- Consola del navegador limpia.

### Producción

| Campo | Valor |
|---|---|
| URL | <https://casa-os-mauve.vercel.app> |
| Deployment | `AN59fx6pKkakZqNB5qeQ3v1h1Q4U` — *Ready · Latest · Production · Current* |
| Commit | `3e38e80` |
| Health | `GET /api/health` → `200` (`db: ok`) |
| Rutas | `/devices` y `/api/devices` → `307` al login sin sesión; `/auth/login` → `200`; manifest y SW → `200` |
| Cabeceras | CSP, HSTS, `nosniff` y `frame-options` correctas |
| Migración | `vercel-build` terminó *Ready*: `prisma migrate deploy` se aplicó sin errores |
| Smoke autenticado | Confirmado por Iván con su sesión de admin: inventario y acciones visibles; logs del build con `ƒ /devices` y `ƒ /api/devices`. El agente no tenía credencial de producción. |

## Documentación actualizada

- [x] `MEMORY.md`: v0.6, producción, registro de features, foco y lecciones.
- [x] `CHANGELOG.md`: entrada de dispositivos y verificación en producción.
- [x] `README.md`: estado de Dispositivos y enlace al proceso de cierre.
- [x] `docs/*`: protocolo de cierre (`docs/cierre-feature.md`).
- [x] `spec.md` y `plan.md`: decisión de unicidad y migración no destructiva.
- [x] `tasks.md`: once tareas en `[x]` y follow-ups separados.
- [x] `AGENTS.md`: protocolo de cierre obligatorio añadido en este PR.
- [x] `npm run docs:check -- dispositivos-crud` pasa.

## Tareas

### Completadas

- Modelo, migración no destructiva y normalización de MAC.
- Esquemas Zod, utilidades puras y helpers de conflicto.
- API de colección y de elemento con permisos y códigos correctos.
- Página server y UI cliente responsive con borrado en dos pasos.
- Tests de esquemas, normalización, estado y catálogo.
- Documentación, verificación local/Chrome y despliegue en producción.
- PR #16 mergeado, rama borrada y CI de `main` verde.

### Pendientes / follow-ups

- `feat/escaneo-red`: descubrir equipos e importarlos al inventario.
- `feat/dispositivos-estado`: actualizar `online`/`lastSeen` y reflejar el
  estado real.
- Ningún bug conocido del CRUD.

## Decisiones y lecciones

- **IP/MAC únicas en la base de datos**, no solo en la API: el futuro escáner
  podrá hacer `upsert` sin crear duplicados.
- **Migración no destructiva**: con datos existentes, abortar es preferible a
  borrar filas. Los duplicados se resuelven a mano.
- **FAMILY solo lectura** en dispositivos: la API aplica `requireAdmin`; la UI
  oculta acciones, pero no es la única defensa.
- **Borrado en dos pasos** dentro de la fila: evita `window.confirm` y mantiene
  el lenguaje editorial.
- **Estado de solo lectura**: `online`/`lastSeen` no entran en los esquemas de
  escritura; los actualizará el escáner.
- **Verificación autenticada**: sin credencial de producción, el agente no puede
  iniciar sesión. Se verificó lo público y el usuario completó el smoke; así se
  registra, sin presentarlo como automático.

## Riesgos residuales

- El escáner deberá normalizar MAC e IP antes de comparar para no chocar con la
  unicidad.
- No hay auditoría de cambios; el inventario familiar no la necesita todavía.
- Sin dominio propio; se usa el dominio de Vercel.

## Checklist de cierre

- [x] El PR de la feature está mergeado (#16) y la rama borrada.
- [x] El CI de `main` está verde tras el merge de la feature.
- [x] Producción está desplegada y verificada; el smoke autenticado está
      documentado.
- [x] `tasks.md` no tiene casillas pendientes.
- [x] `cierre.md` no tiene casillas pendientes.
- [x] `MEMORY.md` enlaza este cierre y tiene el registro actualizado.
- [x] `CHANGELOG.md`, `README.md` y `docs/*` están al día.
- [x] `npm run docs:check -- dispositivos-crud` pasa.
- [x] El PR de cierre #17 tiene el CI verde.

**Estado final:** cerrada
