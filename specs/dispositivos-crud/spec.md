# Spec — Dispositivos (CRUD)

> Estado: ✅ cerrada (2026-10-20). Registro final:
> [`cierre.md`](cierre.md).

## Objetivo

Gestionar a mano el inventario de dispositivos del hogar desde `/devices`:
crear, consultar, editar y borrar, con permisos por rol y sin duplicados de
IP/MAC. El estado online se muestra pero lo actualizará el escáner en otra
feature.

## Modelo de datos

`Device` ya existe. Cambios:

| Campo | Cambio |
|---|---|
| `ip` | `String @unique` (IPv4, obligatoria) |
| `mac` | `String? @unique` (opcional, normalizada `AA:BB:CC:DD:EE:FF`) |
| `type` | Sin cambio (`String`, validado por Zod) |
| `online`, `lastSeen` | Sin cambio; solo lectura desde la API/UI |
| `ownerId` | Sin cambio (`SetNull` al borrar el usuario) |

Migración nueva: índices únicos de `ip` y `mac`.

## Catálogo de tipos

`ROUTER`, `SWITCH`, `ACCESS_POINT`, `NAS`, `PRINTER`, `TV`, `SPEAKER`, `CAMERA`,
`PHONE`, `LAPTOP`, `DESKTOP`, `TABLET`, `IOT`, `OTHER`.

Etiquetas en UI: Router, Switch, Punto de acceso, NAS, Impresora, TV, Altavoz,
Cámara, Móvil, Portátil, Sobremesa, Tablet, IoT, Otro.

## Validación

| Campo | Regla |
|---|---|
| `name` | Obligatorio, `trim`, 1–80 caracteres |
| `ip` | Obligatoria, `trim`, IPv4 válida, única |
| `mac` | Opcional; acepta `AA:BB:CC:DD:EE:FF`, `AA-BB-...`, `AABB.CCDD.EEFF` o 12 hex; se normaliza; única si existe |
| `type` | Uno del catálogo; por defecto `OTHER` |
| `ownerId` | Opcional; debe existir; `null` = sin asignar |
| `notes` | Opcional, `trim`, máx. 1000; vacío = `null` |
| `online`, `lastSeen` | No aceptados en create/update (se descartan) |

En `PATCH` todos los campos son opcionales; un objeto vacío devuelve 400.
`mac: null` y `notes: null`/`''` limpian el valor.

## API

Todas las rutas requieren sesión. Escritura solo `ADMIN`.

### `GET /api/devices`

- `200` → `{ devices: DeviceWithOwner[] }`
- Orden: `name` ascendente.
- `DeviceWithOwner` incluye `owner: { id, name } | null`.

### `POST /api/devices`

- Body: `{ name, ip, mac?, type?, ownerId?, notes? }`.
- `201` → dispositivo creado con `owner`.
- `400` datos inválidos · `401` sin sesión · `403` no ADMIN ·
  `409` IP o MAC ya registradas.
- `online: false`, `lastSeen: null` siempre.

### `PATCH /api/devices/[id]`

- Body parcial con las mismas reglas.
- `200` → dispositivo actualizado.
- `400` sin cambios o datos inválidos · `401` · `403` · `404` no existe ·
  `409` IP/MAC de **otro** dispositivo.

### `DELETE /api/devices/[id]`

- `204` sin cuerpo · `401` · `403` · `404`.

Los errores devuelven `{ error: string }` en español.

## UI

### Página `/devices`

- Requiere sesión (server-side); redirige a login si no hay.
- Cabecera editorial existente + contador `N dispositivos`.
- Lista responsive:
  - Nombre + tipo (etiqueta).
  - IP y MAC (`—` si no hay).
  - Propietario (`Sin asignar` si no hay).
  - Estado: `En línea` · `Visto hace 5 min` · `Sin datos`.
  - Notas (si existen).
  - Acciones `Editar` / `Eliminar` solo para ADMIN.
- Estado vacío: "Todavía no hay dispositivos."
- Sin overflow horizontal en 390 px.

### Formulario (crear/editar)

- Campos: nombre, IP, MAC, tipo (select), propietario (select de usuarios
  activos + "Sin asignar"), notas (textarea).
- Un solo formulario visible a la vez; cancelar lo cierra.
- Errores de API visibles con `role="alert"`.
- Botón deshabilitado mientras se envía.
- Tras guardar: `router.refresh()` y cierre del formulario.

### Borrado

- Confirmación en dos pasos dentro de la fila ("¿Eliminar? · Sí / No").
- Sin `window.confirm`.

### FAMILY

- Ve el listado completo y el estado.
- No ve botones de alta/edición/borrado.
- Si intenta escribir por API: `403`.

## Tests

- `tests/api/device.schemas.test.ts`:
  - create válido (normaliza MAC y recorta campos).
  - IP inválida, nombre vacío, tipo inválido, notas > 1000.
  - MAC en varios formatos y MAC inválida.
  - `online`/`lastSeen` no aparecen en el resultado.
  - update parcial: no exige campos, rechaza `{}`, limpia MAC/notas.
- `tests/device.test.ts`:
  - `normalizeMac` con `:`, `-`, `.`, minúsculas y basura.
  - `formatDeviceStatus` (en línea, sin datos, ahora, minutos, horas, días,
    fecha antigua).
  - todas las etiquetas de tipo existen.

## Criterios de aceptación

1. Un ADMIN crea, edita y borra dispositivos desde la UI; los cambios persisten
   al recargar.
2. IP duplicada y MAC duplicada devuelven `409`; editar el mismo dispositivo
   conservando su IP/MAC no da conflicto.
3. Un usuario FAMILY ve la lista pero no las acciones; `POST/PATCH/DELETE`
   devuelven `403`.
4. Validaciones: IPv4 inválida, tipo fuera del catálogo, nombre vacío y notas
   largas devuelven `400`.
5. La MAC se guarda normalizada independientemente del formato de entrada.
6. `online`/`lastSeen` no se pueden modificar desde la API.
7. Estado vacío, errores y confirmación de borrado funcionan; móvil 390 px sin
   overflow.
8. La migración de unicidad se aplica en local y en CI sobre base limpia.
9. `npm run lint`, `npm run typecheck`, `npx vitest run` y `npm run build` pasan.
10. Producción tras el merge: health `200`, migración aplicada y `/devices`
    protegida; smoke autenticado si hay credencial disponible.

## Fuera de alcance

- Escaneo nmap, descubrimiento e importación.
- Actualización automática de `online`/`lastSeen`.
- Ping, Wake-on-LAN, control de puertos o domótica.
- Filtros, búsqueda, paginación (el inventario familiar es pequeño).
- Historial de cambios/auditoría.
