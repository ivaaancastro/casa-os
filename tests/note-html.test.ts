import { describe, it, expect } from 'vitest';
import {
  extractFirstBlockText,
  removeFirstBlock,
  escapeHtml,
  withTitleLine,
} from '../src/lib/utils/note-html';

describe('note-html - extractFirstBlockText', () => {
  it('devuelve el texto del primer bloque', () => {
    expect(extractFirstBlockText('<h1>Hola</h1><p>mundo</p>')).toBe('Hola');
    expect(extractFirstBlockText('<p>uno</p><p>dos</p>')).toBe('uno');
  });

  it('extrae texto con formato anidado', () => {
    expect(extractFirstBlockText('<h1>Hola <strong>mundo</strong></h1>')).toBe('Hola mundo');
  });

  it('devuelve cadena vacia con contenido vacio', () => {
    expect(extractFirstBlockText('')).toBe('');
    expect(extractFirstBlockText('<h1></h1>')).toBe('');
  });
});

describe('note-html - removeFirstBlock', () => {
  it('quita el primer bloque', () => {
    expect(removeFirstBlock('<h1>T</h1><ul><li>x</li></ul>')).toBe('<ul><li>x</li></ul>');
    expect(removeFirstBlock('<p>uno</p><p>dos</p>')).toBe('<p>dos</p>');
  });

  it('devuelve vacio si solo hay un bloque', () => {
    expect(removeFirstBlock('<h1>T</h1>')).toBe('');
  });
});

describe('note-html - escapeHtml', () => {
  it('escapa caracteres peligrosos', () => {
    expect(escapeHtml('A & B <x> "y"')).toBe('A &amp; B &lt;x&gt; &quot;y&quot;');
  });
});

describe('note-html - withTitleLine', () => {
  it('antepone el titulo si falta', () => {
    expect(withTitleLine('T', '<p>b</p>')).toBe('<h1>T</h1><p>b</p>');
  });

  it('es idempotente cuando el titulo ya es la primera linea', () => {
    const content = '<h1>T</h1><p>b</p>';
    expect(withTitleLine('T', content)).toBe(content);
  });

  it('crea una linea de titulo vacia para nota nueva', () => {
    expect(withTitleLine('', '')).toBe('<h1></h1>');
  });

  it('escapa el titulo al anteponerlo', () => {
    expect(withTitleLine('A & B', '<p>x</p>')).toBe('<h1>A &amp; B</h1><p>x</p>');
  });
});
