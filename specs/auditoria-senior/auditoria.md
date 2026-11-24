# Auditoría senior — casa-os

**Fecha:** 2026-11-24
**Auditor:** agente (rol auditor senior)
**Rama base:** `develop` (creada desde `main` @ `5a3d1bc`)
**Entorno auditado:** local (`http://localhost:3000`) + código fuente + producción (`https://casa-os-mauve.vercel.app` health 200)
**Viewport principal:** 390×844 (móvil) + escritorio 1440 px
**Herramientas:** Chrome DevTools MCP (snapshots + capturas), Lighthouse, `npm run lint/typecheck/test/build`, `npm audit`

---

## 1. Alcance y objetivo

Se auditó la experiencia completa de casa-os como producto real en uso: autenticación,
dashboard, notas, cuentas (bóveda), calendario, dispositivos, familia, perfil, más
la capa de API/seguridad y la identidad visual actual (estilo editorial Inditex).

Objetivo del usuario: **localizar y gestionar notas, cuentas, eventos y dispositivos
sin fricción, con confianza, desde el móvil**, y plantear el salto visual de
Inditex a Apple.

No se pudo verificar en esta sesión: dispositivo físico (Face ID/huella, safe-area
real), dark mode (no implementado), estados de error de red, ni el flujo completo
de desbloqueo de la bóveda con passkey (requiere 2FA activo; se dejó pendiente).

---

## 2. Veredicto

> casa-os es un producto funcional y bien probado (443 tests, CI verde), con una
> base de seguridad sólida para una app familiar. Lo que bloquea la calidad
> "premium" no es un bug grave, sino **ruido de producto en el dashboard, densidad
> visual en calendario/dispositivos y una identidad Inditex que compite con la
> tarea**. El salto a Apple debe empezar por tokens y espaciado, no por
> animaciones.

---

## 3. Pasos del flujo auditado

| # | Paso | Captura | Salud |
|---|------|---------|-------|
| 1 | Login | `01-login.png` | Bueno — limpio, 2FA opcional claro |
| 2 | Dashboard | `02-dashboard.png` / `09-mobile-dashboard.png` | Con fricción — instrucciones dev expuestas |
| 3 | Notas (lista + editor) | `03-notas.png` / `10-mobile-notas.png` | Bueno — lista-first, FAB claro |
| 4 | Cuentas (bóveda bloqueada) | `04-cuentas.png` | Bueno — estado "activa 2FA primero" claro |
| 5 | Perfil y seguridad | `05-perfil.png` | Con fricción — historial sin límite |
| 6 | Calendario (mes) | `06-calendario.png` / `11-mobile-calendario.png` | Con fricción — rejilla densa en móvil |
| 7 | Dispositivos | `07-devices.png` / `12-mobile-devices.png` | Bueno — tarjetas claras, estado desactualizado |
| 8 | Familia | `08-familia.png` | Bueno — roles visibles |

---

## 4. Fortalezas (conservar)

- **Autenticación y sesión**: NextAuth JWT + `sessionVersion` en BD, rate limit por
  email/usuario, 2FA TOTP con recuperación, reset por admin. Bien testeado.
- **Bóveda zero-knowledge**: cifrado en cliente, servidor solo ciphertext; grant
  ligado a sesión y `sessionVersion`; auto-bloqueo 15 min.
- **Mobile-first real**: un solo árbol por breakpoint (`useIsMobile`), FABs
  portalados, objetivos ≥ 44 px, safe-area.
- **Accesibilidad base**: Lighthouse 98 en dashboard móvil; foco visible negro 2 px;
  `prefers-reduced-motion` respetado.
- **Calidad de ingeniería**: lint y typecheck limpios, 443 tests, build OK.

---

## 5. Hallazgos por prioridad

### P0 (bloquea uso o accesibilidad grave)

_Ninguno detectado en esta pasada._ El producto es usable de extremo a extremo.

### P1 (regresión o desajuste notable)

1. **Dashboard expone instrucciones de desarrollo en producción**
   - Captura: `02-dashboard.png` / `09-mobile-dashboard.png`
   - Qué se ve: bloque "Primeros pasos" con `Configura .env…`, `docker compose up…`,
     `npm run dev`.
   - Por qué importa: ruido, sensación de producto inacabado, y fuga de detalles
     de infraestructura a usuarios finales.
   - Corrección: mover a `docs/` o a un modo "setup" solo en desarrollo; en
     producción mostrar onboarding útil (crear nota, añadir dispositivo).

2. **Encabezados saltan nivel (h1 → h3) en el dashboard**
   - Captura: `09-mobile-dashboard.png`
   - Evidencia: Lighthouse `heading-order` fallido (`section > h3` "Dashboard").
   - Corrección: usar h2 para títulos de tarjeta o ajustar jerarquía semántica.

3. **Historial de seguridad en Perfil sin límite/paginación**
   - Captura: `05-perfil.png`
   - Qué se ve: 12+ filas idénticas "Inicio de sesión correcto" en una sola vista.
   - Por qué importa: ruido, scroll largo, sin valor añadido.
   - Corrección: mostrar últimas 5 + "Ver más", o agrupar por día.

4. **Vulnerabilidades de dependencias (npm audit)**
   - `zod < 4.6.6` (DoS por validación de colecciones grandes), `postcss`
     (XSS/lectura de archivos), `tinypool` (RCE por prototype pollution).
   - Corrección: actualizar a versiones parcheadas cuando se pueda asumir el
     breaking change; mientras, no exponer entrada no confiable a Zod sin límites
     (ya hay `.max()` en la mayoría de schemas, pero revisar).

### P2 (pulimiento / responsive)

5. **Rejilla del calendario móvil densa (390 px)**
   - Captura: `11-mobile-calendario.png`
   - Celdas de 1–2 dígitos con chips truncados; follow-up ya registrado en
     `specs/calendario-movil`.
   - Corrección: aumentar altura mínima de celda, truncar a 1 chip + "+N".

6. **Wordmark repetido**
   - Sidebar ("casa·os") + dashboard ("casa-os — hogar digital") + login ("casa·os").
   - La spec Inditex pide una sola firma por pantalla. En móvil el sidebar
     desaparece, pero en escritorio se repite.
   - Corrección: wordmark solo en sidebar (escritorio) y en login; en contenido,
     usar título de sección.

7. **Banner de instalación PWA en cada carga**
   - Captura: `09/10/11/12-mobile-*.png`
   - Aparece como región "Instalar casa-os" en todas las vistas móviles.
   - Corrección: mostrar una sola vez por sesión o solo en dashboard; respetar
     "Ahora no" de forma persistente.

8. **Sanitización de notas solo en cliente**
   - `src/lib/utils/sanitize.ts`: `sanitizeHtml` devuelve `''` en servidor; la
     limpieza ocurre en el navegador antes de persistir.
   - Riesgo: un cliente modificado puede guardar HTML no saneado; al renderizar
     con TipTap puede ejecutar estilos/markup no deseados.
   - Corrección: añadir sanitización server-side (p. ej. `sanitize-html`) o
     validar/limitar en el schema de notas.

9. **API de eventos es "todo o nada"**
   - `PATCH /api/events/[id]` sobrescribe `description`, `ownerId`, `allDay`,
     `reminderMinutes` con valores por defecto si no se envían (porque
     `updateEventSchema === eventInputSchema`).
   - Corrección: crear `patchEventSchema` parcial o documentar que el cliente
     siempre envía el evento completo (ya lo hace el formulario).

10. **Exposición de lista de usuarios a cualquier autenticado**
    - `GET /api/users` usa `requireUser`, no `requireAdmin`.
    - En una app familiar puede ser aceptable (selector de responsables), pero
      conviene documentar o restringir a admins.

### P3 (refine / higiene)

11. **Archivo basura en el repo**: `specs/cuentas-movil/cierre 2.md` (duplicado
    del cierre, sin trackear). Eliminar.
12. **Metadatos de dispositivos**: "Última actualización: hace 4 días · Estado
    desactualizado" es útil pero el tono de alarma puede ser excesivo para un
    hogar; valorar copy más neutro.
13. **Dashboard con tarjetas "En desarrollo"**: la tarjeta "Dashboard" dice
    "En desarrollo" aunque ya existe. Actualizar etiqueta o quitar.
14. **Inconsistencia de estilo**: mezcla de `casa·os` (punto medio) y `casa-os`
    (guion) en títulos (`"Casa · Calendario"`, `"Casa · Dispositivos"`).

---

## 6. Riesgos de accesibilidad

Verificados en captura + Lighthouse (dashboard móvil: 98/100, único fallo
`heading-order`). Requiere prueba manual para confirmar:

- **Teclado/foco**: el foco negro de 2 px existe, pero no se probó navegación
  completa por teclado en calendario (celdas) ni en el editor TipTap.
- **Lector de pantalla**: no se verificó anuncio de cambios de estado
  (guardado de nota, desbloqueo de bóveda).
- **Contraste**: paleta Ink/Ash sobre Canvas cumple AA; no se midió AAA en Ash
  (#6B6B6B sobre #FFF ≈ 5.0:1, roza AA).
- **Zoom/reflow**: no se probó al 200 %; el calendario mensual probablemente
  se rompe antes que las listas.
- **Objetivos táctiles**: ≥ 44 px en móvil (verificado por CSS); en escritorio
  algunos botones de calendario son 40 px (`date-nav`), aceptable con ratón.

---

## 7. Límites de evidencia

- No se capturó el flujo de desbloqueo de la bóveda con passkey (requiere 2FA
  activo + dispositivo con biometría).
- No se verificó dark mode (no implementado).
- No se probó en dispositivo físico (safe-area real, Face ID, vibración).
- No se ejecutaron los E2E de Playwright en esta sesión (conflicto de puerto
  por `next build` sobre `.next`; se reinició el dev server).
- `npm audit` refleja el árbol de dependencias actual; las vulnerabilidades
  críticas son de tooling (vitest/tinypool), no del runtime de producción.

---

## 8. Checklist accionable (orden de ejecución)

1. Eliminar `specs/cuentas-movil/cierre 2.md` y commitear higiene.
2. Corregir jerarquía de headings en dashboard (P1-2).
3. Reemplazar "Primeros pasos" dev por onboarding real o mover a docs (P1-1).
4. Limitar historial de seguridad a 5 filas + "ver más" (P1-3).
5. Actualizar etiqueta "En desarrollo" de la tarjeta Dashboard (P3-13).
6. Unificar wordmark (P2-6) y copy de secciones (P3-14).
7. Hacer persistente "Ahora no" del banner PWA (P2-7).
8. Añadir sanitización server-side de notas o validar en schema (P2-8).
9. Evaluar actualización de `zod`/`postcss` con PR dedicado (P1-4).
10. Solo después: iniciar `feat/rediseno-apple` (ver spec adjunta).

---

## 9. Cambio de diseño propuesto: Inditex → Apple

### 9.1 Motivación

El estilo actual (Inditex/Zara) es editorial: Bodoni Moda + Jost, radios 0,
sin sombras, paleta blanco/negro/gris, bordes finos. Funciona como "revista",
pero para un gestor del hogar usado a diario en móvil resulta **frío y denso**:
mucho borde, poco affordance, sensación de catálogo.

El estilo Apple (HIG) prioriza: **claridad, deferencia y profundidad** — el
contenido es el héroe, la UI se retira; esquinas redondeadas continuas, materiales
translúcidos, sombras sutiles, tipografía del sistema (SF Pro), espaciado generoso,
animaciones que responden a gestos, dark mode nativo.

### 9.2 Referencias (Awwwards / Apple HIG)

- Awwwards — secciones UI design, Minimal, Typography, Mobile & Apps, Luxury
  (ver `specs/rediseno-inditex/referencias-premium.md`).
- Apple Human Interface Guidelines: SF Pro, continuous corners, materials,
  dynamic type, dark mode, safe areas, haptics.
- Patrones trasladables: píldora flotante de navegación, una sola señal de
  color, metadatos pequeños espaciados, detalles que se notan al segundo uso.

### 9.3 Mapa de tokens: Inditex → Apple

| Token | Inditex actual | Apple propuesto |
|-------|----------------|-----------------|
| Fuente display | Bodoni Moda (serif) | SF Pro Display / system-ui (sans) |
| Fuente UI | Jost | SF Pro Text / system-ui |
| Radio | 0 (2 px foco) | 12–16 px (continuous) |
| Sombras | ninguna | `0 1px 3px rgba(0,0,0,.08)`, `0 8px 24px rgba(0,0,0,.12)` |
| Bordes | 1 px Mist (#E4E4E4) | separadores hairline 0.5 px o ninguno; divisores por espacio |
| Superficie | Canvas #FFF | System Background #F2F2F7 (light) / #000 (dark) |
| Superficie elevada | Pearl #F5F5F5 | Secondary System Background #FFFFFF con sombra |
| Acento | Ink #0A0A0A (CTA negro) | iOS Blue #007AFF (solo acción primaria) |
| Error | #8E2222 | iOS Red #FF3B30 |
| Éxito | (sin token) | iOS Green #34C759 |
| Espaciado base | 8 px | 8 px (mantener) |
| Contenedor | max 1440 px | max 1200 px, márgenes 20/24 px |
| Animación | fade-rise 0.6 s | spring 0.3–0.4 s, respuesta a gesto |
| Dark mode | no preparado | tokens semánticos + `prefers-color-scheme` |

### 9.4 Decisiones de diseño (Apple)

1. **Tipografía**: abandonar Bodoni Moda como firma; el wordmark "casa-os" pasa a
   SF Pro Display semibold con tracking negativo leve. Un único elemento memorable:
   el contenido, no la marca.
2. **Superficies**: tarjetas con radio 14 px y sombra suave; listas tipo iOS
   (separadores hairline, sin contenedor), agrupadas en secciones con título
   pequeño en mayúsculas (estilo iOS Settings) — aquí sí se permite uppercase
   porque es convención del sistema, no decoración.
3. **Navegación**: tab bar inferior translúcida (material) con iconos SF Symbols
   y etiqueta; en escritorio, sidebar con blur y separador fino.
4. **Color**: un acento por pantalla (azul iOS para la acción primaria); rojo
   solo para destructivo/error; verde para éxito/online. Eliminar el negro como
   CTA principal.
5. **Formularios**: inputs con radio 10 px, fondo gris claro (#F2F2F7), sin borde
   visible; foco con anillo azul. Botones primarios azules con radio 12 px.
6. **Calendario**: celdas más altas, chips con radio 6 px y color por categoría
   suave; selección con fondo azul claro.
7. **Dark mode**: preparar tokens semánticos desde el inicio; entregar claro en
   Fase 1, oscuro en Fase 2.
8. **Movimiento**: transiciones spring cortas (0.25–0.35 s), feedback háptico
   en móvil (cuando esté disponible), respetar `prefers-reduced-motion`.

### 9.5 Fuera de alcance de este rediseño

- No cambiar modelo de datos ni APIs.
- No añadir secciones funcionales.
- No reescribir el motor de la bóveda ni el editor TipTap (solo tokens/CSS).
- Mantener tests existentes; actualizar snapshots visuales si aplica.

### 9.6 Plan de ejecución (propuesto)

- Fase A — Tokens y tipografía (tailwind + globals.css) + dark mode prep.
- Fase B — Componentes base (btn, input, card, tab bar, sidebar).
- Fase C — Pantallas: login, dashboard, notas, calendario, dispositivos, cuentas,
  perfil, familia.
- Fase D — QA visual (Chrome MCP) + E2E + cierre documental.

> **Requiere aprobación del usuario** antes de crear `tasks.md` e implementar
> (protocolo SDD).

---

## 10. Conclusión

casa-os no tiene bugs bloqueantes; su deuda principal es de **producto y
presentación**. La migración Inditex → Apple es viable y debe hacerse por
tokens primero, pantallas después, sin tocar lógica. Se propone abrir
`feat/rediseno-apple` tras cerrar los P1 de este informe.
