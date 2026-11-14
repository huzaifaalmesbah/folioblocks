import type { BuilderState, PageKey } from '../types';
import { block, group, heading, paragraph } from './blocks';
import { renderSection, socialLinks, type Ctx } from './sections';
import { RADIUS } from './themeJson';
import { headerSafe, makePhp, phpString, type Php } from './utils';

type PatternDef = { slug: string; title: string; content: string; categories?: string; inserter?: boolean };

function patternFile(textDomain: string, p: PatternDef): string {
  const lines = [
    '<?php',
    '/**',
    ` * Title: ${headerSafe(p.title)}`,
    ` * Slug: ${textDomain}/${p.slug}`,
  ];
  if (p.categories) lines.push(` * Categories: ${p.categories}`);
  if (p.inserter === false) lines.push(' * Inserter: no');
  lines.push(' *', ` * @package ${textDomain}`, ' */', '', "defined( 'ABSPATH' ) || exit;", '?>');
  return `${lines.join('\n')}\n${p.content}\n`;
}

function footerContent(state: BuilderState, php: Php): string {
  const year = "<?php echo esc_html( gmdate( 'Y' ) ); ?>";
  const copy = (center: boolean) =>
    block(
      'paragraph',
      center ? { align: 'center', fontSize: 'small' } : { fontSize: 'small' },
      `<p class="${center ? 'has-text-align-center ' : ''}has-small-font-size">© ${year} ${php.t(state.info.name)}</p>`,
    );

  if (state.footer === 'split') {
    const row = group([copy(false), socialLinks(state.info, 'right')].filter(Boolean).join('\n'), {
      align: 'wide',
      layout: { type: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' },
    });
    return group(row, { padY: 50 });
  }
  return group([socialLinks(state.info), copy(true)].filter(Boolean).join('\n'), { padY: 50 });
}

const PAGE_TITLES: Record<PageKey, string> = { home: 'Home page', about: 'About page', contact: 'Contact page' };

export function patterns(state: BuilderState, slug: string): Record<string, string> {
  const php = makePhp(slug);
  const ctx: Ctx = { info: state.info, php, radius: RADIUS[state.style.radius] };
  /** Attribute-safe translatable label (goes inside block JSON). */
  const attr = (text: string) => `<?php echo esc_attr__( ${phpString(text)}, ${phpString(slug)} ); ?>`;

  const defs: PatternDef[] = [];

  (Object.keys(PAGE_TITLES) as PageKey[]).forEach((page) => {
    defs.push({
      slug: page,
      title: PAGE_TITLES[page],
      categories: 'featured',
      content: state.pages[page].map((s) => renderSection(s, ctx)).join('\n\n'),
    });
  });

  defs.push({
    slug: 'footer',
    title: 'Footer',
    categories: 'footer',
    inserter: false,
    content: footerContent(state, php),
  });

  defs.push(
    {
      slug: 'blog-heading',
      title: 'Blog heading',
      inserter: false,
      content: [heading(php.t('Blog'), 1), paragraph(php.t('Notes on what I am learning and building.'))].join('\n'),
    },
    {
      slug: 'search-form',
      title: 'Search form',
      inserter: false,
      content: `<!-- wp:search {"label":"${attr('Search')}","showLabel":false,"buttonText":"${attr('Search')}"} /-->`,
    },
    {
      slug: 'no-results',
      title: 'No results',
      inserter: false,
      content: paragraph(php.t('Nothing found. Try a different search.')),
    },
    {
      slug: 'post-meta',
      title: 'Post meta',
      inserter: false,
      content: group(
        [block('post-date'), paragraph(php.t('by')), block('post-author-name'), block('post-terms', { term: 'category' })].join('\n'),
        { layout: { type: 'flex', flexWrap: 'wrap' } },
      ),
    },
    {
      slug: 'post-navigation',
      title: 'Post navigation',
      inserter: false,
      content: group(
        [
          `<!-- wp:post-navigation-link {"type":"previous","label":"${attr('Previous post')}"} /-->`,
          `<!-- wp:post-navigation-link {"label":"${attr('Next post')}"} /-->`,
        ].join('\n'),
        { layout: { type: 'flex', justifyContent: 'space-between' } },
      ),
    },
    {
      slug: '404',
      title: 'Page not found',
      inserter: false,
      content: [
        heading(php.t('Page not found'), 1),
        paragraph(php.t('The page you are looking for does not exist. Try searching instead.')),
        `<!-- wp:search {"label":"${attr('Search')}","showLabel":false,"buttonText":"${attr('Search')}"} /-->`,
      ].join('\n'),
    },
  );

  return Object.fromEntries(defs.map((d) => [`patterns/${d.slug}.php`, patternFile(slug, d)]));
}
