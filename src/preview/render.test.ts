import { describe, expect, it } from 'vitest';
import { defaultState } from '../defaults';
import { generateTheme } from '../generator';
import { PRESETS } from '../presets';
import type { BuilderState } from '../types';
import { themeCss } from './css';
import { evalPhp, renderPhp } from './php';
import { PREVIEW_PAGES, renderPage } from './render';

function fromPreset(key: string, info: Partial<BuilderState['info']> = {}): BuilderState {
  const p = PRESETS.find((x) => x.key === key)!;
  return {
    ...defaultState,
    info: { ...defaultState.info, ...info },
    preset: p.key,
    style: p.style,
    header: p.header,
    footer: p.footer,
    pages: p.pages,
  };
}

describe('PHP evaluation', () => {
  it('evaluates the calls our patterns use', () => {
    expect(evalPhp("echo esc_html__( 'Hello & <b>', 'x' );")).toBe('Hello &amp; &lt;b&gt;');
    expect(evalPhp("echo esc_html_x( 'Body', 'Block name', 'x' );")).toBe('Body');
    expect(evalPhp("echo esc_url( 'https://example.com/?a=1&b=2' );")).toBe('https://example.com/?a=1&amp;b=2');
    expect(evalPhp("echo esc_url( 'javascript:alert(1)' );")).toBe('');
    expect(evalPhp("echo esc_html( gmdate( 'Y' ) );")).toBe(String(new Date().getFullYear()));
  });

  it("keeps a ?> inside a string from ending the span", () => {
    const out = renderPhp("<p><?php echo esc_html__( 'O\\'Brien ?> <script>', 'x' ); ?></p>");
    expect(out).toBe('<p>O&#039;Brien ?&gt; &lt;script&gt;</p>');
  });

  it('JSON-escapes output that lands inside block attributes', () => {
    const out = renderPhp(`<!-- wp:group {"metadata":{"name":"<?php echo esc_html_x( 'Say "hi"', 'c', 'x' ); ?>"}} -->`);
    expect(JSON.parse(/\{.*\}/.exec(out)![0]).metadata.name).toBe('Say &quot;hi&quot;');
  });
});

describe('quick preview', () => {
  it.each(PRESETS.map((p) => p.key))('renders every page of %s without leftovers', (key) => {
    const state = fromPreset(key, {
      name: 'Jane Doe',
      email: 'jane@example.com',
      socials: { github: 'https://github.com/jane' },
      projects: [{ title: 'Campus Events', description: 'A block plugin.', url: 'https://example.com' }],
    });
    const { files } = generateTheme(state);
    for (const { key: page } of PREVIEW_PAGES) {
      const { html } = renderPage(state, files, page);
      expect(html, page).not.toMatch(/<!-- \/?wp:|<\?php|/);
      expect(html.length, page).toBeGreaterThan(200);
    }
    const home = renderPage(state, files, 'home').html;
    expect(home).toContain('Jane Doe');
    // Each template puts different sections on its home page.
    const types = state.pages.home.map((s) => s.type);
    if (types.includes('projects')) expect(home).toContain('Campus Events');
    if (types.includes('posts')) expect(home).toContain('My first WordPress contribution');
    expect(renderPage(state, files, 'contact').html).toContain('wp-social-link-github');
  });

  it('escapes what the student types', () => {
    const state = fromPreset('minimal', { name: '<img src=x onerror=alert(1)>' });
    const { html } = renderPage(state, generateTheme(state).files, 'home');
    expect(html).not.toContain('<img src=x');
    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;');
  });

  it('adds the layout classes WordPress would', () => {
    const state = fromPreset('creative');
    const { html, css } = renderPage(state, generateTheme(state).files, 'home');
    expect(html).toMatch(/class="[^"]*is-layout-constrained/);
    expect(html).toMatch(/class="[^"]*is-layout-flex/);
    expect(css).toMatch(/flex-wrap: wrap/);
  });
});

describe('preview CSS', () => {
  it('turns theme.json into presets, styles and font faces', () => {
    const state = fromPreset('creative');
    const { files } = generateTheme(state);
    const css = themeCss(files['theme.json'], (p) => `https://cdn.test/${p}`);
    expect(css).toContain(`--wp--preset--color--accent-1: ${state.style.palette.primary}`);
    expect(css).toContain('--wp--preset--spacing--40: clamp(24px, 2.33vw, 32px)');
    expect(css).toContain('url("https://cdn.test/assets/fonts/playfair-display/playfair-display-var-normal.woff2")');
    expect(css).toMatch(/\.wp-element-button, \.wp-block-button__link \{[^}]*background-color: var\(--wp--preset--color--accent-1\)/);
  });
});
