import { block, group, pattern, templatePart } from './blocks';

const header = templatePart('header', 'header');
const footer = templatePart('footer', 'footer');
const separator = block('separator', undefined, '<hr class="wp-block-separator has-alpha-channel-opacity"/>');

/** Header + padded <main> + footer. */
function wrap(main: string): string {
  return [header, group(main, { tagName: 'main', padY: 50 }), footer].join('\n\n') + '\n';
}

/** Header + full-bleed <main> holding one page pattern + footer. */
function fullPage(patternSlug: string): string {
  return (
    [header, group(pattern(patternSlug), { tagName: 'main', layout: { type: 'default' } }), footer].join('\n\n') +
    '\n'
  );
}

/** A query loop that follows the current request (blog, archive, search). */
function mainQuery(slug: string): string {
  const template = block(
    'post-template',
    undefined,
    [block('post-title', { isLink: true }), block('post-date'), block('post-excerpt'), separator].join('\n'),
  );
  const pagination = block(
    'query-pagination',
    undefined,
    [block('query-pagination-previous'), block('query-pagination-numbers'), block('query-pagination-next')].join('\n'),
  );
  const noResults = block('query-no-results', undefined, pattern(`${slug}/no-results`));
  return block(
    'query',
    { queryId: 0, query: { inherit: true } },
    `<div class="wp-block-query">\n${template}\n${pagination}\n${noResults}\n</div>`,
  );
}

function comments(): string {
  const commentTemplate = block(
    'comment-template',
    undefined,
    [block('comment-author-name'), block('comment-date'), block('comment-content'), block('comment-reply-link')].join(
      '\n',
    ),
  );
  const inner = [
    block('comments-title'),
    commentTemplate,
    block(
      'comments-pagination',
      undefined,
      [block('comments-pagination-previous'), block('comments-pagination-numbers'), block('comments-pagination-next')].join(
        '\n',
      ),
    ),
    block('post-comments-form'),
  ].join('\n');
  return block('comments', undefined, `<div class="wp-block-comments">\n${inner}\n</div>`);
}

export function templates(slug: string): Record<string, string> {
  return {
    'templates/index.html': wrap(mainQuery(slug)),
    'templates/home.html': wrap([pattern(`${slug}/blog-heading`), mainQuery(slug)].join('\n')),
    'templates/archive.html': wrap(
      [block('query-title', { type: 'archive' }), block('term-description'), mainQuery(slug)].join('\n'),
    ),
    'templates/search.html': wrap(
      [block('query-title', { type: 'search' }), pattern(`${slug}/search-form`), mainQuery(slug)].join('\n'),
    ),
    'templates/front-page.html': fullPage(`${slug}/home`),
    'templates/page-about.html': fullPage(`${slug}/about`),
    'templates/page-contact.html': fullPage(`${slug}/contact`),
    'templates/page.html': wrap(
      [block('post-title', { level: 1 }), block('post-content', { layout: { type: 'constrained' } })].join('\n'),
    ),
    'templates/single.html': wrap(
      [
        block('post-title', { level: 1 }),
        pattern(`${slug}/post-meta`),
        block('post-featured-image'),
        block('post-content', { layout: { type: 'constrained' } }),
        block('post-terms', { term: 'post_tag' }),
        separator,
        pattern(`${slug}/post-navigation`),
        comments(),
      ].join('\n'),
    ),
    'templates/404.html': wrap(pattern(`${slug}/404`)),
  };
}
