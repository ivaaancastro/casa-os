/**
 * Página de sin conexión.
 *
 * Es un Route Handler (no una página del App Router) a propósito: así el HTML
 * es autocontenido (CSS inline, sin JS, sin fuentes ni chunks de Next.js) y se
 * puede precachear en el service worker. Si dependiera del layout raíz, sin red
 * se quedaría sin estilos y mostraría la navegación de la app.
 *
 * Es pública: no contiene datos y el middleware la excluye.
 */

export const dynamic = 'force-static';

const html = `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#FFFFFF" />
    <meta name="robots" content="noindex" />
    <title>Sin conexión · casa·os</title>
    <style>
      :root {
        color-scheme: light;
        --canvas: #ffffff;
        --ink: #0a0a0a;
        --ash: #6b6b6b;
        --mist: #e4e4e4;
      }

      * {
        box-sizing: border-box;
      }

      html,
      body {
        margin: 0;
        min-height: 100%;
        background: var(--canvas);
        color: var(--ink);
      }

      body {
        min-height: 100dvh;
        display: flex;
        flex-direction: column;
        padding: 32px 24px;
        font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
        -webkit-font-smoothing: antialiased;
      }

      .brand {
        margin: 0;
        font-family: Georgia, "Times New Roman", serif;
        font-size: 24px;
        letter-spacing: -0.015em;
      }

      .brand span {
        color: var(--ash);
      }

      main {
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: center;
        max-width: 560px;
        width: 100%;
        margin: 0 auto;
        padding: 48px 0;
      }

      .eyebrow {
        margin: 0 0 16px;
        padding-top: 16px;
        border-top: 1px solid var(--mist);
        color: var(--ash);
        font-size: 11px;
        letter-spacing: 0.14em;
        text-transform: uppercase;
      }

      h1 {
        margin: 0 0 20px;
        font-family: Georgia, "Times New Roman", serif;
        font-size: clamp(40px, 12vw, 72px);
        font-weight: 400;
        line-height: 0.98;
        letter-spacing: -0.02em;
      }

      p {
        margin: 0 0 32px;
        max-width: 42ch;
        color: var(--ash);
        font-size: 15px;
        line-height: 1.6;
      }

      a {
        align-self: flex-start;
        display: inline-block;
        padding: 14px 22px;
        background: var(--ink);
        color: var(--canvas);
        font-size: 12px;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        text-decoration: none;
      }

      a:focus-visible {
        outline: 2px solid var(--ink);
        outline-offset: 3px;
      }

      footer {
        color: var(--ash);
        font-size: 11px;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }
    </style>
  </head>
  <body>
    <p class="brand">casa<span>·</span>os</p>
    <main>
      <p class="eyebrow">Sin conexión</p>
      <h1>No hay red.</h1>
      <p>
        casa·os necesita conexión para mostrar tus datos. Comprueba el Wi-Fi o
        los datos móviles y vuelve a intentarlo.
      </p>
      <a href="/">Reintentar</a>
    </main>
    <footer>casa·os · Tu hogar digital</footer>
  </body>
</html>
`;

export function GET() {
  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=0, must-revalidate',
    },
  });
}
