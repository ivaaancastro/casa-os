/**
 * Utilidades puras para el HTML de notas (sin DOM, aptas para SSR y tests).
 *
 * Convencion tipo Apple Notas: la PRIMERA linea del documento es el titulo.
 * El contenido se guarda como HTML; el titulo se deriva del primer bloque.
 */

const FIRST_BLOCK_RE = /^\s*<([a-z][a-z0-9]*)\b[^>]*>([\s\S]*?)<\/\1>/i;

function stripTags(html: string): string {
  return html.replace(/<[^>]*>/g, ' ');
}

/** Texto plano del primer bloque (el titulo). */
export function extractFirstBlockText(html: string): string {
  if (!html) return '';
  const match = html.match(FIRST_BLOCK_RE);
  const inner = match ? match[2] : html;
  return stripTags(inner).replace(/\s+/g, ' ').trim();
}

/** HTML sin el primer bloque (cuerpo de la nota, sin el titulo). */
export function removeFirstBlock(html: string): string {
  if (!html) return '';
  return html.replace(/^\s*<([a-z][a-z0-9]*)\b[^>]*>[\s\S]*?<\/\1>\s*/i, '');
}

/** Escapa texto para insertarlo como texto de un bloque HTML. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Garantiza que el contenido empiece por el titulo como primer bloque.
 * Idempotente: si el primer bloque ya es el titulo, no lo duplica.
 */
export function withTitleLine(title: string, content: string): string {
  const trimmed = title.trim();
  const first = extractFirstBlockText(content);
  if (!trimmed || first === trimmed) {
    return content || '<h1></h1>';
  }
  return `<h1>${escapeHtml(trimmed)}</h1>${content}`;
}
