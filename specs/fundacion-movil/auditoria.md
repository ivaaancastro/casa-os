# Auditoría de diseño — Fase 1 (fundación móvil)

> Realizada con la skill `design-audit` el 19 nov 2026. Capturas nuevas con
> Chrome MCP en `http://127.0.0.1:3000`, viewport 390×844, sesión real
> (`admin@casa.local`) contra la BD local sembrada. Las capturas se guardaron en
> el directorio temporal de la sesión; este documento las referencia por nombre.

## Alcance y objetivo

- **Flujo auditado**: login → dashboard → Notas → Cuentas → Calendario → Perfil → menú «Más».
- **Objetivo del usuario**: moverse por las cuatro áreas principales con una mano
  y encontrar el resto de secciones sin volver al escritorio.
- **Modo**: combinada (UX + diseño visual + accesibilidad).
- **No verificado**: dispositivos iOS/Android reales, lector de pantalla, teclado
  físico, tema oscuro y estados de error/loading prolongados.

## Veredicto

La navegación de una mano ya funciona y la jerarquía móvil es coherente; lo que
aún falta son microajustes de jerarquía (un prompt de instalación demasiado
dominante y unDashboard con demasiado aire) antes de darla por terminada.

## Pasos del flujo

1. **Login** — `f1-01-login.png` · **bueno**. Sin navegación de app, wordmark
   Bodoni único, formulario limpio, CTA negro ancho. Sin errores en consola.
2. **Dashboard + aviso de instalación** — antes `f1-02-dashboard-v3.png`,
   después `f1-07-dashboard-final.png` · **bueno tras corrección**. El prompt
   pasó de tarjeta dominante a dos líneas de texto y el dashboard ganó módulos
   visibles en el primer pliegue.
3. **Notas** — `f1-03-notas.png` · **bueno**. Estado vacío claro, pestaña activa
   marcada con línea superior de 2 px.
4. **Cuentas** — `f1-04-cuentas-loaded.png` · **bueno**. Explica por qué pide 2FA
   y ofrece un único siguiente paso (`Ir a Perfil → Seguridad`).
5. **Calendario** — `f1-06-calendario-final.png` · **bueno**. Título Jost 21 px,
   controles agrupados y rejilla legible a 390 px.
6. **Perfil** — `f1-perfil.png` · **bueno**. Cabecera compacta con acceso «Más».
7. **Menú «Más»** — `f1-05-drawer.png` · **bueno**. Bottom sheet sobrio con
   Dashboard/Dispositivos/Familia y cierre de sesión.

## Fortalezas

- La tab bar de cuatro pestañas es visible, sobria y consistente en todos los
  pasos; el activo se marca sin color, solo con tinta y una línea (pasos 3–6).
- El wordmark aparece una sola vez por pantalla: login, drawer y, en escritorio,
  el sidebar (pasos 1 y 7).
- Paleta cerrada y sin sombras: blanco/negro/gris, con el rojo reservado a error
  (no aparece en este flujo). Coherente con `specs/rediseno-inditex/spec.md`.
- No hay overflow horizontal en ninguna de las cuatro rutas (verificado además
  con el E2E `no hay overflow horizontal a 390 px`).

## Hallazgos por prioridad

- **[P2 → corregido] El aviso de instalación dominaba la primera pantalla.**
  Capturas: antes `f1-02-dashboard-v3.png`, después `f1-07-dashboard-final.png`.
  Qué se veía: tarjeta con botón negro, wordmark y mucho aire. Por qué importaba:
  el aviso se leía antes que el contenido. Corrección aplicada: dos líneas de
  texto en el flujo, CTA como enlace subrayado, sin wordmark duplicado y sin
  botón secundario.

- **[P2 → corregido] Dashboard con demasiado espacio vertical.**
  Capturas: antes `f1-02-dashboard-v3.png`, después `f1-07-dashboard-final.png`.
  Corrección aplicada: `gap-y-12 → gap-y-8`, `mt-6 → mt-4`, `py-10 → py-6` y
  eyebrow 13 px en `src/app/page.tsx`. Ahora «Notas» entra en el primer pliegue.

- **[P3] El menú «Más» solo está en Perfil.**
  Captura: `f1-perfil.png`. Qué se ve: para llegar a Dispositivos o Familia hay
  que pasar por Perfil. Por qué importa: es aprendible pero no descubridor.
  Corrección: valorar un acceso «Más» en la cabecera del dashboard. No bloquea:
  la spec aprobó cuatro pestañas y Perfil como entrada.

- **[P3] Tamaño de letra de los metadatos de la tab bar.**
  Captura: `f1-notas.png`. Etiquetas a 11 px: legibles en captura, pero conviene
  comprobarlas con zoom 200 %. Corrección: subir a 12 px si falla la prueba.

## Riesgos de accesibilidad

- **Visible en capturas**: foco visible global de 2 px (`:focus-visible` en
  `globals.css`), objetivos táctiles de la tab bar ≥44 px, `aria-current="page"`
  verificado por E2E, `role="dialog"` + `aria-modal` en el drawer y cierre con
  Escape.
- **Requiere prueba específica**: contraste real de `#6B6B6B` sobre `#FFFFFF`
  en textos de 11–13 px (podría quedar justo en AA), orden de lectura del drawer
  con lector de pantalla y comportamiento del foco al cerrarlo (el foco vuelve
  al botón «Más» solo si se gestiona explícitamente). No se afirma cumplimiento
  WCAG completo desde capturas.

## Límites de evidencia

- Capturas en Chromium con viewport 390×844; `innerWidth` real del entorno fue
  500 px, por lo que los media queries `md:` se comprobaron por estilos
  computados, no por captura a 768 px.
- No se probó el prompt de instalación en iOS Safari: el fallback textual quedó
  implementado pero no verificado en dispositivo.
- Las pantallas de bóveda desbloqueada y editor de notas no se capturaron: su
  rediseño corresponde a las Fases 2 y 3.

## Checklist accionable

1. [x] Compactar el install prompt (P2) — verificado en `f1-07-dashboard-final.png`.
2. [x] Reducir espaciado vertical del dashboard (P2) — misma captura.
3. [ ] Verificar contraste de `ash` a 11–13 px y foco al cerrar el drawer con
   teclado (accesibilidad) — requiere prueba específica, no cubierta por capturas.
4. [ ] Decidir en Fase 2 si el acceso «Más» se replica fuera de Perfil (P3).
