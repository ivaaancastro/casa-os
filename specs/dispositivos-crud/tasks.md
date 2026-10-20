# Tasks — Dispositivos (CRUD)

> Estado: ✅ cerrada (2026-10-20). Registro final:
> [`cierre.md`](cierre.md).
>
> Orden por dependencia. Cada tarea dejó el repo verificable.

## Modelo y API

- [x] **1. Modelo y migración** — `prisma/schema.prisma`: `ip @unique`,
  `mac @unique`. Crear migración `device_unique_ip_mac` y aplicarla en local.
  Revisar el SQL (no destructivo).
- [x] **2. Utilidades puras** — `src/lib/utils/device.ts`: catálogo
  `DEVICE_TYPES`, etiquetas, `normalizeMac` y `formatDeviceStatus`.
- [x] **3. Esquemas Zod** — `src/lib/schemas/device.ts`: `createDeviceSchema` y
  `updateDeviceSchema` (IP, MAC, tipo, propietario, notas; sin
  `online`/`lastSeen`).
- [x] **4. API de colección** — `src/app/api/devices/route.ts`: `GET` (sesión) y
  `POST` (ADMIN), comprobación de propietario y duplicados, 201/400/403/409.
- [x] **5. API de elemento** — `src/app/api/devices/[id]/route.ts`: `PATCH` y
  `DELETE` (ADMIN), 404 y 409 excluyendo el propio dispositivo.

## UI

- [x] **6. Página server** — `src/app/devices/page.tsx`: sesión, lista Prisma,
  usuarios activos, estado formateado y contador.
- [x] **7. UI cliente** — `src/components/devices/DeviceManager.tsx`: listado
  editorial, formulario inline, alta/edición, borrado en dos pasos, errores y
  modo solo lectura para FAMILY; responsive.

## Verificación y entrega

- [x] **8. Tests** — `tests/api/device.schemas.test.ts` y `tests/device.test.ts`
  (esquemas, normalización, estado y catálogo).
- [x] **9. Documentación** — README (estado de Dispositivos), CHANGELOG, MEMORY
  (v0.6 y siguiente feature) y notas técnicas.
- [x] **10. Verificación local** — `lint && typecheck && test && build`;
  build de producción + Chrome: CRUD ADMIN, 409, 403/UI FAMILY, móvil 390 px
  y consola limpia.
- [x] **11. PR y producción** — PR #16, CI verde, squash merge, migración
  aplicada en Vercel, comprobaciones públicas y smoke autenticado confirmado
  por el usuario.

## Pendientes / follow-ups

- `feat/escaneo-red`: descubrir equipos e importarlos al inventario.
- `feat/dispositivos-estado`: actualizar `online`/`lastSeen` y mostrar estado
  real.
- Ningún bug conocido del CRUD.
