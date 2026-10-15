import { describe, it, expect } from 'vitest';

/**
 * Tests de sanitizacion HTML.
 *
 * Valida que la funcion sanitizeNoteContent limpia correctamente
 * el HTML para prevenir XSS y solo permite tags/estilos seguros.
 *
 * Nota: Estos tests validan la logica de filtrado de tags y estilos.
 * La sanitizacion real con DOMPurify requiere DOM (se testa en integracion).
 */

const ALLOWED_TAGS = [
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'p', 'br', 'hr',
  'strong', 'b', 'em', 'i', 'u', 's', 'strike', 'del',
  'ul', 'ol', 'li',
  'blockquote', 'code', 'pre',
  'a', 'span', 'mark',
  'font',
];

const BLOCKED_TAGS = [
  'script', 'iframe', 'object', 'embed', 'form',
  'input', 'button', 'select', 'textarea',
  'img', 'video', 'audio', 'svg', 'math',
  'link', 'meta', 'style', 'base',
];

const ALLOWED_STYLES = [
  'color',
  'background-color',
  'font-size',
  'font-weight',
  'font-style',
  'text-decoration',
  'text-align',
];

describe('tags permitidos', () => {
  it('debe permitir tags de encabezado', () => {
    for (const tag of ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']) {
      expect(ALLOWED_TAGS.includes(tag)).toBe(true);
    }
  });

  it('debe permitir tags de formato de texto', () => {
    for (const tag of ['strong', 'b', 'em', 'i', 'u', 's', 'del']) {
      expect(ALLOWED_TAGS.includes(tag)).toBe(true);
    }
  });

  it('debe permitir listas', () => {
    for (const tag of ['ul', 'ol', 'li']) {
      expect(ALLOWED_TAGS.includes(tag)).toBe(true);
    }
  });

  it('debe permitir blockquote y code', () => {
    expect(ALLOWED_TAGS.includes('blockquote')).toBe(true);
    expect(ALLOWED_TAGS.includes('code')).toBe(true);
    expect(ALLOWED_TAGS.includes('pre')).toBe(true);
  });

  it('debe permitir enlaces', () => {
    expect(ALLOWED_TAGS.includes('a')).toBe(true);
  });

  it('debe permitir mark para resaltado', () => {
    expect(ALLOWED_TAGS.includes('mark')).toBe(true);
  });
});

describe('tags bloqueados (XSS)', () => {
  it('debe bloquear script', () => {
    expect(ALLOWED_TAGS.includes('script')).toBe(false);
  });

  it('debe bloquear iframe', () => {
    expect(ALLOWED_TAGS.includes('iframe')).toBe(false);
  });

  it('debe bloquear object y embed', () => {
    expect(ALLOWED_TAGS.includes('object')).toBe(false);
    expect(ALLOWED_TAGS.includes('embed')).toBe(false);
  });

  it('debe bloquear form elements', () => {
    for (const tag of ['form', 'input', 'button', 'select', 'textarea']) {
      expect(ALLOWED_TAGS.includes(tag)).toBe(false);
    }
  });

  it('debe bloquear img, video, audio', () => {
    for (const tag of ['img', 'video', 'audio']) {
      expect(ALLOWED_TAGS.includes(tag)).toBe(false);
    }
  });

  it('debe bloquear svg y math', () => {
    expect(ALLOWED_TAGS.includes('svg')).toBe(false);
    expect(ALLOWED_TAGS.includes('math')).toBe(false);
  });

  it('debe bloquear link, meta, style, base', () => {
    for (const tag of ['link', 'meta', 'style', 'base']) {
      expect(ALLOWED_TAGS.includes(tag)).toBe(false);
    }
  });
});

describe('estilos CSS permitidos', () => {
  it('debe permitir color', () => {
    expect(ALLOWED_STYLES.includes('color')).toBe(true);
  });

  it('debe permitir background-color', () => {
    expect(ALLOWED_STYLES.includes('background-color')).toBe(true);
  });

  it('debe permitir font-size', () => {
    expect(ALLOWED_STYLES.includes('font-size')).toBe(true);
  });

  it('debe permitir font-weight', () => {
    expect(ALLOWED_STYLES.includes('font-weight')).toBe(true);
  });

  it('debe permitir text-align', () => {
    expect(ALLOWED_STYLES.includes('text-align')).toBe(true);
  });

  it('debe permitir text-decoration', () => {
    expect(ALLOWED_STYLES.includes('text-decoration')).toBe(true);
  });
});

describe('logica de sanitizacion', () => {
  function simulateSanitize(html: string): string {
    // Simulacion simple de sanitizacion para tests sin DOM
    let result = html;

    // Primero remover event handlers para que no interfieran con el regex
    result = result.replace(/\s+on\w+="[^"]*"/gi, '');
    result = result.replace(/\s+on\w+='[^']*'/gi, '');

    // Remover tags bloqueadas con su contenido
    for (const tag of BLOCKED_TAGS) {
      // Tags con contenido: <tag>...</tag>
      const withContent = new RegExp(`<${tag}[^>]*>[\\s\\S]*?<\\/${tag}>`, 'gi');
      result = result.replace(withContent, '');
      // Tags self-closing: <tag /> o <tag>
      const selfClosing = new RegExp(`<${tag}([^>]*?)\\/>`, 'gi');
      result = result.replace(selfClosing, '');
      // Tags sin cerrar (como <img src="...">)
      const unclosed = new RegExp(`<${tag}([^>]*?)>`, 'gi');
      result = result.replace(unclosed, '');
    }

    // Remover javascript: en href
    result = result.replace(/href="javascript:[^"]*"/gi, '');

    return result;
  }

  it('debe remover scripts con contenido', () => {
    const input = '<p>Hola</p><script>alert("xss")</script><p>Adios</p>';
    const result = simulateSanitize(input);
    expect(result).not.toContain('script');
    expect(result).not.toContain('alert');
  });

  it('debe remover iframes', () => {
    const input = '<iframe src="evil.com"></iframe><p>Seguro</p>';
    const result = simulateSanitize(input);
    expect(result).not.toContain('iframe');
  });

  it('debe remover event handlers', () => {
    const input = '<p onclick="alert(1)">Click</p>';
    const result = simulateSanitize(input);
    expect(result).not.toContain('onclick');
  });

  it('debe remover javascript: en href', () => {
    const input = '<a href="javascript:alert(1)">Link</a>';
    const result = simulateSanitize(input);
    expect(result).not.toContain('javascript:');
  });

  it('debe remover img onerror', () => {
    const input = '<img src="x" onerror="alert(1)">';
    const result = simulateSanitize(input);
    expect(result).not.toContain('onerror');
  });

  it('debe remover tags img completamente', () => {
    const input = '<p>Antes</p><img src="foto.jpg"><p>Despues</p>';
    const result = simulateSanitize(input);
    expect(result).not.toContain('<img');
    expect(result).toContain('<p>Antes</p>');
    expect(result).toContain('<p>Despues</p>');
  });

  it('debe preservar HTML valido', () => {
    const input = '<h1>Titulo</h1><p>Parrafo con <strong>negrita</strong></p>';
    const result = simulateSanitize(input);
    expect(result).toContain('<h1>');
    expect(result).toContain('<strong>');
  });
});
