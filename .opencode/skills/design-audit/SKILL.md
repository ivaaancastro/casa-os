---
name: Auditoría de diseño senior
description: Auditar, revisar o criticar el producto en español como diseñador senior: captura pantallas reales del flujo con Chrome MCP, las guarda, las inspecciona y devuelve hallazgos de UX, diseño visual y accesibilidad ligados a cada paso. Usar cuando el usuario pida auditar, revisar, evaluar o dar feedback de una pantalla, flujo o experiencia completa de casa-os. No confundir con design-qa (comparación píxel a píxel contra un mock).
metadata:
  opencode/autoinvoke: true
---

# Auditoría de diseño senior

Audita una pantalla, flujo o experiencia completa de casa-os como lo haría un
design lead: con evidencia capturada en la sesión actual, no con opiniones sueltas
ni con recuerdos de sesiones anteriores.

## Reglas de oro

1. **Evidencia nueva o no hay auditoría.** Captura con el navegador en esta sesión.
   No reutilices capturas antiguas, chats previos ni artefactos en caché salvo que
   el usuario los aporte explícitamente como material de la auditoría.
2. **Captura → inspecciona → guarda → escribe.** Para cada paso: espera a que la
   pantalla esté estable, comprueba que no hay loading/login wall/error a medias,
   captura, abre el archivo guardado y **recházalo** si está en blanco, recortado
   o muestra el estado equivocado. Solo entonces escribes los hallazgos.
3. **Nada de "cumplimiento WCAG completo" desde capturas.** Di qué se ve y qué
   habría que probar con teclado/lector de pantalla.
4. **Un resultado, no dos.** Entrega un informe en español, directo, con capturas
   en línea en orden de flujo y hallazgos numerados ligados a su captura.
5. **No modifiques código durante la auditoría.** Tu salida es el informe.

## Preparación

1. Identifica el producto (casa-os), el flujo o pantalla y la herramienta de
   captura (Chrome MCP: `chrome-devtools`).
2. Carga el contexto de diseño del repo si aplica:
   - `specs/rediseno-inditex/spec.md` (tokens editoriales ya aprobados)
   - `specs/rediseno-inditex/referencias-premium.md` (referencias Awwwards)
   - `MEMORY.md` → preferencias del usuario y roadmap
   - `tailwind.config.ts` y `src/app/globals.css` (tokens reales)
3. Decide el alcance: `auditoría UX`, `auditoría de accesibilidad` o `combinada`
   (por defecto, combinada). Si es una sola pantalla, acota a esa superficie.
4. Elige el objetivo del usuario y la ruta (p. ej. «desbloquear la bóveda y
   encontrar una cuenta»). Sin objetivo no hay auditoría útil.
5. Guarda las capturas en una carpeta temporal de la sesión (no en el repo):
   usa el prefijo del directorio temporal del entorno. Nombres numerados:
   `01-inicio.png`, `02-formulario.png`, `03-confirmacion.png`.

## Captura con Chrome MCP

- Usa la pestaña actual si ya muestra el objetivo; si no, navega a la URL.
- Antes de cada clic/escritura, toma un snapshot y apunta un control concreto.
- Después de cada acción, toma la comprobación más barata que demuestre el
  cambio: snapshot para estructura, captura para estado visual.
- Móvil: redimensiona a 390×844 y comprueba que no hay overflow horizontal.
- Para revisar estilos: `get_css_styles` con el uid del snapshot es la fuente
  autoritativa (reglas activas y sobrecargadas, custom properties).
- No fuerces una auditoría si el flujo no se puede completar: registra el bloqueo
  y para. Nunca presentes una investigación indirecta como auditoría.

## Framework de hallazgos

### Lentes UX

- Entrada a la tarea y descubribilidad
- Arquitectura de información y jerarquía
- Fricción del flujo y claridad del siguiente paso
- Confianza y tranquilidad (especialmente en Cuentas/2FA)
- Estados vacíos, por defecto y de error
- Copy y llamadas a la acción
- Coherencia entre pantallas

### Lentes de diseño visual

- Wordmark único y jerarquía tipográfica (Bodoni Moda + Jost)
- Paleta cerrada: Canvas/Ink/Ash/Mist/Pearl; rojo `#8E2222` solo para error
- Un acento de color como máximo por pantalla
- Grid, ritmo vertical, alineación, radios 0, sin sombras
- Objetivos táctiles ≥44 px y zona segura inferior en móvil
- Movimiento solo en respuesta a una acción; `prefers-reduced-motion`

### Lentes de accesibilidad

- Contraste y percepciones; estructura semántica y orden de lectura
- Teclado y foco visible; tamaño de objetivo y affordances
- Etiquetas, instrucciones y recuperación de errores
- Movimiento, timing y anuncios de cambio de estado
- Reflow/zoom y claridad para tecnología de asistencia

## Salida

Informe en español con esta estructura:

1. **Alcance y objetivo** — qué se auditó, viewport, qué no se pudo verificar.
2. **Veredicto** — una frase: qué funciona y qué bloquea.
3. **Pasos del flujo** — para cada uno: número, captura en línea, descripción
   corta y salud del paso (bueno / con fricción / bloqueado).
4. **Fortalezas** — qué merece conservarse, ligado a una captura.
5. **Hallazgos por prioridad** — `P0` bloquea el uso o accesibilidad grave;
   `P1` regresión o desajuste notable; `P2` pulimiento/responsive; `P3` refine.
   Cada hallazgo incluye: captura/paso, qué se ve, por qué importa y corrección
   concreta (token, componente o CSS cuando se conozca).
6. **Riesgos de accesibilidad** — separa lo visible en captura de lo que requiere
   prueba con teclado/lectores.
7. **Límites de evidencia** — qué no se pudo comprobar (estados, dispositivos,
   dark mode, etc.).
8. **Checklist accionable** — órdenes de ejecución, no consejos genéricos.

Al final, pregunta una sola vez si quiere el informe en un tablero de Figma.
Si el usuario pidió guardarlo en el repo, usa `specs/<feature>/auditoria.md`
y no lo mezcles con el `cierre.md`.

## Guardarrailles

- Los hallazgos van siempre unidos a una captura o paso; nunca sueltos.
- No inventes estados que no capturaste: si no había error, no lo critiques.
- Separa problemas estructurales de pulimiento estético.
- Contrasta con `specs/rediseno-inditex/spec.md` antes de proponer cambios de
  tokens: lo que ya está aprobado no se re-abre en una auditoría.
- No declares una feature terminada ni marques casillas de `tasks.md`: eso es
  trabajo del agente que implementa, no del auditor.
