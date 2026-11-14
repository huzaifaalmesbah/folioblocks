/**
 * Tiny helpers that print core block markup exactly the way the block
 * editor serializes it, so the editor never flags blocks as invalid.
 */

type Attrs = Record<string, unknown>;

/** Serialize block attributes like WordPress does (escapes `--`, `<`, `>`, `&`). */
function serializeAttrs(attrs?: Attrs): string {
  if (!attrs || Object.keys(attrs).length === 0) return '';
  const json = JSON.stringify(attrs)
    .replace(/--/g, '\\u002d\\u002d')
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');
  return ` ${json}`;
}

export function block(name: string, attrs?: Attrs, inner?: string): string {
  const a = serializeAttrs(attrs);
  if (inner === undefined) return `<!-- wp:${name}${a} /-->`;
  return `<!-- wp:${name}${a} -->\n${inner}\n<!-- /wp:${name} -->`;
}

const spacing = (size: number) => `var:preset|spacing|${size}`;
const spacingCss = (size: number) => `var(--wp--preset--spacing--${size})`;

type GroupOpts = {
  tagName?: 'div' | 'section' | 'main' | 'header' | 'footer';
  align?: 'full' | 'wide';
  padY?: number;
  background?: string;
  layout?: Attrs;
  anchor?: string;
};

export function group(inner: string, opts: GroupOpts = {}): string {
  const tag = opts.tagName ?? 'div';
  const attrs: Attrs = {};
  const classes = ['wp-block-group'];
  const styles: string[] = [];

  if (opts.anchor) attrs.anchor = opts.anchor;
  if (tag !== 'div') attrs.tagName = tag;
  if (opts.align) {
    attrs.align = opts.align;
    classes.push(`align${opts.align}`);
  }
  if (opts.padY) {
    attrs.style = {
      spacing: { padding: { top: spacing(opts.padY), bottom: spacing(opts.padY) } },
    };
    styles.push(
      `padding-top:${spacingCss(opts.padY)}`,
      `padding-bottom:${spacingCss(opts.padY)}`,
    );
  }
  if (opts.background) {
    attrs.backgroundColor = opts.background;
    classes.push(`has-${opts.background}-background-color`, 'has-background');
  }
  attrs.layout = opts.layout ?? { type: 'constrained' };

  const style = styles.length ? ` style="${styles.join(';')}"` : '';
  const id = opts.anchor ? ` id="${opts.anchor}"` : '';
  return block(
    'group',
    attrs,
    `<${tag}${id} class="${classes.join(' ')}"${style}>\n${inner}\n</${tag}>`,
  );
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

export function buttons(items: { label: string; href: string }[], center = false): string {
  const inner = items
    .map((b) =>
      block(
        'button',
        undefined,
        `<div class="wp-block-button"><a class="wp-block-button__link wp-element-button" href="${b.href}">${b.label}</a></div>`,
      ),
    )
    .join('\n');
  const attrs = center ? { layout: { type: 'flex', justifyContent: 'center' } } : undefined;
  return block('buttons', attrs, `<div class="wp-block-buttons">\n${inner}\n</div>`);
}

export function list(itemsHtml: string[]): string {
  const inner = itemsHtml.map((i) => block('list-item', undefined, `<li>${i}</li>`)).join('\n');
  return block('list', undefined, `<ul class="wp-block-list">\n${inner}\n</ul>`);
}

export function columns(cols: string[]): string {
  const inner = cols
    .map((c) => block('column', undefined, `<div class="wp-block-column">\n${c}\n</div>`))
    .join('\n');
  return block('columns', undefined, `<div class="wp-block-columns">\n${inner}\n</div>`);
}

/** A pattern reference, e.g. inside a template. */
export function pattern(slug: string): string {
  return block('pattern', { slug });
}

export function templatePart(slug: string, tagName: 'header' | 'footer'): string {
  return block('template-part', { slug, tagName });
}
