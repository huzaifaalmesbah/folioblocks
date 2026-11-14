/** Turn a name into a WordPress-safe theme slug, e.g. "Jane Doe" → "jane-doe-portfolio". */
export function themeSlug(name: string): string {
  const base = name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
  return `${base || 'my'}-portfolio`;
}

/** Escape a value for use inside a single-quoted PHP string literal. */
export function phpString(value: string): string {
  return `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
}

/** Drop characters that are never valid in a URL we write into markup. */
export function cleanUrl(url: string): string {
  return url.trim().replace(/["'\\<>\s]/g, '');
}

/** Escape text for a plain-text file context such as a comment header. */
export function headerSafe(value: string): string {
  return value.replace(/\*\//g, '').replace(/[\r\n]+/g, ' ').trim();
}

/** Helpers that print user content safely from inside a PHP pattern file. */
export function makePhp(textDomain: string) {
  return {
    /** Translatable, escaped text. */
    t: (text: string) =>
      `<?php echo esc_html__( ${phpString(text)}, ${phpString(textDomain)} ); ?>`,
    /** Escaped URL. */
    url: (url: string) => `<?php echo esc_url( ${phpString(cleanUrl(url))} ); ?>`,
    /** URL of a file in the theme, e.g. assets/images/avatar.webp (Ipsum's way: works from child themes too). */
    themeFile: (path: string) => `<?php echo esc_url( get_parent_theme_file_uri( ${phpString(path)} ) ); ?>`,
    /**
     * Translatable text with simple HTML (links) kept, as Ipsum recommends:
     * clearer for translators than sprintf(), and they can drop the markup.
     */
    html: (text: string) => `<?php echo wp_kses_post( __( ${phpString(text)}, ${phpString(textDomain)} ) ); ?>`,
    /** Translatable text for an HTML attribute or a block attribute. */
    attr: (text: string) => `<?php echo esc_attr__( ${phpString(text)}, ${phpString(textDomain)} ); ?>`,
    /** Translatable block name, shown in the List View (metadata.name). */
    name: (text: string) =>
      `<?php echo esc_html_x( ${phpString(text)}, 'Block name shown in the List View', ${phpString(textDomain)} ); ?>`,
  };
}

export type Php = ReturnType<typeof makePhp>;
