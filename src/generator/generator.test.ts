import JSZip from 'jszip';
import { describe, expect, it } from 'vitest';
import { defaultState } from '../defaults';
import type { BuilderState } from '../types';
import { buildZip } from '../zip/buildZip';
import { generateTheme, themeSlug } from './index';
import { SECTIONS } from './sections';

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

const BLOCK_RE = /<!--\s+(\/)?wp:([a-z][a-z0-9-]*(?:\/[a-z0-9-]+)?)\s+(\{[\s\S]*?\}\s+)?(\/)?-->/g;

/** Check every block comment is balanced and its JSON attributes parse. */
function checkBlockMarkup(markup: string): string[] {
  const errors: string[] = [];
  const stack: string[] = [];
  for (const m of markup.matchAll(BLOCK_RE)) {
    const [, closing, name, attrs, selfClosing] = m;
    if (attrs && !attrs.includes('<?php')) {
      try {
        JSON.parse(attrs);
      } catch {
        errors.push(`bad JSON in ${name}: ${attrs}`);
      }
    }
    if (selfClosing) continue;
    if (closing) {
      const open = stack.pop();
      if (open !== name) errors.push(`closing ${name} but open was ${open}`);
    } else stack.push(name);
  }
  if (stack.length) errors.push(`unclosed: ${stack.join(', ')}`);
  return errors;
}

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
    expect(json.settings.color.palette.map((c: { slug: string }) => c.slug)).toEqual([
      'base',
      'contrast',
      'primary',
      'secondary',
      'accent',
    ]);
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
        const out = generateTheme(state).files['patterns/home.php'];
        expect(checkBlockMarkup(out), `${type}/${variant}`).toEqual([]);
      }
    }
  });
});

describe('escaping', () => {
  it('keeps hostile input inside PHP string literals', () => {
    const { files } = generateTheme(
      withInfo({ name: "O'Brien ?> <script>", bio: "back\\slash ' quote", socials: { github: 'https://github.com/x"onmouseover' } }),
    );
    const home = files['patterns/home.php'];
    expect(home).toContain("esc_html__( 'O\\'Brien ?> <script>'");
    expect(home).not.toMatch(/<script>(?!')/);
    const about = files['patterns/about.php'];
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
