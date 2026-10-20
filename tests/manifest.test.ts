import { describe, it, expect } from 'vitest';
import manifest from '../src/app/manifest';

describe('manifest de la PWA', () => {
  const data = manifest();

  it('declara la identidad de la app', () => {
    expect(data.name).toContain('casa·os');
    expect(data.short_name).toBe('casa·os');
    expect(data.description).toBeTruthy();
    expect(data.lang).toBe('es');
  });

  it('abre en modo standalone desde la raíz', () => {
    expect(data.start_url).toBe('/');
    expect(data.scope).toBe('/');
    expect(data.display).toBe('standalone');
  });

  it('usa los colores de la marca', () => {
    expect(data.background_color).toBe('#FFFFFF');
    expect(data.theme_color).toBe('#FFFFFF');
  });

  it('incluye iconos 192 y 512 (uno maskable)', () => {
    const icons = data.icons ?? [];

    expect(icons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ src: '/icons/icon-192.png', sizes: '192x192' }),
        expect.objectContaining({ src: '/icons/icon-512.png', sizes: '512x512' }),
        expect.objectContaining({
          src: '/icons/maskable-512.png',
          sizes: '512x512',
          purpose: 'maskable',
        }),
      ]),
    );
  });

  it('todos los iconos son PNG', () => {
    for (const icon of data.icons ?? []) {
      expect(icon.type).toBe('image/png');
    }
  });
});
