# Plan — Dispositivos (CRUD)

> Estado: ✅ cerrada (2026-10-20). Registro final:
> [`cierre.md`](cierre.md).

## Contexto

El modelo `Device` ya existe en Prisma (`name`, `ip`, `mac`, `type`, `online`,
`lastSeen`, `notes`, `ownerId`) y el seed crea un router. Pero `/devices` es solo
un placeholder y **no hay API**: no se puede crear, editar ni borrar nada.

Esta feature entrega el **inventario manual** del Hito 2. El escaneo de red y el
estado automático (`online`/`lastSeen`) llegan en features posteriores.

## Enfoque técnico

1. **Modelo** — añadir `@unique` a `Device.ip` y `Device.mac` (nullable) con una
   migración. Evita duplicados a nivel de base de datos y prepara el `upsert` del
   futuro escáner. `type` sigue siendo `String`; Zod valida el catálogo.
2. **Validación** — `src/lib/schemas/device.ts`:
   - `DEVICE_TYPES` (ROUTER, SWITCH, ACCESS_POINT, NAS, PRINTER, TV, SPEAKER,
     CAMERA, PHONE, LAPTOP, DESKTOP, TABLET, IOT, OTHER).
   - `createDeviceSchema` / `updateDeviceSchema` con Zod: nombre, IPv4, MAC
     opcional (normalizada a `AA:BB:CC:DD:EE:FF`), tipo, propietario opcional y
     notas. `online` y `lastSeen` **no** se aceptan.
3. **Utilidades puras** — `src/lib/utils/device.ts`: `normalizeMac`,
   `DEVICE_TYPE_LABELS` y `formatDeviceStatus` (En línea / Visto hace… / Sin
   datos). Testeables sin BD.
4. **API**:
   - `GET /api/devices` — cualquier sesión; lista con propietario.
   - `POST /api/devices` — ADMIN; 201; 409 si IP/MAC ya existen.
   - `PATCH /api/devices/[id]` — ADMIN; parcial; 404; 409 si choca con otro.
   - `DELETE /api/devices/[id]` — ADMIN; 204; 404.
   - 401 sin sesión, 403 para FAMILY en escritura.
5. **UI**:
   - `src/app/devices/page.tsx` (server): sesión + lista Prisma + usuarios para
     el selector de propietario.
   - `src/components/devices/DeviceManager.tsx` (client): listado editorial,
     alta/edición inline, borrado con confirmación en dos pasos, estados de
     error y `router.refresh()`. Para FAMILY, sin acciones de escritura.
   - Estado (`online`/`lastSeen`) en solo lectura; los actualizará el escáner.
6. **Seed** — sin cambios (el router existente sigue siendo válido).
7. **Tests** — esquemas (IP, MAC, tipo, update parcial), utilidades
   (normalización y formato de estado) y verificación manual de API/UI.
8. **Docs** — README (estado de Dispositivos), CHANGELOG, MEMORY y
   `docs/architecture.md` si procede.

## Dependencias

Ninguna nueva. Se usan Zod, Prisma y los componentes/clases UI existentes.

## Riesgos

| Riesgo | Mitigación |
|---|---|
| `@unique` falla si ya hay IP/MAC duplicadas | Solo existe el router del seed en local/producción; revisar antes de migrar |
| MAC con formatos distintos duplica dispositivos | Normalizar siempre a mayúsculas con `:` antes de guardar/comparar |
| FAMILY puede escribir saltándose la UI | `requireAdmin` en POST/PATCH/DELETE + tests manuales con un usuario FAMILY |
| `online`/`lastSeen` falseados desde el cliente | No forman parte de los esquemas; Zod descarta claves desconocidas |
| Chocar con el futuro escáner | La unicidad de IP/MAC y la normalización facilitan el `upsert` |
| Borrado accidental | Confirmación en dos pasos en la UI |

## Verificación

- Local (build de producción + Chrome): CRUD completo como ADMIN, 409 por
  duplicado, 403/UI de solo lectura como FAMILY, estado y responsive móvil.
- `lint + typecheck + test + build` y CI.
- Producción tras el merge: health, cabeceras, rutas públicas y migración
  aplicada. El smoke autenticado requiere una sesión; si el usuario facilita una
  credencial temporal se repite también en producción.

## Fuera de alcance

- Escaneo de red (`feat/escaneo-red`) y estado automático
  (`feat/dispositivos-estado`).
- Asignación de IP fija, Wake-on-LAN, ping o control remoto.
- Búsqueda/filtros avanzados, importación/exportación y auditoría.
