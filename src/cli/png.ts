/**
 * A tiny PNG writer for the theme screenshot when there is no canvas (the
 * CLI runs in Node). It draws the design's colours as simple blocks: the
 * background, a header bar, a title block in the text colour, a button in
 * the primary colour and three cards. Good enough for Appearance → Themes.
 */
import { deflateSync } from 'node:zlib';
import type { Palette } from '../types';

const W = 1200;
const H = 900;

function rgb(hex: string): [number, number, number] {
  const m = /^#?([0-9a-f]{6})/i.exec(hex);
  const n = m ? parseInt(m[1], 16) : 0xffffff;
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buf: Uint8Array): number {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 255] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Uint8Array): Uint8Array {
  const out = new Uint8Array(12 + data.length);
  const view = new DataView(out.buffer);
  view.setUint32(0, data.length);
  out.set(new TextEncoder().encode(type), 4);
  out.set(data, 8);
  view.setUint32(8 + data.length, crc32(out.subarray(4, 8 + data.length)));
  return out;
}

export function screenshotPng(p: Palette): Uint8Array {
  const rows = new Uint8Array(H * (1 + W * 3));
  const rect = (x0: number, y0: number, w: number, h: number, hex: string) => {
    const [r, g, b] = rgb(hex);
    for (let y = y0; y < Math.min(H, y0 + h); y++) {
      for (let x = x0; x < Math.min(W, x0 + w); x++) {
        const i = y * (1 + W * 3) + 1 + x * 3;
        rows[i] = r;
        rows[i + 1] = g;
        rows[i + 2] = b;
      }
    }
  };
  rect(0, 0, W, H, p.base);
  rect(80, 60, 220, 28, p.contrast); // site title
  for (let i = 0; i < 3; i++) rect(820 + i * 110, 64, 80, 20, p.contrast); // menu
  rect(80, 230, 640, 90, p.contrast); // name
  rect(80, 350, 460, 28, p.secondary); // tagline
  rect(80, 430, 220, 64, p.primary); // button
  rect(820, 200, 300, 300, p.accent); // photo
  for (let i = 0; i < 3; i++) rect(80 + i * 360, 600, 320, 220, p.accent); // cards
  const header = new Uint8Array(13);
  const view = new DataView(header.buffer);
  view.setUint32(0, W);
  view.setUint32(4, H);
  header.set([8, 2, 0, 0, 0], 8); // 8-bit RGB
  const sig = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
  const parts = [sig, chunk('IHDR', header), chunk('IDAT', deflateSync(rows)), chunk('IEND', new Uint8Array())];
  const out = new Uint8Array(parts.reduce((n, x) => n + x.length, 0));
  let o = 0;
  for (const x of parts) {
    out.set(x, o);
    o += x.length;
  }
  return out;
}
