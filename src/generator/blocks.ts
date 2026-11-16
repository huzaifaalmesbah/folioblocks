/**
 * Tiny helpers that print core block markup the way the block editor
 * serializes it (Gutenberg's own format, as Ipsum keeps it): one delimiter
 * per line, a blank line between sibling blocks, and a wrapper element on
 * the same line as its first child. Matching the serializer keeps blocks
 * valid and means an editor round-trip changes nothing.
 */

type Attrs = Record<string, unknown>;

const PHP_SPAN = /<\?php[\s\S]*?\?>/g;

/**
 * Serialize block attributes like WordPress does (escapes `--`, `<`, `>`, `&`),
 * but keep PHP spans such as `<?php echo esc_html_x( … ); ?>` intact, so
 * attributes like a block name or a URL can still be translated or escaped.
 */
function serializeAttrs(attrs?: Attrs): string {
  if (!attrs || Object.keys(attrs).length === 0) return '';
  const spans: string[] = [];
  const tokenized = JSON.stringify(attrs, (_key, value) =>
    typeof value === 'string'
      ? value.replace(PHP_SPAN, (php) => `\u0001${spans.push(php) - 1}\u0001`)
      : value,
  );
  const json = tokenized
    .replace(/--/g, '\\u002d\\u002d')
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\\u0001(\d+)\\u0001/g, (_m, i) => spans[Number(i)]);
  return ` ${json}`;
}

/** Join sibling blocks the way the serializer does: a blank line between them. */
export function join(...parts: (string | false | undefined | null)[]): string {
  return parts.filter(Boolean).join('\n\n');
}

/**
 * A block. `html` is the saved HTML of a leaf block, or for a container its
 * wrapper with the children already inside (see `wrap`).
 */
export function block(name: string, attrs?: Attrs, html?: string): string {
  const a = serializeAttrs(attrs);
  if (html === undefined) return `<!-- wp:${name}${a} /-->`;
  return `<!-- wp:${name}${a} -->\n${html}\n<!-- /wp:${name} -->`;
}

/** Wrap child blocks in an element: `<div class="…"><!-- wp:child -->…</div>`. */
function wrap(open: string, children: string, close: string): string {
  return `${open}${children}${close}`;
}

const spacing = (size: number) => `var:preset|spacing|${size}`;
const spacingCss = (size: number) => `var(--wp--preset--spacing--${size})`;

type GroupOpts = {
  /** List View name. May hold PHP (e.g. a translated string). */
  name?: string;
  tagName?: 'div' | 'section' | 'main' | 'header' | 'footer';
  align?: 'full' | 'wide';
  padY?: number;
  background?: string;
  /** Text colour slug, for sections on a dark or coloured ground. */
  textColor?: string;
  layout?: Attrs;
  anchor?: string;
  className?: string;
  /** Padding on all four sides (spacing preset number). Overrides padY. */
  pad?: number;
  /** Border radius CSS value, e.g. "10px". */
  radius?: string;
  /** Zero the top and bottom margin, as templates do for <main>. */
  noMargin?: boolean;
};

export function group(children: string, opts: GroupOpts = {}): string {
  const tag = opts.tagName ?? 'div';
  const attrs: Attrs = {};
  const classes = ['wp-block-group'];
  const styles: string[] = [];

  if (opts.anchor) attrs.anchor = opts.anchor;
  if (tag !== 'div') attrs.tagName = tag;
  if (opts.name) attrs.metadata = { name: opts.name };
  if (opts.className) {
    attrs.className = opts.className;
    classes.push(opts.className);
  }
  if (opts.align) {
    attrs.align = opts.align;
    classes.push(`align${opts.align}`);
  }

  const style: Attrs = {};
  if (opts.radius && opts.radius !== '0') {
    style.border = { radius: opts.radius };
    styles.push(`border-radius:${opts.radius}`);
  }
  const spacingStyle: Attrs = {};
  if (opts.noMargin) {
    spacingStyle.margin = { top: '0', bottom: '0' };
    styles.push('margin-top:0', 'margin-bottom:0');
  }
  if (opts.pad) {
    const v = spacing(opts.pad);
    spacingStyle.padding = { top: v, right: v, bottom: v, left: v };
    for (const side of ['top', 'right', 'bottom', 'left']) styles.push(`padding-${side}:${spacingCss(opts.pad)}`);
  } else if (opts.padY) {
    spacingStyle.padding = { top: spacing(opts.padY), bottom: spacing(opts.padY) };
    styles.push(`padding-top:${spacingCss(opts.padY)}`, `padding-bottom:${spacingCss(opts.padY)}`);
  }
  if (Object.keys(spacingStyle).length) style.spacing = spacingStyle;
  if (Object.keys(style).length) attrs.style = style;
  // Class order follows the editor's save: colour classes first, then the has-* flags.
  if (opts.textColor) {
    attrs.textColor = opts.textColor;
    classes.push(`has-${opts.textColor}-color`);
  }
  if (opts.background) {
    attrs.backgroundColor = opts.background;
    classes.push(`has-${opts.background}-background-color`);
  }
  if (opts.textColor) classes.push('has-text-color');
  if (opts.background) classes.push('has-background');
  attrs.layout = opts.layout ?? { type: 'constrained' };

  const styleAttr = styles.length ? ` style="${styles.join(';')}"` : '';
  const id = opts.anchor ? ` id="${opts.anchor}"` : '';
  return block('group', attrs, wrap(`<${tag}${id} class="${classes.join(' ')}"${styleAttr}>`, children, `</${tag}>`));
}

export function heading(html: string, level = 2, center = false): string {
  const attrs: Attrs = {};
  const classes = ['wp-block-heading'];
  if (center) {
    attrs.textAlign = 'center';
    classes.push('has-text-align-center');
  }
  if (level !== 2) attrs.level = level;
  return block('heading', attrs, `<h${level} class="${classes.join(' ')}">${html}</h${level}>`);
}

export function paragraph(html: string, center = false): string {
  if (center) {
    return block('paragraph', { align: 'center' }, `<p class="has-text-align-center">${html}</p>`);
  }
  return block('paragraph', undefined, `<p>${html}</p>`);
}

/** Small, weight-600 text, as Ipsum's "meta voice" (dates, labels, separators). */
export function metaText(html: string, name?: string): string {
  const attrs: Attrs = {};
  if (name) attrs.metadata = { name };
  attrs.style = { typography: { fontStyle: 'normal', fontWeight: '600' } };
  attrs.fontSize = 'small';
  return block('paragraph', attrs, `<p class="has-small-font-size" style="font-style:normal;font-weight:600">${html}</p>`);
}

export function buttons(items: { label: string; href: string }[], center = false): string {
  const children = join(
    ...items.map((b) =>
      block(
        'button',
        undefined,
        `<div class="wp-block-button"><a class="wp-block-button__link wp-element-button" href="${b.href}">${b.label}</a></div>`,
      ),
    ),
  );
  const attrs = center ? { layout: { type: 'flex', justifyContent: 'center' } } : undefined;
  return block('buttons', attrs, wrap('<div class="wp-block-buttons">', children, '</div>'));
}

export function list(itemsHtml: string[]): string {
  const children = join(...itemsHtml.map((i) => block('list-item', undefined, `<li>${i}</li>`)));
  return block('list', undefined, wrap('<ul class="wp-block-list">', children, '</ul>'));
}

export function columns(cols: string[], opts: { verticalAlignment?: 'center' } = {}): string {
  const children = join(...cols.map((c) => block('column', undefined, wrap('<div class="wp-block-column">', c, '</div>'))));
  if (opts.verticalAlignment) {
    const cls = `wp-block-columns are-vertically-aligned-${opts.verticalAlignment}`;
    return block('columns', { verticalAlignment: opts.verticalAlignment }, wrap(`<div class="${cls}">`, children, '</div>'));
  }
  return block('columns', undefined, wrap('<div class="wp-block-columns">', children, '</div>'));
}

export function separator(): string {
  return block('separator', undefined, '<hr class="wp-block-separator has-alpha-channel-opacity"/>');
}

/** A pattern reference, e.g. inside a template. */
export function pattern(slug: string): string {
  return block('pattern', { slug });
}

/** A template part. The area comes from `templateParts` in theme.json, so the slug is enough. */
export function templatePart(slug: string): string {
  return block('template-part', { slug });
}

/** A container whose saved HTML is just a wrapper around its children (query, comments…). */
export function container(name: string, attrs: Attrs | undefined, tag: string, className: string, children: string): string {
  return block(name, attrs, wrap(`<${tag} class="${className}">`, children, `</${tag}>`));
}

/** A small pill-shaped label, e.g. for a skill, on the Surface colour. */
export function badge(html: string, radius: string): string {
  const pad = { top: spacing(20), right: spacing(30), bottom: spacing(20), left: spacing(30) };
  const style: Attrs = { spacing: { padding: pad } };
  const css: string[] = [];
  if (radius !== '0') {
    style.border = { radius };
    css.push(`border-radius:${radius}`);
  }
  css.push(
    `padding-top:${spacingCss(20)}`,
    `padding-right:${spacingCss(30)}`,
    `padding-bottom:${spacingCss(20)}`,
    `padding-left:${spacingCss(30)}`,
  );
  return block(
    'paragraph',
    { backgroundColor: 'accent-5', fontSize: 'small', style },
    `<p class="has-accent-5-background-color has-background has-small-font-size" style="${css.join(';')}">${html}</p>`,
  );
}

type ImageOpts = {
  /** CSS aspect ratio, e.g. "3/2", "1", "4/5", "21/9". Crops with object-fit: cover. */
  aspectRatio?: string;
  /** Fixed width, e.g. "160px". */
  width?: string;
  align?: 'center' | 'wide' | 'full';
  /** A circle (for square images), via a 9999px corner radius on the block. */
  rounded?: boolean;
};

/**
 * A core Image block, saved the way the editor saves it. `src` and `alt` may
 * hold PHP (a theme file URL, translated alt text). Corner radius comes from
 * theme.json, not the block, as Ipsum recommends.
 */
export function image(src: string, alt: string, opts: ImageOpts = {}): string {
  const attrs: Attrs = {};
  const classes = ['wp-block-image'];
  const styles: string[] = [];
  if (opts.rounded) {
    // A block-level radius, saved inline, so it wins over the theme.json image radius.
    attrs.style = { border: { radius: '9999px' } };
    styles.push('border-radius:9999px');
  }
  if (opts.width) {
    attrs.width = opts.width;
  }
  if (opts.aspectRatio) {
    attrs.aspectRatio = opts.aspectRatio;
    attrs.scale = 'cover';
    styles.push(`aspect-ratio:${opts.aspectRatio}`, 'object-fit:cover');
  }
  if (opts.width) styles.push(`width:${opts.width}`);
  attrs.sizeSlug = 'large';
  attrs.linkDestination = 'none';
  if (opts.align) {
    attrs.align = opts.align;
    classes.push(`align${opts.align}`);
  }
  classes.push('size-large');
  if (opts.width) classes.push('is-resized');
  if (opts.rounded) classes.push('has-custom-border');
  const style = styles.length ? ` style="${styles.join(';')}"` : '';
  return block('image', attrs, `<figure class="${classes.join(' ')}"><img src="${src}" alt="${alt}"${style}/></figure>`);
}

/** A core Quote block: the words, then who said them. */
export function quote(textHtml: string, citeHtml: string): string {
  return block(
    'quote',
    undefined,
    wrap('<blockquote class="wp-block-quote">', paragraph(textHtml), `<cite>${citeHtml}</cite></blockquote>`),
  );
}
