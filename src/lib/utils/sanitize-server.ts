import sanitizeHtml from 'sanitize-html';

const ALLOWED_TAGS = [
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'p', 'br', 'hr', 'div',
  'strong', 'b', 'em', 'i', 'u', 's', 'strike', 'del',
  'ul', 'ol', 'li',
  'blockquote', 'code', 'pre',
  'a', 'span', 'mark',
  'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'colgroup', 'col', 'caption',
  'label', 'input',
  'font',
];

const ALLOWED_ATTR = [
  'href', 'target', 'rel',
  'style', 'class',
  'data-type', 'data-checked', 'data-indent', 'data-list-style', 'data-color',
  'type', 'checked', 'disabled',
  'colspan', 'rowspan', 'colwidth',
];

const ALLOWED_STYLES = [
  'color',
  'background-color',
  'font-family',
  'font-size',
  'font-weight',
  'line-height',
  'font-style',
  'text-decoration',
  'text-align',
  'margin-left',
  'width',
  'min-width',
];

/** Sanitización server-side equivalente a la del cliente. */
export function sanitizeHtmlServer(dirty: string): string {
  return sanitizeHtml(dirty, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: {
      '*': [
        'style',
        'class',
        'data-type',
        'data-checked',
        'data-indent',
        'data-list-style',
        'data-color',
      ],
      a: ['href', 'target', 'rel'],
      input: ['type', 'checked', 'disabled'],
      td: ['colspan', 'rowspan', 'colwidth'],
      th: ['colspan', 'rowspan', 'colwidth'],
    },
    allowedStyles: {
      '*': {
        color: [/^(?!.*url\()(?!.*expression\().*$/i],
        'background-color': [/^(?!.*url\()(?!.*expression\().*$/i],
        'font-family': [/^(?!.*url\()(?!.*expression\().*$/i],
        'font-size': [/^(?!.*url\()(?!.*expression\().*$/i],
        'font-weight': [/^(?!.*url\()(?!.*expression\().*$/i],
        'line-height': [/^(?!.*url\()(?!.*expression\().*$/i],
        'font-style': [/^(?!.*url\()(?!.*expression\().*$/i],
        'text-decoration': [/^(?!.*url\()(?!.*expression\().*$/i],
        'text-align': [/^(?!.*url\()(?!.*expression\().*$/i],
        'margin-left': [/^(?!.*url\()(?!.*expression\().*$/i],
        width: [/^(?!.*url\()(?!.*expression\().*$/i],
        'min-width': [/^(?!.*url\()(?!.*expression\().*$/i],
      },
    },
    // permitir data-type etc.
    transformTags: {},
  });
}

export function sanitizeNoteContentServer(content: string): string {
  let clean = sanitizeHtmlServer(content);

  // sanitize-html ya filtra tags/attrs; filtrar estilos a la allowlist estricta
  // (sanitize-html allowedStyles con regex /.*/ permite cualquier valor; refinamos).
  // Eliminar inputs que no sean checkbox.
  clean = clean.replace(/<input(?![^>]*type=["']checkbox["'])[^>]*>/gi, '');

  return clean;
}