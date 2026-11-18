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
  /** A border all round in a palette colour, e.g. { color: 'accent-6', width: '1px' }. */
  border?: { color: string; width: string };
  /** A border on the left side only (a timeline line). */
  borderLeft?: { color: string; width: string };
  /** A border on the top side only (a rule above a footer). */
  borderTop?: { color: string; width: string };
  /** A shadow preset slug. */
  shadow?: string;
  /** A gradient preset slug. */
  gradient?: string;
  minHeight?: string;
  /** Top margin as CSS, may be negative (an overlapping photo). */
  marginTop?: string;
  /** Space between the children, as CSS ('0' for none). */
  blockGap?: string;
  /** Rounded top corners only, e.g. a banner at the top of a card. */
  radiusTop?: string;
  /** No padding at all, even if a block style gives the group some. */
  noPadding?: boolean;
  /** Span inside a grid layout parent. */
  span?: { columns?: number; rows?: number };
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
  const border: Attrs = {};
  if (opts.radius && opts.radius !== '0') {
    border.radius = opts.radius;
    styles.push(`border-radius:${opts.radius}`);
  }
  if (opts.radiusTop) {
    border.radius = { topLeft: opts.radiusTop, topRight: opts.radiusTop };
    styles.push(`border-top-left-radius:${opts.radiusTop}`, `border-top-right-radius:${opts.radiusTop}`);
  }
  if (opts.border) {
    attrs.borderColor = opts.border.color;
    border.width = opts.border.width;
    styles.push(`border-width:${opts.border.width}`);
  }
  if (opts.borderLeft) {
    border.left = { color: `var:preset|color|${opts.borderLeft.color}`, width: opts.borderLeft.width };
    styles.push(`border-left-color:var(--wp--preset--color--${opts.borderLeft.color})`, `border-left-width:${opts.borderLeft.width}`);
  }
  if (opts.borderTop) {
    border.top = { color: `var:preset|color|${opts.borderTop.color}`, width: opts.borderTop.width };
    styles.push(`border-top-color:var(--wp--preset--color--${opts.borderTop.color})`, `border-top-width:${opts.borderTop.width}`);
  }
  if (Object.keys(border).length) style.border = border;
  if (opts.shadow) {
    style.shadow = `var:preset|shadow|${opts.shadow}`;
    styles.push(`box-shadow:var(--wp--preset--shadow--${opts.shadow})`);
  }
  if (opts.minHeight) {
    style.dimensions = { minHeight: opts.minHeight };
    styles.push(`min-height:${opts.minHeight}`);
  }
  if (opts.span) {
    style.layout = {
      ...(opts.span.columns && { columnSpan: opts.span.columns }),
      ...(opts.span.rows && { rowSpan: opts.span.rows }),
    };
  }
  const spacingStyle: Attrs = {};
  if (opts.noMargin) {
    spacingStyle.margin = { top: '0', bottom: '0' };
    styles.push('margin-top:0', 'margin-bottom:0');
  } else if (opts.marginTop) {
    spacingStyle.margin = { top: opts.marginTop };
    styles.push(`margin-top:${opts.marginTop}`);
  }
  if (opts.blockGap !== undefined) spacingStyle.blockGap = opts.blockGap;
  if (opts.noPadding) {
    spacingStyle.padding = { top: '0', right: '0', bottom: '0', left: '0' };
    styles.push('padding-top:0', 'padding-right:0', 'padding-bottom:0', 'padding-left:0');
  } else if (opts.pad) {
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
  if (opts.gradient) {
    attrs.gradient = opts.gradient;
    classes.push(`has-${opts.gradient}-gradient-background`);
  }
  if (opts.border) classes.push('has-border-color', `has-${opts.border.color}-border-color`);
  if (opts.textColor) classes.push('has-text-color');
  if (opts.background || opts.gradient) classes.push('has-background');
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

/** An inline text colour, the way the editor's Highlight format saves it. */
export function inlineColor(html: string, colorSlug: string): string {
  return `<mark style="background-color:rgba(0, 0, 0, 0)" class="has-inline-color has-${colorSlug}-color">${html}</mark>`;
}

/** A paragraph in a preset font size, e.g. 'xx-large' for a big number. */
export function sizedParagraph(html: string, fontSize: string): string {
  return block('paragraph', { fontSize }, `<p class="has-${fontSize}-font-size">${html}</p>`);
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
export function badge(html: string, radius: string, background = 'accent-5'): string {
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
    { backgroundColor: background, fontSize: 'small', style },
    `<p class="has-${background}-background-color has-background has-small-font-size" style="${css.join(';')}">${html}</p>`,
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
  /** A border in a palette colour, saved on the <img> as the editor does. */
  border?: { color: string; width: string };
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
  const border: Attrs = {};
  if (opts.rounded) {
    // A block-level radius, saved inline, so it wins over the theme.json image radius.
    border.radius = '9999px';
    styles.push('border-radius:9999px');
  }
  if (opts.border) {
    attrs.borderColor = opts.border.color;
    border.width = opts.border.width;
    styles.push(`border-width:${opts.border.width}`);
  }
  if (Object.keys(border).length) attrs.style = { border };
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
  if (opts.rounded || opts.border) classes.push('has-custom-border');
  const style = styles.length ? ` style="${styles.join(';')}"` : '';
  const imgClass = opts.border ? ` class="has-border-color has-${opts.border.color}-border-color"` : '';
  return block('image', attrs, `<figure class="${classes.join(' ')}"><img src="${src}" alt="${alt}"${imgClass}${style}/></figure>`);
}

/** A core Quote block: the words, then who said them. */
export function quote(textHtml: string, citeHtml: string): string {
  return block(
    'quote',
    undefined,
    wrap('<blockquote class="wp-block-quote">', paragraph(textHtml), `<cite>${citeHtml}</cite></blockquote>`),
  );
}
