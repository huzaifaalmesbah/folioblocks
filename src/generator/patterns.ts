import { SITE_URL } from '../config';
import type { BuilderState, PageKey } from '../types';
import { block, group, join, paragraph, pattern } from './blocks';
import { renderSection, socialLinks, type Ctx } from './sections';
import { footerCredit } from './i18n';
import { templates, type PatternDef } from './templates';
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

function headerContent(state: BuilderState, php: Php): string {
  const nav = (justify: string) =>
    block('navigation', {
      metadata: { name: php.name('Navigation') },
      overlayMenu: 'mobile',
      layout: { type: 'flex', justifyContent: justify },
    });
  const row =
    state.header === 'centered'
      ? group(join(block('site-title', { textAlign: 'center' }), nav('center')), {
          name: php.name('Header Row'),
          layout: { type: 'flex', orientation: 'vertical', justifyContent: 'center' },
        })
      : group(join(block('site-title'), nav('right')), {
          name: php.name('Header Row'),
          align: 'wide',
          layout: { type: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' },
        });
  return group(row, { name: php.name('Header'), padY: 30, noMargin: true });
}

function footerContent(state: BuilderState, php: Php): string {
  const year = "<?php echo esc_html( gmdate( 'Y' ) ); ?>";
  const copy = (center: boolean) =>
    block(
      'paragraph',
      center
        ? { metadata: { name: php.name('Copyright') }, align: 'center', fontSize: 'small' }
        : { metadata: { name: php.name('Copyright') }, fontSize: 'small' },
      `<p class="${center ? 'has-text-align-center ' : ''}has-small-font-size">© ${year} ${php.t(state.info.name)}</p>`,
    );

  // The credit line: WordPress, and the tool that made the theme. Students can remove it in the Site Editor.
  const credit = (center: boolean) =>
    block(
      'paragraph',
      center
        ? { metadata: { name: php.name('Credit') }, align: 'center', fontSize: 'small' }
        : { metadata: { name: php.name('Credit') }, fontSize: 'small' },
      `<p class="${center ? 'has-text-align-center ' : ''}has-small-font-size">${php.html(footerCredit(php.lang, SITE_URL))}</p>`,
    );

  if (state.footer === 'split') {
    const text = group(join(copy(false), credit(false)), {
      name: php.name('Copyright and Credit'),
      layout: { type: 'flex', orientation: 'vertical' },
    });
    const row = group(join(text, socialLinks(state.info, php, 'right')), {
      name: php.name('Footer Row'),
      align: 'wide',
      layout: { type: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' },
    });
    return group(row, { name: php.name('Footer'), padY: 50, noMargin: true });
  }
  return group(join(socialLinks(state.info, php), copy(true), credit(true)), {
    name: php.name('Footer'),
    padY: 50,
    noMargin: true,
  });
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
  const ctx: Ctx = { info: state.info, php, radius: RADIUS[state.style.radius] };
  const defs: PatternDef[] = [];

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
        join(...state.pages[page].map((s) => renderSection(s, ctx))) ||
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

  const t = templates(php, slug);
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

