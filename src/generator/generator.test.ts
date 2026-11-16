import JSZip from 'jszip';
import { describe, expect, it } from 'vitest';
import { defaultState } from '../defaults';
import type { BuilderState } from '../types';
import { buildZip } from '../zip/buildZip';
import { generateTheme, themeSlug } from './index';
import { PALETTES } from '../presets';
import { SECTIONS } from './sections';
import { checkBlockMarkup } from './testUtils';

const REQUIRED = [
  'style.css',
  'theme.json',
  'functions.php',
  'readme.txt',
  'parts/header.html',
  'parts/footer.html',
  'templates/index.html',
  'templates/home.html',
  'templates/front-page.html',
  'templates/single.html',
  'templates/page.html',
  'templates/page-about.html',
  'templates/page-contact.html',
  'templates/archive.html',
  'templates/search.html',
  'templates/404.html',
];

function withInfo(patch: Partial<BuilderState['info']>): BuilderState {
  return { ...defaultState, info: { ...defaultState.info, ...patch } };
}

describe('themeSlug', () => {
  it('makes WordPress-safe slugs', () => {
    expect(themeSlug('Jane Doe')).toBe('jane-doe-portfolio');
    expect(themeSlug('  Ána  Müller!! ')).toBe('ana-muller-portfolio');
    expect(themeSlug('হুজাইফা')).toBe('my-portfolio');
  });
});

describe('generateTheme', () => {
  const { slug, files } = generateTheme(withInfo({ name: 'Jane Doe', email: 'jane@example.com' }));

  it('creates every required file', () => {
    for (const f of REQUIRED) expect(files, f).toHaveProperty([f]);
    expect(slug).toBe('jane-doe-portfolio');
  });

  it('writes a valid style.css header', () => {
    const css = files['style.css'];
    expect(css).toContain('Theme Name: Jane Doe Portfolio');
    expect(css).toContain('Text Domain: jane-doe-portfolio');
    expect(css).toContain('License: GNU General Public License v2 or later');
  });

  it('writes a valid theme.json v3', () => {
    const json = JSON.parse(files['theme.json']);
    expect(json.version).toBe(3);
    expect(json.$schema).toBe('https://schemas.wp.org/trunk/theme.json');
    // Twenty Twenty-Five / Ipsum slugs, so core patterns find matching colours.
    expect(json.settings.color.palette.map((c: { slug: string }) => c.slug)).toEqual([
      'base',
      'contrast',
      'accent-1',
      'accent-3',
      'accent-5',
      'accent-6',
    ]);
    expect(json.settings.custom.controlScheme).toBe('light');
    expect(json.settings.spacing.spacingSizes.map((s: { slug: string }) => s.slug)).toEqual(['20', '30', '40', '50', '60', '70', '80']);
    expect(json.customTemplates.map((t: { name: string }) => t.name)).toEqual(['page-about', 'page-contact']);
  });

  it('produces balanced block markup with parseable attributes', () => {
    for (const [path, content] of Object.entries(files)) {
      if (!/\.(html|php)$/.test(path) || path === 'functions.php') continue;
      expect(checkBlockMarkup(content), path).toEqual([]);
    }
  });

  it('only references patterns that exist', () => {
    const all = Object.values(files).join('\n');
    const refs = [...all.matchAll(/wp:pattern \{"slug":"([^"]+)"\}/g)].map((m) => m[1]);
    expect(refs.length).toBeGreaterThan(0);
    for (const ref of refs) {
      const file = `patterns/${ref.replace(`${slug}/`, '')}.php`;
      expect(files, ref).toHaveProperty([file]);
      expect(files[file]).toContain(`Slug: ${ref}`);
    }
  });

  it('renders every section variant without markup errors', () => {
    for (const [type, variants] of Object.entries(SECTIONS)) {
      for (const variant of Object.keys(variants)) {
        const state = { ...defaultState, pages: { ...defaultState.pages, home: [{ id: 'x', type, variant }] } } as BuilderState;
        const out = generateTheme(state).files['patterns/page-home.php'];
        expect(checkBlockMarkup(out), `${type}/${variant}`).toEqual([]);
      }
    }
  });
});

describe('Ipsum conventions', () => {
  const { slug, files } = generateTheme(withInfo({ name: 'Jane Doe', email: 'jane@example.com' }));
  const patternFiles = Object.entries(files).filter(([p]) => p.startsWith('patterns/'));

  it('makes every template and part a one-line delegate to a pattern', () => {
    for (const [path, content] of Object.entries(files)) {
      if (!/^(templates|parts)\//.test(path)) continue;
      expect(content, path).toMatch(new RegExp(`^<!-- wp:pattern \\{"slug":"${slug}/[a-z0-9-]+"\\} /-->\\n$`));
    }
  });

  it('gives every pattern a Title, Slug and Description', () => {
    for (const [path, content] of patternFiles) {
      for (const key of ['Title', 'Slug', 'Description']) expect(content, `${path} ${key}`).toMatch(new RegExp(` \\* ${key}: \\S`));
      expect(content, path).toContain(`@package ${slug}`);
    }
  });

  it('hides template patterns from the inserter and names their template', () => {
    for (const [path, content] of patternFiles.filter(([p]) => p.startsWith('patterns/hidden-'))) {
      expect(content, path).toContain(' * Inserter: no');
      expect(content, path).toMatch(/ \* Template Types: \S/);
    }
  });

  it('offers header and footer patterns as template part designs', () => {
    expect(files['patterns/header.php']).toContain('Block Types: core/template-part/header');
    expect(files['patterns/footer.php']).toContain('Block Types: core/template-part/footer');
  });

  it('leaves out editor leftovers such as queryId', () => {
    // theme.json legitimately has "area" in templateParts; block markup must not.
    for (const [path, content] of Object.entries(files)) {
      if (/\.(php|html)$/.test(path)) expect(content, path).not.toMatch(/"queryId"|"area":|"patternName"/);
    }
  });

  it('writes block markup in the serializer format', () => {
    for (const [path, content] of patternFiles) {
      // A wrapper closes on the line of its last child, never on a line of its own.
      expect(content, path).not.toMatch(/-->\n<\/(div|section|main|ul)>/);
    }
  });

  it('adds every other palette as a colour style variation', () => {
    const variations = Object.keys(files).filter((p) => p.startsWith('styles/colors/'));
    expect(variations.length).toBe(PALETTES.length - 1);
    expect(variations[0]).toMatch(/^styles\/colors\/01-[a-z-]+\.json$/);
    const midnight = JSON.parse(files[variations.find((v) => v.endsWith('midnight.json'))!]);
    expect(midnight.title).toBe('Midnight');
    expect(midnight.settings.custom.controlScheme).toBe('dark');
  });
});

describe('escaping', () => {
  it('keeps hostile input inside PHP string literals', () => {
    const { files } = generateTheme(
      withInfo({ name: "O'Brien ?> <script>", bio: "back\\slash ' quote", socials: { github: 'https://github.com/x"onmouseover' } }),
    );
    const home = files['patterns/page-home.php'];
    expect(home).toContain("esc_html__( 'O\\'Brien ?> <script>'");
    expect(home).not.toMatch(/<script>(?!')/);
    const about = files['patterns/page-about.php'];
    expect(about).toContain("'back\\\\slash \\' quote'");
    expect(files['patterns/footer.php']).toContain("esc_url( 'https://github.com/xonmouseover' )");
  });
});

describe('buildZip', () => {
  it('puts the theme folder at the zip root', async () => {
    const { slug, files } = generateTheme(defaultState);
    const blob = await buildZip(slug, files, { 'screenshot.png': new Uint8Array([137, 80, 78, 71]) });
    const zip = await JSZip.loadAsync(await blob.arrayBuffer());
    const names = Object.keys(zip.files);
    expect(names).toContain(`${slug}/style.css`);
    expect(names).toContain(`${slug}/screenshot.png`);
    expect(names.every((n) => n.startsWith(`${slug}/`))).toBe(true);
  });
});
