import { fontAssets, fontDef } from '../fonts';
import type { BuilderState, ThemeFiles } from '../types';
import { block, group, pattern } from './blocks';
import { patterns } from './patterns';
import { templates } from './templates';
import { themeJson } from './themeJson';
import { headerSafe, themeSlug } from './utils';

export { themeSlug };

function styleCss(state: BuilderState, slug: string): string {
  const name = headerSafe(state.info.name) || 'My';
  return `/*
Theme Name: ${name} Portfolio
Author: ${name}
Description: A personal portfolio block theme for ${name}, made with FolioBlocks.
Requires at least: 6.6
Tested up to: 6.9
Requires PHP: 7.4
Version: 1.0.0
License: GNU General Public License v2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html
Text Domain: ${slug}
Tags: portfolio, blog, block-patterns, full-site-editing, one-column, custom-colors
*/
`;
}

function resources(state: BuilderState): string {
  const keys = [...new Set([state.style.fonts.heading, state.style.fonts.body])];
  const lines = keys
    .map(fontDef)
    .filter((f) => f.file)
    .map((f) => `* ${f.name}, SIL Open Font License 1.1, https://openfontlicense.org, source: https://fontsource.org`);
  return lines.length ? `${lines.join('\n')}\n` : '* No bundled third-party resources.\n';
}

function readme(state: BuilderState, slug: string): string {
  const name = headerSafe(state.info.name) || 'My';
  return `=== ${name} Portfolio ===
Contributors: ${slug.replace(/-portfolio$/, '').replace(/-/g, '')}
Requires at least: 6.6
Tested up to: 6.9
Requires PHP: 7.4
Stable tag: 1.0.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

A personal portfolio block theme, made with FolioBlocks.

== Description ==

A block theme with home, about, contact, blog and single post layouts.

== Installation ==

1. In your admin, go to Appearance > Themes > Add New Theme > Upload Theme.
2. Choose the zip file, click Install Now, then Activate.
3. Create the pages Home, About (template: About), Blog and Contact (template: Contact).
4. In Settings > Reading, choose "A static page": Homepage = Home, Posts page = Blog.

== Changelog ==

= 1.0.0 =
* Initial release.

== Resources ==
${resources(state)}
== Copyright ==

${name} Portfolio WordPress Theme, (C) ${new Date().getFullYear()} ${name}
${name} Portfolio is distributed under the terms of the GNU GPL v2 or later.
`;
}

function functionsPhp(slug: string): string {
  const fn = slug.replace(/-/g, '_');
  return `<?php
/**
 * Theme functions.
 *
 * @package ${slug}
 */

defined( 'ABSPATH' ) || exit;

if ( ! function_exists( '${fn}_setup' ) ) {
	/**
	 * Theme setup.
	 */
	function ${fn}_setup() {
		add_theme_support( 'editor-styles' );
		add_editor_style( 'style.css' );
	}
}
add_action( 'after_setup_theme', '${fn}_setup' );

/**
 * Enqueue the theme stylesheet.
 */
function ${fn}_enqueue_styles() {
	wp_enqueue_style( '${slug}-style', get_stylesheet_uri(), array(), wp_get_theme()->get( 'Version' ) );
}
add_action( 'wp_enqueue_scripts', '${fn}_enqueue_styles' );
`;
}

function parts(state: BuilderState, slug: string): ThemeFiles {
  const nav = (justify: string) =>
    block('navigation', { overlayMenu: 'mobile', layout: { type: 'flex', justifyContent: justify } });
  const inner =
    state.header === 'centered'
      ? group([block('site-title', { textAlign: 'center' }), nav('center')].join('\n'), {
          layout: { type: 'flex', orientation: 'vertical', justifyContent: 'center' },
        })
      : group([block('site-title'), nav('right')].join('\n'), {
          align: 'wide',
          layout: { type: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' },
        });
  return {
    'parts/header.html': group(inner, { padY: 30 }) + '\n',
    'parts/footer.html': pattern(`${slug}/footer`) + '\n',
  };
}

/** Generate every text file of the theme. Binary files (screenshot) are added by the zip step. */
export function generateTheme(state: BuilderState): { slug: string; files: ThemeFiles; assets: string[] } {
  const slug = themeSlug(state.info.name);
  const files: ThemeFiles = {
    'style.css': styleCss(state, slug),
    'theme.json': themeJson(state.style),
    'functions.php': functionsPhp(slug),
    'readme.txt': readme(state, slug),
    ...parts(state, slug),
    ...templates(slug),
    ...patterns(state, slug),
  };
  // Binary files the zip and Playground steps must add (bundled fonts).
  const assets = fontAssets([state.style.fonts.heading, state.style.fonts.body]);
  return { slug, files, assets };
}
