# Verificación en móvil real (iOS + Android)

> **Estado: PENDIENTE.** Esta guía la dejó preparada el agente el 2026-11-20,
> pero **no la ha ejecutado**: no hay dispositivos iOS/Android, ni permisos de
> notificación reales, ni credenciales de producción en su entorno. Completarla
> con dispositivos propios es el último paso del roadmap. Emular 390×844 en
> Chromium (Fases 1-5) **no sustituye** a Safari ni a Chrome móviles.
>
> No marques una casilla como verificada sin evidencia (captura, vídeo o nota
> con fecha y dispositivo). Lo que no se pueda comprobar se deja en blanco y se
> registra como limitación, no como éxito.

## Cómo usarla

1. Instala la PWA desde «Añadir a pantalla de inicio» en un iPhone (iOS 16.4 o
   superior, Safari) y en un Android (Chrome). Ábrela **desde el icono**, no
   desde el navegador.
2. Para cada fila, escribe `✅`, `❌` o `—` (no probado) en **Resultado** y añade
   un nombre de captura o una nota breve en **Evidencia**.
3. Si algo falla, abre un `fix/*` con el detalle; no lo documentes como
   «verificado con aviso».

**Dispositivos**

| Dispositivo | Sistema | Fecha | Probado por |
|---|---|---|---|
| iPhone | iOS ___ | ___ | ___ |
| Android | Android ___ | ___ | ___ |

## Pestaña Notas

| Gestos | Resultado esperado | iOS | Android | Evidencia |
|---|---|---|---|---|
| Abrir Notas | Se ve la **lista** (título, preview, fecha), no el editor vacío |  |  |  |
| Escribir en «Buscar notas» | Filtra sin recargar ni petición por tecla |  |  |  |
| Cambiar chips de carpeta | Contadores correctos y filtro inmediato |  |  |  |
| Pulsar el FAB «+» | Abre el editor con el foco en la primera línea |  |  |  |
| «Volver a Notas» | Conserva búsqueda, filtro y posición de scroll |  |  |  |
| Marcar una casilla de la checklist | Se tacha, guarda y el objetivo se siente cómodo |  |  |  |
| Toolbar «Más formato» | Cabe en una fila y despliega el resto sin tapar el texto |  |  |  |

## Pestaña Cuentas

| Gestos | Resultado esperado | iOS | Android | Evidencia |
|---|---|---|---|---|
| Entrar en Cuentas | Auto-intento de Face ID / huella |  |  |  |
| Fallar/cancelar la biometría | Se ofrece master password con 2FA |  |  |  |
| Cambiar a Notas y volver | La bóveda sigue abierta (no pide clave otra vez) |  |  |  |
| Enviar la app a segundo plano y volver | Pide desbloqueo |  |  |  |
| Esperar 15 min inactivo | Pide desbloqueo |  |  |  |
| Buscar una cuenta | Resultados inmediatos sobre datos descifrados |  |  |  |

## Pestaña Calendario

| Gestos | Resultado esperado | iOS | Android | Evidencia |
|---|---|---|---|---|
| Abrir Calendario | Rejilla de mes con chips táctiles y FAB visible |  |  |  |
| Tocar un día con eventos | Se abre la agenda con chips grandes |  |  |  |
| Cambiar a Semana | Siete tarjetas con botón «+» cómodo |  |  |  |
| Crear un evento con el FAB | La hoja inferior deja ver campos y acciones con teclado abierto |  |  |  |
| Abrir «Avisos» | Panel con safe-area y botones grandes |  |  |  |
| Crear evento con recordatorio y esperar el aviso | Llega **notificación real** con la app cerrada; al tocarla abre `?date=` |  |  |  |
| Abrir un aviso desde el panel | Selecciona el día correcto |  |  |  |

## Pestaña Dispositivos (menú «Más»)

| Gestos | Resultado esperado | iOS | Android | Evidencia |
|---|---|---|---|---|
| Entrar en Dispositivos | Lista de tarjetas legible, sin scroll horizontal |  |  |  |
| Pulsar el FAB «+» | Hoja con «Añadir dispositivo» e «Importar escaneo» |  |  |  |
| Dar de alta y editar | Hoja inferior visible con teclado; guarda y aparece en la lista |  |  |  |
| Borrar en dos pasos | Confirmación «¿Eliminar? · Sí / No» sin diálogo del navegador |  |  |  |
| «Copiar comando» | Se copia el comando `nmap` y se anuncia «Comando copiado» |  |  |  |
| Importar `scan-latest.json` | El picker del móvil permite elegir el archivo recibido por Drive/AirDrop/correo; preview y aplicación funcionan |  |  |  |
| Entrar con un usuario FAMILY | Solo lectura, sin FAB ni acciones |  |  |  |

## Pestaña Perfil / menú «Más»

| Gestos | Resultado esperado | iOS | Android | Evidencia |
|---|---|---|---|---|
| Abrir el drawer «Más» | Dashboard, Dispositivos y Familia accesibles; cierre de sesión visible |  |  |  |
| Cerrar el drawer | El foco vuelve al botón «Más» |  |  |  |
| Ver 2FA y seguridad | Estados coherentes con la cuenta |  |  |  |
| Instalar la PWA | Aviso/iOS: instrucciones de «Añadir a pantalla de inicio» |  |  |  |

## Transversal

| Comprobación | Resultado esperado | iOS | Android | Evidencia |
|---|---|---|---|---|
| Tab bar inferior | Sin solapamiento con la zona segura ni el teclado |  |  |  |
| Rotación de pantalla | Sin desbordamiento horizontal |  |  |  |
| Teclado virtual | No tapa las acciones pegajosas de las hojas |  |  |  |
| Lector de pantalla (VoiceOver / TalkBack) | Orden de lectura de los paneles portaled y anuncios de estado |  |  |  |
| Navegación solo con teclado | Foco visible y Escape cierra las hojas |  |  |  |
| Contraste de textos `ash` a 10-13 px | Legible en pantalla real con brillo alto |  |  |  |
| Zoom del sistema | La interfaz refluye sin perder acciones |  |  |  |

## Follow-ups acumulados que aquí se comprueban

- **Fase 1**: contraste de `ash` y foco al cerrar el drawer «Más».
- **Fase 2**: Face ID / huella real y bloqueo por background.
- **Fase 3**: jerarquía del título en notas nuevas, teclado virtual y lector.
- **Fase 4**: notificación push real al SO; teclado/lector en el calendario.
- **Fase 5**: picker de archivos `.json` en iOS/Android; espaciado de la
  cabecera de Dispositivos y preview largo de importación.
- **Global**: `next/font/google` falló una vez en CI; si vuelve, valorar fuentes
  autoalojadas.

## Cierre de la verificación

| Campo | Valor |
|---|---|
| Completada por | ___ |
| Fecha | ___ |
| Dispositivos usados | ___ |
| Hallazgos abiertos (con `fix/*` si aplica) | ___ |
| Conclusión | ___ |
