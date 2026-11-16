import { describe, expect, it } from 'vitest';
import { publishChecklist } from './checklist';
import { defaultState } from './defaults';
import { generateTheme } from './generator';
import { renderPage } from './preview/render';
import type { BuilderState } from './types';

const ready: BuilderState = {
  ...defaultState,
  info: {
    ...defaultState.info,
    name: 'Jane Doe',
    bio: 'I study computer science and contribute to WordPress.',
    email: 'jane@example.com',
    avatar: 'data:image/webp;base64,AAAA',
    projects: [{ title: 'One', description: 'First', url: 'https://example.com', image: 'data:image/webp;base64,BBBB' }],
    socials: { github: 'https://github.com/jane' },
  },
};

describe('publish checklist', () => {
  it('flags what a visitor would notice on an untouched draft', () => {
    const items = publishChecklist(defaultState);
    const fixes = items.filter((i) => i.level === 'fix').map((i) => i.text);
    expect(fixes.some((t) => t.includes('Your Name'))).toBe(true);
    expect(fixes.some((t) => t.includes('profile photo'))).toBe(true);
    expect(fixes.some((t) => t.includes('bio'))).toBe(true);
    expect(items.some((i) => i.level === 'tip' && i.text.includes('Left out because they are empty'))).toBe(true);
  });

  it('has nothing to fix on a finished profile', () => {
    expect(publishChecklist(ready).filter((i) => i.level === 'fix')).toEqual([]);
  });

  it('catches bad links, emails, untitled projects and unreadable colours', () => {
    const fixes = publishChecklist({
      ...ready,
      info: {
        ...ready.info,
        email: 'jane at example',
        cvUrl: 'my-cv.pdf',
        socials: { github: 'github.com/jane' },
        projects: [{ title: '', description: 'x', url: 'example.com' }],
      },
      style: { ...ready.style, palette: { ...ready.style.palette, contrast: '#dddddd', base: '#ffffff' } },
    })
      .filter((i) => i.level === 'fix')
      .map((i) => i.text);
    expect(fixes).toEqual(
      expect.arrayContaining([
        expect.stringContaining("doesn't look like an email"),
        expect.stringContaining('CV link should be a full address'),
        expect.stringContaining('github link should be a full address'),
        expect.stringContaining('A project has no title'),
        expect.stringContaining('text colour is hard to read'),
      ]),
    );
  });
});

describe('preview social icons', () => {
  it("draws WordPress' own icon with a hidden label", () => {
    const { files } = generateTheme(ready);
    const { html } = renderPage(ready, files, 'contact');
    expect(html).toMatch(/wp-social-link-github[^>]*><a[^>]*><svg width="24" height="24" viewBox="0 0 24 24"/);
    expect(html).toContain('<span class="wp-block-social-link-label screen-reader-text">GitHub</span>');
  });
});
