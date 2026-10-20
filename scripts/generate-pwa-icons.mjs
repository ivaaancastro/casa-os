#!/usr/bin/env node
/**
 * Genera los iconos PNG de la PWA sin dependencias externas.
 *
 * Marca: una "c" geométrica (anillo abierto) con un punto en la abertura,
 * en la paleta de casa-os. Se dibuja con supersampling y se codifica el PNG
 * a mano (zlib + CRC32) para que los iconos sean reproducibles.
 *
 * Uso: npm run icons
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateSync } from 'node:zlib';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = join(ROOT, 'public', 'icons');

const COLORS = {
  canvas: [0xff, 0xff, 0xff],
  ink: [0x0a, 0x0a, 0x0a],
};

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buffer) {
  let c = 0xffffffff;
  for (let i = 0; i < buffer.length; i += 1) {
    c = CRC_TABLE[(c ^ buffer[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);

  const typeBuffer = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);

  return Buffer.concat([length, typeBuffer, data, crc]);
}

function encodePng(width, height, rgb) {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bits por canal
  ihdr[9] = 2; // color type: RGB
  ihdr[10] = 0; // compresión
  ihdr[11] = 0; // filtro
  ihdr[12] = 0; // sin entrelazado

  // Cada fila lleva un byte de filtro (0 = None) delante.
  const stride = width * 3;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y += 1) {
    const rowStart = y * (stride + 1);
    raw[rowStart] = 0;
    rgb.copy(raw, rowStart + 1, y * stride, (y + 1) * stride);
  }

  return Buffer.concat([
    signature,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', deflateSync(raw, { level: 9 })),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

/**
 * Dibuja la marca en un canvas RGB de `size`×`size`.
 * `scale` reduce el conjunto para la zona segura de los iconos maskable.
 */
function drawMark(size, { background, foreground, scale = 1 }) {
  const samples = 4; // supersampling 4×4 por píxel
  const hi = size * samples;
  const cx = hi / 2;
  const cy = hi / 2;

  const outer = 0.3125 * hi * scale;
  const stroke = 0.0859 * hi * scale;
  const inner = outer - stroke;
  const gap = (34 * Math.PI) / 180;
  const dotRadius = 0.0429 * hi * scale;
  const dotX = cx + 0.2734 * hi * scale;

  const high = Buffer.alloc(hi * hi * 3);

  for (let y = 0; y < hi; y += 1) {
    const dy = y + 0.5 - cy;
    for (let x = 0; x < hi; x += 1) {
      const dx = x + 0.5 - cx;
      const radius = Math.hypot(dx, dy);
      const angle = Math.atan2(dy, dx);

      const inRing = radius >= inner && radius <= outer && Math.abs(angle) > gap;
      const inDot = Math.hypot(x + 0.5 - dotX, dy) <= dotRadius;
      const color = inRing || inDot ? foreground : background;

      const offset = (y * hi + x) * 3;
      high[offset] = color[0];
      high[offset + 1] = color[1];
      high[offset + 2] = color[2];
    }
  }

  // Downsample por caja (promedio de samples×samples).
  const out = Buffer.alloc(size * size * 3);
  const total = samples * samples;
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      let r = 0;
      let g = 0;
      let b = 0;
      for (let sy = 0; sy < samples; sy += 1) {
        for (let sx = 0; sx < samples; sx += 1) {
          const offset = ((y * samples + sy) * hi + (x * samples + sx)) * 3;
          r += high[offset];
          g += high[offset + 1];
          b += high[offset + 2];
        }
      }
      const offset = (y * size + x) * 3;
      out[offset] = Math.round(r / total);
      out[offset + 1] = Math.round(g / total);
      out[offset + 2] = Math.round(b / total);
    }
  }

  return encodePng(size, size, out);
}

const icons = [
  { file: 'icon-32.png', size: 32 },
  { file: 'icon-192.png', size: 192 },
  { file: 'icon-512.png', size: 512 },
  { file: 'apple-touch-icon.png', size: 180 },
  {
    file: 'maskable-512.png',
    size: 512,
    background: COLORS.ink,
    foreground: COLORS.canvas,
    scale: 0.9,
  },
];

mkdirSync(OUT_DIR, { recursive: true });

for (const icon of icons) {
  const png = drawMark(icon.size, {
    background: icon.background ?? COLORS.canvas,
    foreground: icon.foreground ?? COLORS.ink,
    scale: icon.scale ?? 1,
  });
  const target = join(OUT_DIR, icon.file);
  writeFileSync(target, png);
  console.log(`✔ ${icon.file} (${icon.size}×${icon.size}, ${png.length} bytes)`);
}
