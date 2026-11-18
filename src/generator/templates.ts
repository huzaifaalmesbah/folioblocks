/**
 * Templates follow Ipsum's rule: "the pattern is the source of truth".
 * Each `templates/*.html` is a one-line delegate to a hidden pattern, and the
 * pattern holds the markup, so every string in a template is translatable.
 */
import { block, container, group, heading, join, metaText, paragraph, pattern, separator, templatePart } from './blocks';
import { postTemplate } from './sections';
import type { Php } from './utils';
import type { LookDef } from './looks';

type Frame = LookDef['frame'];

export type PatternDef = {
  /** Slug without the theme prefix, e.g. "hidden-single". */
  slug: string;
  title: string;
  description: string;
  content: string;
  categories?: string;
  templateTypes?: string;
  blockTypes?: string;
  postTypes?: string;
  viewportWidth?: number;
  inserter?: boolean;
};

const header = templatePart('header');
const footer = templatePart('footer');

/** Header + <main> (constrained, no margins) + footer: the frame of every template. */
function frame(php: Php, main: string, opts: { full?: boolean } = {}): string {
  return join(
    header,
    group(main, {
      name: php.name('Body'),
      tagName: 'main',
      noMargin: true,
      padY: opts.full ? undefined : 50,
      layout: opts.full ? { type: 'default' } : { type: 'constrained' },
    }),
    footer,
  );
}

/**
 * The frame of the Home, About and Contact templates, by look: full width
 * (sections set their own widths), constrained (sections become cards at the
 * content width), or a white sheet with a shadow on the page ground.
 */
function pageFrame(php: Php, main: string, kind?: Frame): string {
  if (kind === 'constrained') {
    return join(header, group(main, { name: php.name('Body'), tagName: 'main', noMargin: true, padY: 50, layout: { type: 'constrained' } }), footer);
  }
  if (kind === 'sheet') {
    const sheet = group(main, {
      name: php.name('Body'),
      tagName: 'main',
      background: 'accent-5',
      shadow: 'paper',
      pad: 50,
      layout: { type: 'constrained' },
    });
    return join(header, group(sheet, { name: php.name('Sheet'), padY: 30, layout: { type: 'constrained', contentSize: '900px' } }), footer);
  }
  return frame(php, main, { full: true });
}

function searchForm(php: Php): string {
  return block('search', { label: php.attr('Search'), showLabel: false, buttonText: php.attr('Search') });
}

/** A query loop that follows the current request (blog, archive, search). */
function mainQuery(php: Php): string {
  const posts = postTemplate(
    join(
      group(
        join(
          block('post-featured-image', { isLink: true, aspectRatio: '16/9' }),
          block('post-title', { isLink: true }),
          block('post-date'),
          block('post-excerpt'),
        ),
        {
          name: php.name('Post'),
          layout: { type: 'default' },
        },
      ),
      separator(),
    ),
  );
  const pagination = block(
    'query-pagination',
    undefined,
    join(block('query-pagination-previous'), block('query-pagination-numbers'), block('query-pagination-next')),
  );
  const noResults = block('query-no-results', undefined, paragraph(php.t('Nothing found. Try a different search.')));
  return container('query', { query: { inherit: true } }, 'div', 'wp-block-query', join(posts, pagination, noResults));
}

/** Date · categories, with Ipsum's Meta Separator paragraph between them. */
function postMeta(php: Php): string {
  return group(
    join(
      block('post-date'),
      metaText(`<span aria-hidden="true">${php.t('·')}</span>`, php.name('Meta Separator')),
      block('post-terms', { term: 'category' }),
    ),
    { name: php.name('Date and Categories'), layout: { type: 'flex', flexWrap: 'wrap' } },
  );
}

function authorCard(php: Php): string {
  return group(join(metaText(php.t('Written by')), block('post-author-name', { isLink: true })), {
    name: php.name('Author Card'),
    layout: { type: 'flex', flexWrap: 'nowrap' },
  });
}

function postNavigation(php: Php): string {
  return group(
    join(
      block('post-navigation-link', { type: 'previous', label: php.attr('Previous post') }),
      block('post-navigation-link', { label: php.attr('Next post') }),
    ),
    { name: php.name('Post Navigation'), layout: { type: 'flex', justifyContent: 'space-between' } },
  );
}

function comments(): string {
  const commentTemplate = block(
    'comment-template',
    undefined,
    join(block('comment-author-name'), block('comment-date'), block('comment-content'), block('comment-reply-link')),
  );
  return container(
    'comments',
    undefined,
    'div',
    'wp-block-comments',
    join(
      block('comments-title'),
      commentTemplate,
      block(
        'comments-pagination',
        undefined,
        join(block('comments-pagination-previous'), block('comments-pagination-numbers'), block('comments-pagination-next')),
      ),
      block('post-comments-form'),
    ),
  );
}

/** The hidden patterns that fill each template, and the one-line template delegates. */
export function templates(php: Php, slug: string, kind?: Frame): { patterns: PatternDef[]; files: Record<string, string> } {
  const hidden = (
    template: string,
    title: string,
    description: string,
    content: string,
  ): [string, PatternDef] => [
    template,
    { slug: `hidden-${template}`, title, description, content, templateTypes: template, inserter: false },
  ];

  const defs: [string, PatternDef][] = [
    hidden('index', 'Index', 'The Index template. It lists the latest posts with their excerpts, between the theme header and footer.', frame(php, mainQuery(php))),
    hidden(
      'home',
      'Blog Home',
      'The Blog Home template, used for the posts page. It shows a Blog heading over the latest posts with their excerpts.',
      frame(php, join(heading(php.t('Blog'), 1), paragraph(php.t('Notes on what I am learning and building.')), mainQuery(php))),
    ),
    hidden(
      'archive',
      'Archive',
      'The Archive template. It shows the archive title and description over the matching posts.',
      frame(php, join(block('query-title', { type: 'archive' }), block('term-description'), mainQuery(php))),
    ),
    hidden(
      'search',
      'Search Results',
      'The Search Results template. It shows the search title and a search field over the matching posts.',
      frame(php, join(block('query-title', { type: 'search' }), searchForm(php), mainQuery(php))),
    ),
    hidden(
      'front-page',
      'Front Page',
      'The Front Page template. It shows the Home page pattern, full width, between the theme header and footer.',
      pageFrame(php, pattern(`${slug}/page-home`), kind),
    ),
    hidden(
      'page-about',
      'About',
      'The About page template. It shows the About page pattern, full width, between the theme header and footer.',
      pageFrame(php, pattern(`${slug}/page-about`), kind),
    ),
    hidden(
      'page-contact',
      'Contact',
      'The Contact page template. It shows the Contact page pattern, full width, between the theme header and footer.',
      pageFrame(php, pattern(`${slug}/page-contact`), kind),
    ),
    hidden(
      'page',
      'Pages',
      'The Pages template. It shows the page title over the page content.',
      frame(php, join(block('post-title', { level: 1 }), block('post-content', { layout: { type: 'constrained' } }))),
    ),
    hidden(
      'single',
      'Single Posts',
      'The Single Posts template. It shows the title, date and categories, featured image, content, tags, author, post navigation and comments.',
      frame(
        php,
        join(
          block('post-title', { level: 1 }),
          postMeta(php),
          block('post-featured-image', { aspectRatio: '16/9' }),
          block('post-content', { layout: { type: 'constrained' } }),
          block('post-terms', { term: 'post_tag' }),
          authorCard(php),
          separator(),
          postNavigation(php),
          comments(),
        ),
      ),
    ),
    hidden(
      '404',
      'Page Not Found',
      'The Page Not Found template. It says the page does not exist and offers a search field.',
      frame(
        php,
        join(
          heading(php.t('Page not found'), 1),
          paragraph(php.t('The page you are looking for does not exist. Try searching instead.')),
          searchForm(php),
        ),
      ),
    ),
  ];

  return {
    patterns: defs.map(([, def]) => def),
    files: Object.fromEntries(defs.map(([t, def]) => [`templates/${t}.html`, `${pattern(`${slug}/${def.slug}`)}\n`])),
  };
}
