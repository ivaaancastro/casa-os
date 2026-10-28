# Cierre de feature

> Protocolo obligatorio para dejar cada entrega documentada, verificada y
> registrada. Se ejecuta **después** del merge de la feature y de borrar su
> rama, y **antes** de abrir la siguiente. La regla completa está en
> [`AGENTS.md`](../AGENTS.md) (Paso 8 y DoD) y el estado vivo en
> [`MEMORY.md`](../MEMORY.md).

## Principio

El merge del código no cierra una feature. Una feature está terminada cuando:

1. El PR de código está mergeado (squash) y su rama borrada.
2. El CI de `main` está verde.
3. Producción está desplegada y verificada (pública y autenticada si aplica).
4. El PR de cierre documental está mergeado y su CI de `main` está verde.

Si algo falla, la feature queda **bloqueada**: no se marca como Hecho, se
registra el fallo y se abre un `fix/*` antes de continuar.

## Dos fases

### Fase A — en el PR de la feature

Se actualiza todo lo que no depende del merge:

- [ ] `specs/<nombre>/tasks.md` con checkboxes; marcar lo verificado.
- [ ] Borrador de `specs/<nombre>/cierre.md` con resumen, alcance, cambios y
      verificación local/UI. Producción queda como *pendiente*.
- [ ] `CHANGELOG.md` con la entrada (`Added`, `Changed` o `Fixed`).
- [ ] `README.md` si cambian características, comandos o estado.
- [ ] `docs/*` si cambian arquitectura, despliegue, PWA o guías.
- [ ] `MEMORY.md`: estado "en producción, pendiente de cierre", roadmap, notas
      técnicas y lecciones. **No marcar Hecho todavía.**
- [ ] `spec.md` si cambian criterios o decisiones.
- [ ] Verificación de código, UI y CI del PR.

### Fase B — PR `docs/cierre-<nombre>`

Se crea desde `main` actualizado, después del merge de la feature:

- [ ] Verificar el deployment de producción: *Ready · Current*, URL, commit,
      health, cabeceras, rutas protegidas y smoke autenticado.
- [ ] Completar `specs/<nombre>/cierre.md` con PR, commit, deployment, URL,
      evidencia y follow-ups. **Sin casillas pendientes.**
- [ ] `MEMORY.md`: marcar Hecho, añadir fila al *Registro de features*,
      actualizar foco actual, fecha y lecciones.
- [ ] `CHANGELOG.md`, `README.md` y `docs/*`: corregir lo que falte.
- [ ] Ejecutar `npm run docs:check -- <nombre>`.
- [ ] PR de cierre → CI verde → squash merge → borrar rama.
- [ ] Verificar CI de `main`. Solo ahora se abre la siguiente feature.

El merge del PR de cierre es el último acto; no se puede incluir su propio
merge en el checklist de `cierre.md`. Se verifica en GitHub y se reporta al
usuario. El PR queda como registro público.

### Cancelación — cuando la feature no se entrega

Una feature puede cerrarse como **cancelada** si se descarta antes de completar
su alcance (decisión de producto, cambio de enfoque, prototipo no válido). No es
una vía para maquillar una feature a medias:

- [ ] `cierre.md` con `**Estado:** cancelada`, el motivo y qué se descartó.
- [ ] `tasks.md`: las tareas no ejecutadas se enumeran como canceladas, **sin
      checkboxes**; las de limpieza/corrección sí se marcan `[x]`.
- [ ] `plan.md` y `spec.md` con un aviso de cancelación al principio; no se
      presentan como implementados.
- [ ] Retirar cualquier resto en la app (enlaces, rutas, flags) que prometa la
      funcionalidad cancelada.
- [ ] `MEMORY.md` y `CHANGELOG.md` registran la cancelación y qué la sustituye.
- [ ] `npm run docs:check -- <nombre>` acepta `Estado: cancelada`.

`docs:check` solo valida estructura: un cierre cancelado sigue obligando a
contrastar con `git ls-files` que no se citan archivos inexistentes.

## Qué actualizar

| Archivo | Qué debe reflejar | Fase |
|---|---|---|
| `specs/<nombre>/plan.md` | Contexto y enfoque reales (sin cambios tardíos) | A |
| `specs/<nombre>/spec.md` | Requisitos, criterios y decisiones finales | A |
| `specs/<nombre>/tasks.md` | Todas las tareas en `[x]` o movidas a follow-ups | A/B |
| `specs/<nombre>/cierre.md` | Registro final con evidencia y enlaces | A/B |
| `MEMORY.md` | Estado, roadmap, registro, foco, notas y lecciones | A/B |
| `CHANGELOG.md` | Entrada de la entrega | A/B |
| `README.md` | Características, estado, comandos y enlaces | A/B |
| `docs/*` | Guías afectadas (deploy, PWA, arquitectura…) | A/B |
| `AGENTS.md` | Solo si cambian las reglas del arnés | A/B |
| `docs/roadmap.md` | Índice; no duplicar el roadmap vivo | B |

## Evidencia mínima

En `cierre.md` no vale "funciona": hay que dejar qué se comprobó y cómo.

### Código y tests

- Comandos ejecutados: `npm run lint`, `npm run typecheck`, `npm run test`,
  `npm run build`.
- Resultado: número de tests, avisos relevantes y cualquier exclusión.
- CI del PR y CI de `main` (enlaces o identificadores).

### UI

- Navegador y viewport (por ejemplo, Chrome + 390 px).
- Flujos comprobados (CRUD, permisos, errores, estado vacío).
- Consola limpia y ausencia de overflow horizontal, si aplica.

### Producción

| Campo | Ejemplo |
|---|---|
| URL | `https://casa-os-mauve.vercel.app` |
| Deployment | ID de Vercel y estado *Ready · Current* |
| Commit | SHA desplegado |
| Health | `GET /api/health` → `200` (`db: ok`) |
| Rutas | Públicas/protegidas y códigos observados |
| Smoke autenticado | Quién lo hizo y qué comprobó; si no hay credencial, decirlo |

Si el agente no puede autenticarse, **no lo presenta como verificado**: deja
constancia de que lo comprobó el usuario y de qué vio. Eso es evidencia válida;
inventarla no lo es.

## Tareas completadas y pendientes

- `tasks.md` es la lista de ejecución. Al cerrar, todas las casillas deben estar
  en `[x]`.
- Lo que no se haya hecho no se borra: se mueve a `cierre.md` →
  *Pendientes / follow-ups*, con el motivo y la feature/issue que lo recoge.
- Los follow-ups usan viñetas normales, **no checkboxes**, para que la
  comprobación automática no los confunda con tareas pendientes.
- Si un follow-up es un bug, se abre un `fix/*`; si es alcance nuevo, entra en
  el roadmap de `MEMORY.md`.

## Seguridad

- Nunca escribir contraseñas, tokens, cadenas de conexión ni secretos en
  `MEMORY.md`, `CHANGELOG.md`, specs, cierre, README o commits.
- Las contraseñas solo se guardan en un gestor de contraseñas. La app guarda
  hashes bcrypt y no permite recuperar la original.
- En la evidencia se puede indicar "credencial en gestor del usuario" o
  "smoke autenticado por Iván", sin el valor.

## Comprobación automática

```bash
npm run docs:check -- <nombre>
```

El script comprueba:

1. Que existen `specs/<nombre>/plan.md`, `spec.md`, `tasks.md` y `cierre.md`.
2. Que `tasks.md` no tiene casillas `- [ ]`.
3. Que `cierre.md` no tiene casillas pendientes y contiene las secciones
   `Verificación`, `Documentación actualizada`, `Tareas`, `Producción` y
   `Checklist de cierre`.
4. Que `cierre.md` está marcado como `Estado: cerrada` o `Estado: cancelada`.
5. Que `MEMORY.md` enlaza `specs/<nombre>/cierre.md`.

No sustituye a la revisión humana ni a la verificación de producción; solo
evita olvidos mecánicos. Si falla, corrige y vuelve a ejecutarlo.

## Plantilla

Copia [`specs/_template/cierre.md`](../specs/_template/cierre.md) a
`specs/<nombre>/cierre.md` al empezar la Fase A. Rellénala durante la feature y
complétala en la Fase B.

## Errores comunes

- Marcar "Hecho" en `MEMORY.md` antes de verificar producción.
- Dejar casillas en `cierre.md` o `tasks.md` y mergear igualmente.
- Duplicar el roadmap en `docs/roadmap.md` y `MEMORY.md` (se desincronizan).
- Verificar en local y llamarlo "producción".
- Pedir al usuario que compruebe lo que el agente podría haber comprobado.
- Documentar una contraseña "temporal" en el repo.
- Cerrar como Hecho una feature cuyo código nunca existió o que no se desplegó.
  Si se descarta, se cierra como **cancelada** y se retira lo que la anunciaba.
