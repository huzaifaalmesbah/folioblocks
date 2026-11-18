import { SITE_URL } from '../config';
import type { BuilderState, PageKey } from '../types';
import { block, group, join, metaText, paragraph, pattern } from './blocks';
import { renderSection, socialLinks, type Ctx } from './sections';
import { footerCredit } from './i18n';
import { templates, type PatternDef } from './templates';
import { lookDef } from './looks';
import { RADIUS } from './themeJson';
import { headerSafe, makePhp, type Php } from './utils';

/** A pattern file with Ipsum's header: Title, Slug, the optional keys, Description, then @package and @since. */
function patternFile(textDomain: string, p: PatternDef): string {
  const lines = ['<?php', '/**', ` * Title: ${headerSafe(p.title)}`, ` * Slug: ${textDomain}/${p.slug}`];
  if (p.categories) lines.push(` * Categories: ${p.categories}`);
  if (p.templateTypes) lines.push(` * Template Types: ${p.templateTypes}`);
  if (p.blockTypes) lines.push(` * Block Types: ${p.blockTypes}`);
  if (p.postTypes) lines.push(` * Post Types: ${p.postTypes}`);
  if (p.viewportWidth) lines.push(` * Viewport width: ${p.viewportWidth}`);
  if (p.inserter === false) lines.push(' * Inserter: no');
  lines.push(` * Description: ${headerSafe(p.description)}`);
  lines.push(' *', ` * @package ${textDomain}`, ' * @since 1.0.0', ' */', '', '?>');
  return `${lines.join('\n')}\n${p.content}\n`;
}

/**
 * Header and footer rows line up with the page: as wide as the wide size
 * normally, or as the content when the look turns sections into cards (or
 * puts the page on a sheet), so their edges match the cards below.
 */
function chrome(state: BuilderState): { align?: 'wide'; layout: Record<string, unknown> } {
  const frame = lookDef(state.style).frame;
  if (frame === 'sheet') return { layout: { type: 'constrained', contentSize: '900px' } };
  if (frame === 'constrained') return { layout: { type: 'constrained' } };
  return { align: 'wide', layout: { type: 'constrained' } };
}

function headerContent(state: BuilderState, php: Php): string {
  const nav = (justify: string) =>
    block('navigation', {
      metadata: { name: php.name('Navigation') },
      overlayMenu: 'mobile',
      layout: { type: 'flex', justifyContent: justify },
    });
  const { align, layout } = chrome(state);
  const row =
    state.header === 'centered'
      ? group(join(block('site-title', { textAlign: 'center' }), nav('center')), {
          name: php.name('Header Row'),
          layout: { type: 'flex', orientation: 'vertical', justifyContent: 'center' },
        })
      : group(join(block('site-title'), nav('right')), {
          name: php.name('Header Row'),
          align,
          layout: { type: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' },
        });
  return group(row, { name: php.name('Header'), padY: 30, noMargin: true, layout });
}

/**
 * The footer: a thin rule on top, the site title and quiet one-colour social
 * icons, then one small line with the copyright and the credit. Centered
 * stacks everything in the middle (balanced at any width); split puts the
 * name and line on the left and the icons on the right.
 */
function footerContent(state: BuilderState, php: Php): string {
  const year = "<?php echo esc_html( gmdate( 'Y' ) ); ?>";
  const center = state.footer !== 'split';
  const small = (name: string, html: string) =>
    center
      ? block('paragraph', { metadata: { name: php.name(name) }, align: 'center', fontSize: 'small' }, `<p class="has-text-align-center has-small-font-size">${html}</p>`)
      : block('paragraph', { metadata: { name: php.name(name) }, fontSize: 'small' }, `<p class="has-small-font-size">${html}</p>`);
  // The credit names WordPress and the tool that made the theme. Students can remove it in the Site Editor.
  const line = group(
    join(
      small('Copyright', `© ${year} ${php.t(state.info.name)}`),
      metaText(`<span aria-hidden="true">${php.t('·')}</span>`, php.name('Meta Separator')),
      small('Credit', php.html(footerCredit(php.lang, SITE_URL))),
    ),
    {
      name: php.name('Copyright and Credit'),
      blockGap: 'var:preset|spacing|20',
      layout: { type: 'flex', flexWrap: 'wrap', justifyContent: center ? 'center' : 'left' },
    },
  );
  const title = block('site-title', center ? { level: 0, textAlign: 'center' } : { level: 0 });
  const icons = socialLinks(state.info, php, center ? 'center' : 'right', { slug: 'contrast', value: state.style.palette.contrast });
  const { align, layout } = chrome(state);
  const rule = { color: 'accent-6', width: '1px' };

  if (!center) {
    const left = group(join(title, line), { name: php.name('Name and Copyright'), blockGap: 'var:preset|spacing|20', layout: { type: 'flex', orientation: 'vertical' } });
    const row = group(join(left, icons), {
      name: php.name('Footer Row'),
      align,
      layout: { type: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', verticalAlignment: 'center' },
    });
    return group(row, { name: php.name('Footer'), padY: 50, noMargin: true, borderTop: rule, layout });
  }
  const stack = group(join(title, icons, line), {
    name: php.name('Footer Row'),
    blockGap: 'var:preset|spacing|30',
    layout: { type: 'flex', orientation: 'vertical', justifyContent: 'center' },
  });
  return group(stack, { name: php.name('Footer'), padY: 50, noMargin: true, borderTop: rule, layout });
}

const PAGES: Record<PageKey, { title: string; category: string; description: string }> = {
  home: {
    title: 'Home page',
    category: 'featured',
    description: 'The portfolio home page. It introduces you, then shows your work, latest posts and a way to get in touch.',
  },
  about: {
    title: 'About page',
    category: 'about',
    description: 'The portfolio about page. It tells your story, then lists your skills and your WordPress journey.',
  },
  contact: {
    title: 'Contact page',
    category: 'contact',
    description: 'The portfolio contact page. It shows your email, location and social links.',
  },
};

export function patterns(state: BuilderState, slug: string): { patterns: Record<string, string>; templates: Record<string, string> } {
  const php = makePhp(slug, state.language ?? 'en');
  const look = lookDef(state.style);
  const ctx: Ctx = { info: state.info, php, radius: RADIUS[state.style.radius], look };
  const defs: PatternDef[] = [];

  // Each page numbers its section headings from 01 (the Editorial look).
  const counters = new Map<PageKey, { n: number }>();
  const pageCtx = (page: PageKey): Ctx => {
    if (!counters.has(page)) counters.set(page, { n: 0 });
    return { ...ctx, counter: counters.get(page) };
  };

  // Full page layouts take the page- prefix and are offered as starter content for new pages.
  (Object.keys(PAGES) as PageKey[]).forEach((page) => {
    defs.push({
      slug: `page-${page}`,
      title: PAGES[page].title,
      description: PAGES[page].description,
      categories: PAGES[page].category,
      blockTypes: 'core/post-content',
      postTypes: 'page',
      viewportWidth: 1280,
      // Sections with nothing to show are left out; a page with none gets a line to start from.
      content:
        join(...state.pages[page].map((s) => renderSection(s, pageCtx(page)))) ||
        group(paragraph(php.t('This page is empty for now. Add blocks to it in the Site Editor.')), { name: php.name('Empty page'), padY: 60 }),
    });
  });

  defs.push(
    {
      slug: 'header',
      title: 'Header',
      description: 'The theme header, with the site title and the navigation.',
      categories: 'header',
      blockTypes: 'core/template-part/header',
      viewportWidth: 1280,
      content: headerContent(state, php),
    },
    {
      slug: 'footer',
      title: 'Footer',
      description: 'The theme footer, with the copyright line and social links.',
      categories: 'footer',
      blockTypes: 'core/template-part/footer',
      viewportWidth: 1280,
      content: footerContent(state, php),
    },
  );

  const t = templates(php, slug, look.frame);
  defs.push(...t.patterns);

  return {
    patterns: Object.fromEntries(defs.map((d) => [`patterns/${d.slug}.php`, patternFile(slug, d)])),
    templates: {
      ...t.files,
      // Parts delegate to their patterns too.
      'parts/header.html': `${pattern(`${slug}/header`)}\n`,
      'parts/footer.html': `${pattern(`${slug}/footer`)}\n`,
    },
  };
}

