import { describe, expect, it } from 'vitest';
import { defaultState } from '../defaults';
import { FONT_KEYS, fontDef } from '../fonts';
import { buildBlueprint } from '../playground/blueprint';
import { PRESETS } from '../presets';
import type { BuilderState, FooterVariant, HeaderVariant } from '../types';
import { generateTheme } from './index';
import { SECTIONS } from './sections';
import { checkBlockMarkup } from './testUtils';

function fromPreset(key: string, patch: Partial<BuilderState> = {}): BuilderState {
  const p = PRESETS.find((x) => x.key === key)!;
  return { ...defaultState, preset: p.key, style: p.style, header: p.header, footer: p.footer, pages: p.pages, ...patch };
}

describe('presets', () => {
  it('only use section variants that exist', () => {
    for (const p of PRESETS) {
      for (const sections of Object.values(p.pages)) {
        for (const s of sections) expect(SECTIONS[s.type], `${p.key}: ${s.type}/${s.variant}`).toHaveProperty([s.variant]);
      }
    }
  });

  it.each(PRESETS.map((p) => p.key))('%s generates valid block markup', (key) => {
    const { files } = generateTheme(
      fromPreset(key, {
        info: {
          ...defaultState.info,
          email: 'a@example.com',
          socials: { github: 'https://github.com/a', wordpress: 'https://profiles.wordpress.org/a' },
          projects: [{ title: 'P', description: 'D', url: 'https://example.com' }],
          contributions: [{ team: 'Polyglots', description: 'Translations' }],
        },
      }),
    );
    for (const [path, content] of Object.entries(files)) {
      if (!/\.(html|php)$/.test(path) || path === 'functions.php') continue;
      expect(checkBlockMarkup(content), `${key} ${path}`).toEqual([]);
    }
  });
});

describe('header and footer variants', () => {
  it.each([
    ['inline', 'centered'],
    ['centered', 'split'],
  ] as [HeaderVariant, FooterVariant][])('header %s / footer %s are valid', (header, footer) => {
    const { files } = generateTheme({
      ...defaultState,
      header,
      footer,
      info: { ...defaultState.info, socials: { github: 'https://github.com/a' } },
    });
    expect(checkBlockMarkup(files['parts/header.html'])).toEqual([]);
    expect(checkBlockMarkup(files['patterns/footer.php'])).toEqual([]);
  });
});

describe('fonts', () => {
  it('bundles font files with fontFace and lists their licence', () => {
    const state = fromPreset('creative');
    const { files, assets } = generateTheme(state);
    expect(assets.sort()).toEqual(['assets/fonts/dm-sans.woff2', 'assets/fonts/playfair-display.woff2']);

    const families = JSON.parse(files['theme.json']).settings.typography.fontFamilies;
    const playfair = families.find((f: { slug: string }) => f.slug === 'playfair-display');
    expect(playfair.fontFace[0].src).toEqual(['file:./assets/fonts/playfair-display.woff2']);

    expect(files['readme.txt']).toContain('Playfair Display, SIL Open Font License 1.1');
  });

  it('needs no files for system fonts', () => {
    const { assets, files } = generateTheme({
      ...defaultState,
      style: { ...defaultState.style, fonts: { heading: 'system-serif', body: 'system-sans' } },
    });
    expect(assets).toEqual([]);
    expect(files['readme.txt']).toContain('No bundled third-party resources');
  });

  it('every bundled font has a weight range', () => {
    for (const k of FONT_KEYS) {
      const f = fontDef(k);
      if (f.file) expect(f.weight, k).toMatch(/^\d+ \d+$/);
    }
  });

  it('adds a Playground download step for each font', () => {
    const state = fromPreset('developer');
    const { slug, files, assets } = generateTheme(state);
    const bp = buildBlueprint(state, slug, files, assets, 'https://example.org/app/');
    const writes = bp.steps.filter((s) => s.step === 'writeFile') as unknown as {
      path: string;
      data: { url: string };
    }[];
    expect(writes.map((w) => w.data.url).sort()).toEqual([
      'https://example.org/app/fonts/inter.woff2',
      'https://example.org/app/fonts/jetbrains-mono.woff2',
    ]);
    expect(writes[0].path.startsWith(`/wordpress/wp-content/themes/${slug}/assets/fonts/`)).toBe(true);
  });
});
