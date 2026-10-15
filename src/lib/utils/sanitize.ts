import DOMPurify from 'dompurify';

const ALLOWED_TAGS = [
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'p', 'br', 'hr',
  'strong', 'b', 'em', 'i', 'u', 's', 'strike', 'del',
  'ul', 'ol', 'li',
  'blockquote', 'code', 'pre',
  'a', 'span', 'mark',
  'font',
];

const ALLOWED_ATTR = [
  'href', 'target', 'rel',
  'style', 'class',
  'data-type', 'data-checked',
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
];

export function sanitizeHtml(dirty: string): string {
  if (typeof window === 'undefined') {
    // En servidor, retornar string vacio (DOMPurify necesita DOM)
    return '';
  }

  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
    KEEP_CONTENT: true,
    RETURN_DOM: false,
    RETURN_DOM_FRAGMENT: false,
    RETURN_TRUSTED_TYPE: false,
  });
}

export function sanitizeNoteContent(content: string): string {
  const clean = sanitizeHtml(content);

  // Limpiar estilos no permitidos de los spans
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = clean;

  const styledElements = tempDiv.querySelectorAll('[style]');
  styledElements.forEach((el) => {
    const style = el.getAttribute('style') || '';
    const filteredStyles = style
      .split(';')
      .filter((s) => {
        const prop = s.split(':')[0]?.trim().toLowerCase() ?? '';
        return ALLOWED_STYLES.includes(prop);
      })
      .join(';');

    if (filteredStyles) {
      el.setAttribute('style', filteredStyles);
    } else {
      el.removeAttribute('style');
    }
  });

  return tempDiv.innerHTML;
}

export function extractTextFromHtml(html: string): string {
  if (typeof window === 'undefined') return '';

  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = sanitizeHtml(html);
  return tempDiv.textContent || '';
}
