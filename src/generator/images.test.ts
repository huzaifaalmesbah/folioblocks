import { describe, expect, it } from 'vitest';
import { defaultState } from '../defaults';
import { buildBlueprint } from '../playground/blueprint';
import { PRESETS } from '../presets';
import { renderPage } from '../preview/render';
import type { BuilderState } from '../types';
import { generateTheme } from './index';
import { checkBlockMarkup } from './testUtils';

const PNG = 'data:image/webp;base64,UklGRhYAAABXRUJQVlA4IAoAAAAwAQCdASoBAAEAAUAmJaQAA3AA/v89WAAAAA==';

function withPreset(key: string, info: Partial<BuilderState['info']> = {}): BuilderState {
  const p = PRESETS.find((x) => x.key === key)!;
  return { ...defaultState, info: { ...defaultState.info, ...info }, style: p.style, header: p.header, footer: p.footer, pages: p.pages, preset: key };
}

describe('images', () => {
  it('uses placeholders until the student adds photos, and only ships images in use', () => {
    const { assets, files } = generateTheme(withPreset('minimal'));
    const images = assets.filter((a) => a.path.startsWith('assets/images/'));
    expect(images.map((a) => a.path).sort()).toEqual([
      'assets/images/avatar.webp',
      'assets/images/project-1.webp',
      'assets/images/project-2.webp',
      'assets/images/project-3.webp',
    ]);
    expect(images.every((a) => a.src && !a.data)).toBe(true);
    // Minimal has no cover image, so it isn't shipped.
    expect(images.some((a) => a.path.endsWith('cover.webp'))).toBe(false);
    // Openverse photos are credited one by one, with their CC0 licence.
    const readme = files['readme.txt'];
    expect(readme).toContain('Title: assets/images/project-1.webp\nPhoto "Office Work" by Negative Space');
    expect(readme).toContain('found on Openverse: https://openverse.org/image/');
    expect(readme).toContain('License: CC0 1.0 Universal');
    expect(readme).toContain('Title: assets/images/avatar.webp\nPlaceholder drawn by FolioBlocks.');
    expect(readme).not.toContain('cover.webp');
  });

  it("ships the student's own photos and credits them", () => {
    const state = withPreset('creative', {
      name: 'Jane Doe',
      avatar: PNG,
      cover: PNG,
      projects: [{ title: 'A', description: 'B', url: '', image: PNG }],
    });
    const { assets, files } = generateTheme(state);
    const byPath = Object.fromEntries(assets.map((a) => [a.path, a]));
    expect(byPath['assets/images/cover.webp'].data).toBe(PNG);
    expect(byPath['assets/images/project-1.webp'].data).toBe(PNG);
    // Placeholders still fill the grid's remaining slots.
    expect(byPath['assets/images/project-2.webp']?.src ?? 'unused').not.toBe(PNG);
    expect(files['readme.txt']).toContain('Title: assets/images/cover.webp\nPhoto by Jane Doe, who holds its copyright.');
  });

  it('references images through get_parent_theme_file_uri with translated alt text', () => {
    const { files } = generateTheme(withPreset('academic'));
    const home = files['patterns/page-home.php'];
    expect(home).toContain("get_parent_theme_file_uri( 'assets/images/avatar.webp' )");
    expect(home).toMatch(/alt="<\?php echo esc_attr__\( 'Portrait of /);
    expect(checkBlockMarkup(home)).toEqual([]);
  });

  it('shows featured images in post lists and single posts', () => {
    const { files } = generateTheme(withPreset('minimal'));
    expect(files['patterns/hidden-single.php']).toContain('wp:post-featured-image');
    expect(files['patterns/hidden-home.php']).toContain('wp:post-featured-image');
    expect(files['patterns/page-home.php']).toContain('wp:post-featured-image');
  });

  it('writes uploaded photos and sample thumbnails in Playground', () => {
    const state = withPreset('minimal', { avatar: PNG });
    const { slug, files, assets } = generateTheme(state);
    const bp = buildBlueprint(state, slug, files, assets);
    const php = bp.steps.filter((s) => s.step === 'runPHP').map((s) => (s as { code: string }).code);
    expect(php.some((c) => c.includes(`themes/${slug}/assets/images/avatar.webp`) && c.includes('base64_decode'))).toBe(true);
    const urls = bp.steps.filter((s) => s.step === 'writeFile').map((s) => (s as unknown as { data: { url: string } }).data.url);
    expect(urls).toContain('https://huzaifaalmesbah.github.io/folioblocks/images/post-1.webp');
    expect(php.some((c) => c.includes('set_post_thumbnail'))).toBe(true);
  });

  it('renders images in the quick preview', () => {
    const state = withPreset('creative', { avatar: PNG });
    const { files } = generateTheme(state);
    const { html } = renderPage(state, files, 'home', {
      fileUrl: (p) => (p.endsWith('avatar.webp') ? PNG : `https://x.test/${p}`),
      sampleImage: (i) => `https://x.test/post-${i}.webp`,
    });
    expect(html).toContain('src="https://x.test/assets/images/cover.webp"');
    expect(html).toContain('src="https://x.test/post-0.webp"');
  });
});
