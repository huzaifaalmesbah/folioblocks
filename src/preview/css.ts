/**
 * Turns the generated theme.json into CSS for the quick preview, the way
 * WordPress' global styles do (presets as custom properties, root and
 * element styles, per-block styles, layout rules). It covers what our
 * themes use, not every theme.json feature.
 */

type Json = Record<string, unknown>;
type Obj = Record<string, unknown>;

/** WordPress' block-library styles, from a fixed release. */
export const BLOCK_LIBRARY_CSS = 'https://cdn.jsdelivr.net/npm/@wordpress/block-library@12.0.0/build-style/style.css';

/** "var:preset|color|base" → "var(--wp--preset--color--base)". */
function value(v: unknown): string {
  const s = String(v);
  const m = /^var:preset\|([a-z-]+)\|(.+)$/.exec(s);
  return m ? `var(--wp--preset--${m[1]}--${m[2]})` : s;
}

/** "2.5rem" or "40px" → pixels (1rem = 16px). */
function px(size: string): number {
  const n = parseFloat(size);
  return size.endsWith('rem') || size.endsWith('em') ? n * 16 : n;
}

/**
 * WordPress' fluid type: grows linearly from `min` at a 320px viewport to
 * `max` at 1600px (wp_get_typography_font_size_value's defaults).
 */
function fluidSize(min: string, max: string): string {
  const [lo, hi] = [px(min), px(max)];
  const slope = (hi - lo) / (1600 - 320);
  const intercept = lo - slope * 320;
  return `clamp(${min}, ${intercept.toFixed(3)}px + ${(slope * 100).toFixed(3)}vw, ${max})`;
}

const kebab = (s: string) => s.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);

/** Typography / color / spacing / border objects from theme.json → CSS declarations. */
function declarations(style: Obj | undefined): string[] {
  if (!style) return [];
  const out: string[] = [];
  const color = style.color as Obj | undefined;
  if (color?.text) out.push(`color: ${value(color.text)}`);
  if (color?.background) out.push(`background-color: ${value(color.background)}`);
  const typography = style.typography as Obj | undefined;
  for (const [k, v] of Object.entries(typography ?? {})) out.push(`${kebab(k)}: ${value(v)}`);
  const border = style.border as Obj | undefined;
  if (border?.radius) out.push(`border-radius: ${value(border.radius)}`);
  if (border?.width) out.push(`border-width: ${value(border.width)}`);
  const spacing = style.spacing as Obj | undefined;
  const padding = spacing?.padding as Obj | undefined;
  for (const [k, v] of Object.entries(padding ?? {})) out.push(`padding-${k}: ${value(v)}`);
  const outline = style.outline as Obj | undefined;
  for (const [k, v] of Object.entries(outline ?? {})) out.push(`outline-${k}: ${value(v)}`);
  return out;
}

function rule(selector: string, decls: string[]): string {
  return decls.length ? `${selector} { ${decls.join('; ')}; }` : '';
}

/** Rules for an element, including its :hover / :focus states. */
function stateRules(selector: string, style: Obj): string[] {
  const out = [rule(selector, declarations(style))];
  for (const state of [':hover', ':focus', ':focus-visible', ':active']) {
    if (style[state]) out.push(rule(selector.split(',').map((s) => `${s.trim()}${state}`).join(', '), declarations(style[state] as Obj)));
  }
  return out;
}

const ELEMENT_SELECTORS: Record<string, string> = {
  heading: 'h1, h2, h3, h4, h5, h6',
  link: 'a:where(:not(.wp-element-button))',
  button: '.wp-element-button, .wp-block-button__link',
};

const BLOCK_SELECTORS: Record<string, string> = {
  'core/site-title': '.wp-block-site-title',
  'core/post-date': '.wp-block-post-date',
  'core/post-terms': '.wp-block-post-terms',
  'core/separator': '.wp-block-separator',
};

export function themeCss(themeJsonText: string, fontUrl: (themePath: string) => string): string {
  const json = JSON.parse(themeJsonText) as Json;
  const settings = (json.settings ?? {}) as Obj;
  const styles = (json.styles ?? {}) as Obj;
  const css: string[] = [];

  // Fonts.
  const typography = (settings.typography ?? {}) as Obj;
  const families = (typography.fontFamilies ?? []) as Obj[];
  for (const family of families) {
    for (const face of (family.fontFace ?? []) as Obj[]) {
      const src = ((face.src ?? []) as string[]).map((s) => `url("${fontUrl(s.replace(/^file:\.\//, ''))}") format("woff2")`);
      css.push(
        `@font-face { font-family: "${face.fontFamily}"; font-style: ${face.fontStyle ?? 'normal'}; font-weight: ${face.fontWeight ?? '400'}; font-display: swap; src: ${src.join(', ')}; }`,
      );
    }
  }

  // Presets as custom properties.
  const vars: string[] = [];
  for (const c of ((settings.color as Obj)?.palette ?? []) as Obj[]) vars.push(`--wp--preset--color--${c.slug}: ${c.color}`);
  for (const f of families) vars.push(`--wp--preset--font-family--${f.slug}: ${f.fontFamily}`);
  for (const s of (typography.fontSizes ?? []) as Obj[]) {
    const fluid = s.fluid as Obj | false | undefined;
    vars.push(`--wp--preset--font-size--${s.slug}: ${fluid ? fluidSize(String(fluid.min), String(fluid.max)) : s.size}`);
  }
  for (const s of ((settings.spacing as Obj)?.spacingSizes ?? []) as Obj[]) vars.push(`--wp--preset--spacing--${s.slug}: ${s.size}`);
  const layout = (settings.layout ?? {}) as Obj;
  const rootStyles = (styles.spacing ?? {}) as Obj;
  const rootPadding = (rootStyles.padding ?? {}) as Obj;
  vars.push(`--wp--style--global--content-size: ${layout.contentSize ?? '720px'}`);
  vars.push(`--wp--style--global--wide-size: ${layout.wideSize ?? '1280px'}`);
  vars.push(`--wp--style--root--padding-left: ${value(rootPadding.left ?? '0')}`);
  vars.push(`--wp--style--root--padding-right: ${value(rootPadding.right ?? '0')}`);
  vars.push(`--wp--style--block-gap: ${value(rootStyles.blockGap ?? '1.5rem')}`);
  css.push(`:root { ${vars.join('; ')}; }`);

  // Preset utility classes.
  for (const c of ((settings.color as Obj)?.palette ?? []) as Obj[]) {
    css.push(`.has-${c.slug}-color { color: var(--wp--preset--color--${c.slug}) !important; }`);
    css.push(`.has-${c.slug}-background-color { background-color: var(--wp--preset--color--${c.slug}) !important; }`);
  }
  for (const s of (typography.fontSizes ?? []) as Obj[]) css.push(`.has-${s.slug}-font-size { font-size: var(--wp--preset--font-size--${s.slug}) !important; }`);
  for (const f of families) css.push(`.has-${f.slug}-font-family { font-family: var(--wp--preset--font-family--${f.slug}) !important; }`);

  // Root, elements and blocks.
  // Root padding goes on top-level containers (useRootPaddingAwareAlignments), not on body.
  css.push(rule('body', [...declarations({ ...styles, spacing: undefined }), 'margin: 0']));
  const elements = (styles.elements ?? {}) as Obj;
  for (const [name, style] of Object.entries(elements)) {
    const selector = ELEMENT_SELECTORS[name] ?? name;
    css.push(...stateRules(selector, style as Obj));
  }
  for (const [name, style] of Object.entries((styles.blocks ?? {}) as Obj)) {
    const selector = BLOCK_SELECTORS[name];
    if (selector) css.push(...stateRules(selector, style as Obj));
  }

  // Layout: what WordPress outputs for constrained, flow, flex and grid layouts.
  css.push(`
    .wp-site-blocks > * { padding-left: var(--wp--style--root--padding-left); padding-right: var(--wp--style--root--padding-right); }
    .wp-site-blocks .alignfull { margin-left: calc(-1 * var(--wp--style--root--padding-left)) !important; margin-right: calc(-1 * var(--wp--style--root--padding-right)) !important; max-width: none !important; width: auto; padding-left: var(--wp--style--root--padding-left); padding-right: var(--wp--style--root--padding-right); }
    .alignfull .alignfull { margin-left: 0 !important; margin-right: 0 !important; }
    .is-layout-constrained > :where(:not(.alignleft):not(.alignright):not(.alignfull)) { max-width: var(--wp--style--global--content-size); margin-left: auto !important; margin-right: auto !important; }
    .is-layout-constrained > .alignwide { max-width: var(--wp--style--global--wide-size); }
    :where(.is-layout-flow, .is-layout-constrained) > * { margin-block-start: 0; margin-block-end: 0; }
    :where(.is-layout-flow, .is-layout-constrained) > * + * { margin-block-start: var(--wp--style--block-gap); }
    .is-layout-flex { display: flex; flex-wrap: wrap; align-items: center; gap: var(--wp--style--block-gap); }
    .is-layout-flex > * { margin: 0; }
    .is-layout-grid { display: grid; gap: var(--wp--style--block-gap); }
    .wp-block-columns.is-layout-flex { align-items: normal; }
    .wp-block-post-template { list-style: none; padding: 0; margin: 0; }
    .wp-block-post-template > li + li { margin-top: var(--wp--style--block-gap); }
    .wp-block-post-template.is-layout-grid > li + li { margin-top: 0; }
    @media (max-width: 600px) { .wp-block-post-template.is-layout-grid { grid-template-columns: 1fr !important; } }
    .wp-block-navigation__container { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; gap: 1.5rem; }
    .wp-block-navigation a { color: inherit; text-decoration: none; }
    .wp-block-site-title a { color: inherit; text-decoration: none; }
    .wp-block-social-links { list-style: none; padding: 0; }
    .wp-block-social-link-anchor { padding: 0.3em 0.8em; border: 1px solid currentColor; border-radius: 9999px; color: inherit !important; text-decoration: none; font-size: var(--wp--preset--font-size--small, 0.875rem); }
    main { display: block; }
  `);

  return css.filter(Boolean).join('\n');
}
