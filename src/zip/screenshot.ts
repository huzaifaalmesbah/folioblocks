import type { BuilderState } from '../types';
import { fontDef } from '../fonts';
import { loadFonts } from './assets';

/** Render a 1200×900 screenshot.png for the theme from the student's colours and info. */
export async function renderScreenshot(state: BuilderState): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 900;
  const ctx = canvas.getContext('2d')!;
  const { palette, fonts } = state.style;
  await loadFonts([fonts.heading, fonts.body]);
  const headingFont = fontDef(fonts.heading).stack;
  const bodyFont = fontDef(fonts.body).stack;

  ctx.fillStyle = palette.base;
  ctx.fillRect(0, 0, 1200, 900);

  // Header bar.
  ctx.fillStyle = palette.contrast;
  ctx.font = `700 26px ${headingFont}`;
  ctx.fillText(state.info.name, 80, 80);
  ctx.font = `400 22px ${bodyFont}`;
  ctx.textAlign = 'right';
  ctx.fillText('About   Blog   Contact', 1120, 80);
  ctx.textAlign = 'center';

  // Hero.
  ctx.font = `700 76px ${headingFont}`;
  ctx.fillText(state.info.name, 600, 330, 1040);
  ctx.font = `400 32px ${bodyFont}`;
  ctx.fillText(state.info.tagline, 600, 400, 1040);

  // Button.
  ctx.fillStyle = palette.primary;
  ctx.beginPath();
  ctx.roundRect(470, 460, 260, 70, state.style.radius === 'none' ? 0 : 12);
  ctx.fill();
  ctx.fillStyle = palette.base;
  ctx.font = `600 26px ${bodyFont}`;
  ctx.fillText('View my work', 600, 505);

  // Project cards band.
  ctx.fillStyle = palette.accent;
  ctx.fillRect(0, 620, 1200, 280);
  ctx.fillStyle = palette.base;
  [80, 440, 800].forEach((x) => {
    ctx.beginPath();
    ctx.roundRect(x, 680, 320, 170, 12);
    ctx.fill();
  });

  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Screenshot failed'))), 'image/png'),
  );
}
