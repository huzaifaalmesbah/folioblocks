import { describe, expect, it } from 'vitest';
import { defaultState } from './defaults';
import { generateTheme } from './generator';
import { isSectionEmpty } from './generator/sections';
import { checkBlockMarkup } from './generator/testUtils';
import { exportSettings, parseSettings } from './layout';
import { PRESETS } from './presets';
import { profileCompleteness } from './profile';
import type { BuilderState, Info } from './types';

const full: Info = {
  ...defaultState.info,
  name: 'Jane Doe',
  bio: 'I study computer science and contribute to WordPress.',
  email: 'jane@example.com',
  avatar: 'data:image/webp;base64,AAAA',
  skills: ['PHP', 'JS', 'CSS'],
  projects: [
    { title: 'One', description: 'First', url: '' },
    { title: 'Two', description: 'Second', url: 'https://example.com' },
  ],
  education: [{ degree: 'BSc CSE', school: 'Example University', period: '2023 – 2027' }],
  experience: [{ role: 'Intern', org: 'Agency', period: '2026', description: 'Built patterns.' }],
  achievements: [{ title: 'Winner', issuer: 'Fest', year: '2025', url: 'https://example.com/a' }],
  contributions: [{ team: 'Polyglots', description: 'Translations', date: '2026', url: 'https://translate.wordpress.org' }],
  cvUrl: 'https://example.com/cv.pdf',
  socials: { github: 'https://github.com/jane' },
};

const withInfo = (info: Info, preset = 'minimal'): BuilderState => {
  const p = PRESETS.find((x) => x.key === preset)!;
  return { ...defaultState, info, style: p.style, header: p.header, footer: p.footer, pages: p.pages, preset };
};

describe('profile completeness', () => {
  it('starts low and reaches 100% with the basics and recommended parts', () => {
    const empty = profileCompleteness(defaultState.info);
    expect(empty.percent).toBeLessThan(30);
    expect(empty.next[0]).toBe('Add your name');
    expect(profileCompleteness(full)).toEqual({ percent: 100, next: [] });
  });
});

describe('empty sections', () => {
  it.each(PRESETS.map((p) => p.key))('%s leaves out sections with nothing to show', (key) => {
    const { files } = generateTheme(withInfo({ ...defaultState.info, skills: [] }, key));
    const all = Object.values(files).join('\n');
    for (const text of ['Project one', 'Your team', 'Add your', 'Skills', 'Experience', 'Education', 'Achievements', 'About me']) {
      expect(all, text).not.toContain(`'${text}`);
    }
    for (const [path, content] of Object.entries(files)) {
      if (/^patterns\//.test(path)) expect(checkBlockMarkup(content), path).toEqual([]);
    }
  });

  it('a page with nothing to show gets a starter line instead of an empty pattern', () => {
    const state = withInfo({ ...defaultState.info, skills: [] });
    const { files } = generateTheme({ ...state, pages: { ...state.pages, contact: [{ id: 'c', type: 'contact', variant: 'full' }] } });
    expect(files['patterns/page-contact.php']).toContain('This page is empty for now');
  });

  it('knows which sections are empty for a person', () => {
    expect(isSectionEmpty({ id: 'x', type: 'projects', variant: 'grid' }, defaultState.info)).toBe(true);
    expect(isSectionEmpty({ id: 'x', type: 'projects', variant: 'grid' }, full)).toBe(false);
    expect(isSectionEmpty({ id: 'x', type: 'hero', variant: 'avatar' }, defaultState.info)).toBe(false);
  });

  it('the preview fills empty parts with samples', () => {
    const { files } = generateTheme(withInfo(defaultState.info), { samples: true });
    expect(files['patterns/page-home.php']).toContain("'Project one'");
  });
});

describe('new profile sections', () => {
  const { files } = generateTheme(withInfo(full));
  const about = files['patterns/page-about.php'];
  const home = files['patterns/page-home.php'];

  it('renders experience, education, achievements and dated, linked contributions', () => {
    for (const text of ['Experience', 'Intern', 'Agency', 'Education', 'BSc CSE', 'Example University · 2023 – 2027', 'Achievements', 'Winner', 'Fest, 2025']) {
      expect(about, text).toContain(`'${text}'`);
    }
    expect(about).toContain("esc_url( 'https://translate.wordpress.org' )");
    expect(about).toContain("esc_url( 'https://example.com/a' )");
    expect(checkBlockMarkup(about)).toEqual([]);
  });

  it('adds a Download CV button to the hero', () => {
    expect(home).toContain("'Download CV'");
    expect(home).toContain("esc_url( 'https://example.com/cv.pdf' )");
  });

  it('survives a settings export and import', () => {
    const state = withInfo(full);
    expect(parseSettings(exportSettings(state, [])).state.info).toEqual(full);
  });
});

describe('templates and language', () => {
  it('every palette is readable: text on background and button text on primary pass WCAG AA', async () => {
    const { contrastRatio } = await import('./color');
    const { PALETTES } = await import('./presets');
    for (const { key, palette } of PALETTES) {
      expect(contrastRatio(palette.contrast, palette.base), `${key} text`).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(palette.base, palette.primary), `${key} button`).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(palette.primary, palette.base), `${key} link`).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('the Bangla template writes the theme\'s own words in Bengali and bundles a Bengali font', () => {
    const p = PRESETS.find((x) => x.key === 'bangla')!;
    const state: BuilderState = { ...withInfo(full, 'bangla'), language: p.language! };
    const { files, assets } = generateTheme(state);
    const home = files['patterns/page-home.php'];
    expect(home).toContain("esc_html__( 'আমার সম্পর্কে'");
    expect(home).toContain("esc_html__( 'প্রজেক্ট'");
    expect(home).not.toContain("'About me'");
    // The student's own text is untouched.
    expect(home).toContain("'I study computer science and contribute to WordPress.'");
    expect(files['patterns/footer.php']).toContain('ওয়ার্ডপ্রেস</a> দিয়ে তৈরি');
    expect(assets.map((a) => a.path)).toContain('assets/fonts/noto-sans-bengali/noto-sans-bengali-var-normal.woff2');
    expect(files['readme.txt']).toContain('Noto Sans Bengali');
    for (const [path, content] of Object.entries(files)) {
      if (/^patterns\//.test(path)) expect(checkBlockMarkup(content), path).toEqual([]);
    }
  });

  it('shows stats only when there are at least two numbers', () => {
    const stats = { id: 's', type: 'stats' as const, variant: 'row' };
    expect(isSectionEmpty(stats, { ...defaultState.info, skills: ['a'] })).toBe(true);
    expect(isSectionEmpty(stats, full)).toBe(false);
  });
});

describe('services, testimonials and the newest designs', () => {
  const info: Info = {
    ...full,
    services: [{ title: 'Theme setup', description: 'Install and configure.' }],
    testimonials: [
      { quote: 'Careful and kind.', name: 'A. Rahman', role: 'Advisor' },
      { quote: '   ', name: 'Nobody', role: '' },
    ],
  };

  it('renders services as cards and only testimonials that have words', () => {
    const home = generateTheme(withInfo(info, 'freelancer')).files['patterns/page-home.php'];
    expect(home).toContain("'Theme setup'");
    expect(home).toContain('<blockquote class="wp-block-quote">');
    expect(home).toContain("'A. Rahman, Advisor'");
    expect(home).not.toContain("'Nobody'");
    expect(checkBlockMarkup(home)).toEqual([]);
  });

  it('the colour-band hero writes classes in the order the editor saves them', () => {
    const home = generateTheme(withInfo(info, 'bold')).files['patterns/page-home.php'];
    expect(home).toContain('class="wp-block-group alignfull has-base-color has-accent-3-background-color has-text-color has-background"');
  });

  it('has twenty templates, each with its own key and a best-for line', () => {
    expect(PRESETS).toHaveLength(20);
    expect(new Set(PRESETS.map((p) => p.key)).size).toBe(20);
    for (const p of PRESETS) expect(p.bestFor.length, p.key).toBeGreaterThan(5);
  });
});
