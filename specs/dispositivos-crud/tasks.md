# Tasks — Dispositivos (CRUD)

> Orden por dependencia. Cada tarea deja el repo verificable.

1. **Modelo y migración** — `prisma/schema.prisma`: `ip @unique`, `mac @unique`.
   Crear migración `device_unique_ip_mac` y aplicarla en local. Revisar el SQL.

2. **Utilidades puras** — `src/lib/utils/device.ts`: catálogo `DEVICE_TYPES`,
   etiquetas, `normalizeMac` y `formatDeviceStatus`.

3. **Esquemas Zod** — `src/lib/schemas/device.ts`: `createDeviceSchema` y
   `updateDeviceSchema` (IP, MAC, tipo, propietario, notas; sin
   `online`/`lastSeen`).

4. **API de colección** — `src/app/api/devices/route.ts`: `GET` (sesión) y
   `POST` (ADMIN), comprobación de propietario y duplicados, 201/400/403/409.

5. **API de elemento** — `src/app/api/devices/[id]/route.ts`: `PATCH` y
   `DELETE` (ADMIN), 404 y 409 excluyendo el propio dispositivo.

6. **Página server** — `src/app/devices/page.tsx`: sesión, lista Prisma,
   usuarios activos, estado formateado y contador.

7. **UI cliente** — `src/components/devices/DeviceManager.tsx`: listado
   editorial, formulario inline, alta/edición, borrado en dos pasos, errores y
   modo solo lectura para FAMILY; responsive.

8. **Tests** — `tests/api/device.schemas.test.ts` y `tests/device.test.ts`
   (esquemas, normalización, estado y catálogo).

9. **Documentación** — README (estado de Dispositivos), CHANGELOG, MEMORY
   (v0.6 y siguiente feature) y notas técnicas.

10. **Verificación local** — `lint && typecheck && vitest run && build`;
    build de producción + Chrome: CRUD ADMIN, 409, 403/UI FAMILY, móvil 390 px
    y consola limpia.

11. **PR y producción** — PR, CI verde, squash merge, migración aplicada en
    Vercel y comprobaciones públicas (health, cabeceras, `/devices` protegida).
