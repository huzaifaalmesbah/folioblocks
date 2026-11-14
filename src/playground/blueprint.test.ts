import { describe, expect, it } from 'vitest';
import { defaultState } from '../defaults';
import { generateTheme } from '../generator';
import { buildBlueprint, playgroundUrl, toFileTree } from './blueprint';

describe('toFileTree', () => {
  it('nests flat paths into directories', () => {
    expect(toFileTree({ 'style.css': 'a', 'templates/index.html': 'b', 'templates/home.html': 'c' })).toEqual({
      'style.css': 'a',
      templates: { 'index.html': 'b', 'home.html': 'c' },
    });
  });
});

describe('buildBlueprint', () => {
  const state = { ...defaultState, info: { ...defaultState.info, name: 'হুজাইফা Doe' } };
  const { slug, files } = generateTheme(state);
  const bp = buildBlueprint(state, slug, files);

  it('installs and activates the theme from embedded files', () => {
    const install = bp.steps[0] as { step: string; themeData: { resource: string; name: string; files: Record<string, unknown> }; options: { activate: boolean } };
    expect(install.step).toBe('installTheme');
    expect(install.themeData.resource).toBe('literal:directory');
    expect(install.themeData.name).toBe(slug);
    expect(install.themeData.files).toHaveProperty(['style.css']);
    expect(install.themeData.files).toHaveProperty(['templates', 'front-page.html']);
    expect(install.options.activate).toBe(true);
  });

  it('round-trips through the URL, including non-Latin text', () => {
    const url = playgroundUrl(bp);
    expect(url.startsWith('https://playground.wordpress.net/#')).toBe(true);
    const b64 = url.split('#')[1];
    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    const decoded = JSON.parse(new TextDecoder().decode(bytes));
    expect(decoded).toEqual(JSON.parse(JSON.stringify(bp)));
    // Keep links well under browser URL limits (~2 MB in Chromium).
    expect(url.length).toBeLessThan(500_000);
  });
});
