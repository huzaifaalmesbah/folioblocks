/**
 * The quick preview: renders the generated theme's block markup to HTML in
 * the browser, without WordPress. Static blocks use their saved HTML;
 * dynamic blocks (site title, navigation, query loops, post fields…) are
 * filled in from sample content. It's a close approximation, not WordPress;
 * "Open in WordPress Playground" shows the real thing.
 */
import { parse } from '@wordpress/block-serialization-default-parser';
import type { BuilderState, ThemeFiles } from '../types';
import { tr } from '../generator/i18n';
import { escapeHtml, renderPhp, type FileUrl } from './php';

export type PreviewPage = 'home' | 'about' | 'blog' | 'post' | 'contact';

export const PREVIEW_PAGES: { key: PreviewPage; label: string; template: string }[] = [
  { key: 'home', label: 'Home', template: 'front-page' },
  { key: 'about', label: 'About', template: 'page-about' },
  { key: 'blog', label: 'Blog', template: 'home' },
  { key: 'post', label: 'Post', template: 'single' },
  { key: 'contact', label: 'Contact', template: 'page-contact' },
];

/** A parsed block (the parser doesn't export its type). */
type ParsedBlock = ReturnType<typeof parse>[number];

type Post = { title: string; excerpt: string; date: string; image: number };

/** The same sample posts the Playground Blueprint creates. */
const SAMPLE_POSTS: Post[] = [
  {
    title: 'My first WordPress contribution',
    excerpt: 'How I found a good first ticket, set up wordpress-develop and opened my first patch.',
    date: 'November 13, 2026',
    image: 0,
  },
  {
    title: 'What I learned at my first WordCamp',
    excerpt: 'Notes from the talks, the contributor day and the people I met.',
    date: 'November 12, 2026',
    image: 1,
  },
  {
    title: 'Building a block theme from scratch',
    excerpt: 'theme.json, templates, template parts and patterns: what each one does.',
    date: 'November 11, 2026',
    image: 2,
  },
];

const SOCIAL_LABELS: Record<string, string> = { github: 'GitHub', linkedin: 'LinkedIn', x: 'X', wordpress: 'WordPress' };

type Ctx = {
  state: BuilderState;
  /** Pattern markup by slug, PHP already evaluated. */
  patterns: Map<string, string>;
  files: ThemeFiles;
  post?: Post;
  /** Extra CSS for per-block layout rules (gaps, widths), collected while rendering. */
  css: string[];
  /** Depth guard against a pattern including itself. */
  depth: number;
  /** URL of sample post thumbnail i. */
  sampleImage: (i: number) => string;
};

let containerId = 0;

/** Add classes (and optional inline style) to the first HTML element of `html`. */
function addToFirstTag(html: string, classes: string[], style = ''): string {
  if (!classes.length && !style) return html;
  return html.replace(/<([a-z][a-z0-9]*)([^>]*)>/i, (_m, tag: string, attrs: string) => {
    let a = attrs;
    if (classes.length) {
      a = /\sclass="/.test(a) ? a.replace(/\sclass="([^"]*)"/, (_c, v) => ` class="${v} ${classes.join(' ')}"`) : `${a} class="${classes.join(' ')}"`;
    }
    if (style) {
      a = /\sstyle="/.test(a) ? a.replace(/\sstyle="([^"]*)"/, (_s, v) => ` style="${v};${style}"`) : `${a} style="${style}"`;
    }
    return `<${tag}${a}>`;
  });
}

const JUSTIFY: Record<string, string> = { left: 'flex-start', right: 'flex-end', center: 'center', 'space-between': 'space-between', stretch: 'stretch' };

/** WordPress adds layout classes at render time; mirror the ones our themes use. */
function layoutClasses(block: ParsedBlock, ctx: Ctx): string[] {
  const name = block.blockName ?? '';
  const layout = (block.attrs?.layout ?? null) as Record<string, string | number> | null;
  const defaults: Record<string, Record<string, string>> = {
    'core/buttons': { type: 'flex' },
    'core/social-links': { type: 'flex' },
    'core/navigation': { type: 'flex' },
    'core/columns': { type: 'flex' },
  };
  const l = layout ?? defaults[name] ?? (name === 'core/group' || name === 'core/post-content' ? { type: 'flow' } : null);
  if (!l) return [];

  const id = `wp-container-${++containerId}`;
  const sel = `.${id}`;
  if (l.type === 'constrained') {
    if (l.contentSize) {
      ctx.css.push(
        `${sel} > :where(:not(.alignleft):not(.alignright):not(.alignfull)) { max-width: ${l.contentSize}; margin-left: auto !important; margin-right: auto !important; }`,
      );
    }
    return ['is-layout-constrained', id];
  }
  if (l.type === 'flex') {
    if (name === 'core/columns') return ['is-layout-flex'];
    const rules = [`flex-wrap: ${l.flexWrap === 'nowrap' ? 'nowrap' : 'wrap'}`];
    if (l.orientation === 'vertical') {
      rules.push('flex-direction: column');
      if (l.justifyContent) rules.push(`align-items: ${JUSTIFY[l.justifyContent as string] ?? 'flex-start'}`);
    } else {
      rules.push('align-items: center');
      if (l.justifyContent) rules.push(`justify-content: ${JUSTIFY[l.justifyContent as string] ?? 'flex-start'}`);
    }
    ctx.css.push(`${sel} { ${rules.join('; ')}; }`);
    return ['is-layout-flex', id];
  }
  if (l.type === 'grid') {
    ctx.css.push(`${sel} { grid-template-columns: repeat(${l.columnCount ?? 3}, minmax(0, 1fr)); }`);
    return ['is-layout-grid', id];
  }
  return ['is-layout-flow'];
}

/** Assemble a static block from its saved HTML and rendered children. */
function renderStatic(block: ParsedBlock, ctx: Ctx): string {
  let i = 0;
  const html = block.innerContent
    .map((part) => (part === null ? renderBlock(block.innerBlocks[i++], ctx) : part))
    .join('');
  return addToFirstTag(html.trim(), layoutClasses(block, ctx));
}

function renderChildren(blocks: ParsedBlock[], ctx: Ctx): string {
  return blocks.map((b) => renderBlock(b, ctx)).join('\n');
}

/** A link inside the preview that switches page. */
function navLink(page: PreviewPage, label: string): string {
  return `<a href="#" data-preview-page="${page}">${escapeHtml(label)}</a>`;
}

function renderDynamic(block: ParsedBlock, ctx: Ctx): string | null {
  const a = (block.attrs ?? {}) as Record<string, unknown>;
  const { info } = ctx.state;
  const post = ctx.post ?? SAMPLE_POSTS[0];
  const align = a.textAlign ? ` has-text-align-${a.textAlign}` : '';

  switch (block.blockName) {
    case 'core/pattern': {
      const content = ctx.patterns.get(String(a.slug));
      if (!content || ctx.depth > 8) return '';
      return renderMarkup(content, { ...ctx, depth: ctx.depth + 1 });
    }
    case 'core/template-part': {
      const part = ctx.files[`parts/${a.slug}.html`];
      if (!part) return '';
      const tag = a.slug === 'footer' ? 'footer' : 'header';
      return `<${tag} class="wp-block-template-part">${renderMarkup(part, ctx)}</${tag}>`;
    }
    case 'core/site-title':
      return `<p class="wp-block-site-title${align}">${navLink('home', info.name)}</p>`;
    case 'core/navigation': {
      const items = (['about', 'blog', 'contact', 'home'] as PreviewPage[])
        .map((p) => `<li class="wp-block-navigation-item">${navLink(p, tr(ctx.state.language, p[0].toUpperCase() + p.slice(1)))}</li>`)
        .join('');
      const nav = `<nav class="wp-block-navigation"><ul class="wp-block-navigation__container wp-block-navigation">${items}</ul></nav>`;
      return addToFirstTag(nav, layoutClasses(block, ctx));
    }
    case 'core/query': {
      const inner = renderChildren(block.innerBlocks, ctx);
      return `<div class="wp-block-query">${inner}</div>`;
    }
    case 'core/post-template': {
      const posts = SAMPLE_POSTS.map((p) => `<li class="wp-block-post">${renderChildren(block.innerBlocks, { ...ctx, post: p })}</li>`);
      return addToFirstTag(`<ul class="wp-block-post-template">${posts.join('')}</ul>`, layoutClasses(block, ctx));
    }
    case 'core/post-featured-image': {
      const src = ctx.sampleImage(post.image);
      if (!src) return '';
      const ratio = a.aspectRatio ? `aspect-ratio:${a.aspectRatio};` : '';
      const width = a.width ? ` style="width:${a.width}"` : '';
      const img = `<img src="${escapeHtml(src)}" alt="" style="${ratio}object-fit:cover;width:100%;height:100%"/>`;
      return `<figure class="wp-block-post-featured-image"${width}>${a.isLink ? `<a href="#" data-preview-page="post">${img}</a>` : img}</figure>`;
    }
    case 'core/query-no-results':
    case 'core/term-description':
    case 'core/comments-title':
    case 'core/comment-template':
    case 'core/comments-pagination':
      return '';
    case 'core/query-pagination':
      return '<nav class="wp-block-query-pagination"><span class="page-numbers current">1</span></nav>';
    case 'core/query-title':
      return `<h1 class="wp-block-query-title">${a.type === 'search' ? 'Search results' : 'Category: Learning'}</h1>`;
    case 'core/post-title': {
      const level = Number(a.level ?? 2);
      const inner = a.isLink ? navLink('post', post.title) : escapeHtml(post.title);
      return `<h${level} class="wp-block-post-title">${inner}</h${level}>`;
    }
    case 'core/post-date':
      return `<div class="wp-block-post-date"><time>${post.date}</time></div>`;
    case 'core/post-excerpt':
      return `<div class="wp-block-post-excerpt"><p class="wp-block-post-excerpt__excerpt">${escapeHtml(post.excerpt)}</p></div>`;
    case 'core/post-content':
      return addToFirstTag(
        `<div class="entry-content wp-block-post-content"><p>${escapeHtml(post.excerpt)}</p><p>This is where the post or page content goes. Write it in the block editor.</p></div>`,
        layoutClasses(block, ctx),
      );
    case 'core/post-terms': {
      const terms = a.term === 'post_tag' ? ['student', 'wordpress'] : ['Learning'];
      return `<div class="taxonomy-${a.term} wp-block-post-terms">${terms.map((t) => `<a href="#">${t}</a>`).join(', ')}</div>`;
    }
    case 'core/post-author-name':
      return `<div class="wp-block-post-author-name"><a href="#">${escapeHtml(info.name)}</a></div>`;
    case 'core/post-navigation-link': {
      const prev = a.type === 'previous';
      return `<div class="post-navigation-link-${prev ? 'previous' : 'next'} wp-block-post-navigation-link"><a href="#">${escapeHtml(String(a.label ?? (prev ? 'Previous' : 'Next')))}</a></div>`;
    }
    case 'core/comments':
      return `<div class="wp-block-comments"><h3>Leave a Reply</h3><p><textarea rows="4" style="width:100%" aria-label="Comment"></textarea></p><p class="form-submit wp-block-button"><button class="wp-block-button__link wp-element-button" type="button">Post Comment</button></p></div>`;
    case 'core/search':
      return `<form class="wp-block-search__button-outside wp-block-search__text-button wp-block-search" onsubmit="return false"><div class="wp-block-search__inside-wrapper"><input class="wp-block-search__input" type="search" aria-label="${escapeHtml(String(a.label ?? 'Search'))}"><button class="wp-block-search__button wp-element-button" type="button">${escapeHtml(String(a.buttonText ?? 'Search'))}</button></div></form>`;
    case 'core/social-links': {
      const links = block.innerBlocks.map((b) => renderBlock(b, ctx)).join('');
      return addToFirstTag(`<ul class="wp-block-social-links has-visible-labels">${links}</ul>`, layoutClasses(block, ctx));
    }
    case 'core/social-link': {
      const service = String(a.service ?? '');
      const label = SOCIAL_LABELS[service] ?? service;
      return `<li class="wp-social-link wp-social-link-${service} wp-block-social-link"><a class="wp-block-social-link-anchor" href="${String(a.url ?? '#')}" target="_blank" rel="noopener"><span class="wp-block-social-link-label">${escapeHtml(label)}</span></a></li>`;
    }
    default:
      return null;
  }
}

function renderBlock(block: ParsedBlock, ctx: Ctx): string {
  if (!block.blockName) return block.innerHTML.trim() ? block.innerHTML : '';
  return renderDynamic(block, ctx) ?? renderStatic(block, ctx);
}

function renderMarkup(markup: string, ctx: Ctx): string {
  return renderChildren(parse(markup), ctx);
}

/** Pattern bodies by slug (`theme/slug`), with their PHP evaluated. */
export function patternMap(files: ThemeFiles, fileUrl?: FileUrl): Map<string, string> {
  const map = new Map<string, string>();
  for (const [path, content] of Object.entries(files)) {
    if (!path.startsWith('patterns/')) continue;
    const slug = /^\s*\*\s*Slug:\s*(\S+)/m.exec(content)?.[1];
    if (slug) map.set(slug, renderPhp(content, fileUrl));
  }
  return map;
}

/** Render one preview page: the template's markup, resolved down to HTML, plus layout CSS. */
export function renderPage(
  state: BuilderState,
  files: ThemeFiles,
  page: PreviewPage,
  opts: { patterns?: Map<string, string>; fileUrl?: FileUrl; sampleImage?: (i: number) => string } = {},
): { html: string; css: string } {
  const template = PREVIEW_PAGES.find((p) => p.key === page)!.template;
  const ctx: Ctx = {
    state,
    files,
    patterns: opts.patterns ?? patternMap(files, opts.fileUrl),
    css: [],
    depth: 0,
    post: page === 'post' ? SAMPLE_POSTS[0] : undefined,
    sampleImage: opts.sampleImage ?? (() => ''),
  };
  const html = renderMarkup(files[`templates/${template}.html`] ?? '', ctx);
  return { html, css: ctx.css.join('\n') };
}

