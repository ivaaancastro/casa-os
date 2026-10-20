# Cierre — [Nombre de la feature]

> Copia esta plantilla a `specs/<nombre>/cierre.md` al empezar la Fase A.
> Rellénala durante la feature y complétala en la Fase B. Al mergear el PR de
> cierre no puede quedar ninguna casilla pendiente.

**Estado:** borrador
**Fecha:** YYYY-MM-DD
**Feature:** `<nombre>`

## Resumen

[Qué se ha entregado y por qué. Dos o tres frases.]

## Alcance entregado

- [Qué incluye la feature]
- [Qué cambia para el usuario]
- [Qué queda fuera y dónde continúa]

## Cambios principales

| Área | Archivos | Qué cambió |
|---|---|---|
| Datos | `prisma/schema.prisma`, migraciones | [cambios] |
| API | `src/app/api/...` | [cambios] |
| UI | `src/app/...`, `src/components/...` | [cambios] |
| Tests | `tests/...` | [cambios] |
| Docs | `README.md`, `docs/...` | [cambios] |

## Verificación

### Código y tests

| Comando | Resultado |
|---|---|
| `npm run lint` | [OK / incidencias] |
| `npm run typecheck` | [OK / incidencias] |
| `npm run test` | [N tests] |
| `npm run build` | [OK / rutas relevantes] |
| CI del PR | [enlace o identificador] |

### UI / Chrome

- Navegador y viewport:
- Flujos comprobados:
- Consola:
- Responsive / overflow:
- Evidencia visual: [texto; no adjuntar datos privados]

### Producción

| Campo | Valor |
|---|---|
| URL | [https://casa-os-mauve.vercel.app] |
| Deployment | [ID y estado] |
| Commit | [`sha`] |
| Health | [`200` / `503`] |
| Rutas | [códigos observados] |
| Smoke autenticado | [quién y qué comprobó, o "No aplica"] |

## Documentación actualizada

- [ ] `MEMORY.md`: estado, roadmap, registro y foco.
- [ ] `CHANGELOG.md`: entrada de la entrega.
- [ ] `README.md`: características/comandos afectados.
- [ ] `docs/*`: guías afectadas.
- [ ] `spec.md` y `plan.md`: decisiones finales.
- [ ] `tasks.md`: todas las tareas en `[x]` o movidas a follow-ups.
- [ ] `AGENTS.md`: solo si cambian las reglas del arnés (si no, "No aplica").
- [ ] `npm run docs:check -- <nombre>` pasa.

## Tareas

### Completadas

- [Tarea 1]
- [Tarea 2]

### Pendientes / follow-ups

> Usar viñetas normales, no checkboxes. Indicar motivo y dónde continúa.

- [Follow-up 1 — motivo — feature/issue]
- [Ninguno]

## Decisiones y lecciones

- [Decisión técnica o de producto y por qué]
- [Lección que debe recordar el siguiente agente]

## Riesgos residuales

- [Riesgo, impacto y mitigación]
- [Ninguno conocido]

## Checklist de cierre

- [ ] El PR de la feature está mergeado y la rama borrada.
- [ ] El CI de `main` está verde tras el merge de la feature.
- [ ] Producción está desplegada y verificada; el smoke autenticado está
      documentado.
- [ ] `tasks.md` no tiene casillas pendientes.
- [ ] `cierre.md` no tiene casillas pendientes.
- [ ] `MEMORY.md` enlaza este cierre y tiene el registro actualizado.
- [ ] `CHANGELOG.md`, `README.md` y `docs/*` están al día.
- [ ] `npm run docs:check -- <nombre>` pasa.
- [ ] El PR de cierre tiene el CI verde.

> Al terminar, cambia `**Estado:** borrador` por `**Estado:** cerrada`.
