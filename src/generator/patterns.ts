import type { BuilderState, PageKey } from '../types';
import { block, group, heading, paragraph } from './blocks';
import { renderSection, socialLinks } from './sections';
import { headerSafe, makePhp, phpString } from './utils';

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

const PAGE_TITLES: Record<PageKey, string> = { home: 'Home page', about: 'About page', contact: 'Contact page' };

export function patterns(state: BuilderState, slug: string): Record<string, string> {
  const php = makePhp(slug);
  const ctx = { info: state.info, php };
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

  const socials = socialLinks(state.info);
  defs.push({
    slug: 'footer',
    title: 'Footer',
    categories: 'footer',
    inserter: false,
    content: group(
      [
        socials,
        block(
          'paragraph',
          { align: 'center', fontSize: 'small' },
          `<p class="has-text-align-center has-small-font-size">© <?php echo esc_html( gmdate( 'Y' ) ); ?> ${php.t(state.info.name)}</p>`,
        ),
      ]
        .filter(Boolean)
        .join('\n'),
      { tagName: 'div', padY: 50 },
    ),
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
