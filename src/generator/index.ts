import { fontAssets, fontDef, type ThemeAsset } from '../fonts';
import type { BuilderState, ThemeFiles } from '../types';
import { patterns } from './patterns';
import { colorVariations, themeJson } from './themeJson';
import { headerSafe, themeSlug } from './utils';

export { themeSlug };

/**
 * The WordPress versions generated themes support. Requires at least also
 * picks the theme.json schema our validator checks against.
 */
export const REQUIRES_AT_LEAST = '6.8';
export const TESTED_UP_TO = '7.1';

function styleCss(state: BuilderState, slug: string): string {
  const name = headerSafe(state.info.name) || 'My';
  return `/*
Theme Name: ${name} Portfolio
Author: ${name}
Description: A personal portfolio block theme for ${name}, made with FolioBlocks.
Requires at least: ${REQUIRES_AT_LEAST}
Tested up to: ${TESTED_UP_TO}
Requires PHP: 7.4
Version: 1.0.0
License: GNU General Public License v2 or later
License URI: http://www.gnu.org/licenses/gpl-2.0.html
Text Domain: ${slug}
Tags: portfolio, blog, one-column, custom-colors, full-site-editing, block-patterns, style-variations, translation-ready, wide-blocks
*/
`;
}

/** The == Fonts == section, in Ipsum's format: name, copyright, license, source. */
function fontCredits(state: BuilderState): string {
  const keys = [...new Set([state.style.fonts.heading, state.style.fonts.body])];
  const credits = keys
    .map(fontDef)
    .filter((f) => f.file)
    .map(
      (f) =>
        `${f.name}\n${f.copyright}\nLicense: This Font Software is licensed under the SIL Open Font License, Version 1.1. This license is available with a FAQ at: https://openfontlicense.org\nSource: ${f.source}`,
    );
  return credits.length ? credits.join('\n\n') : 'The theme uses system fonts and bundles no font files.';
}

function readme(state: BuilderState, slug: string): string {
  const name = headerSafe(state.info.name) || 'My';
  const year = new Date().getFullYear();
  return `=== ${name} Portfolio ===
Contributors: ${slug.replace(/-portfolio$/, '').replace(/-/g, '')}
Requires at least: ${REQUIRES_AT_LEAST}
Tested up to: ${TESTED_UP_TO}
Requires PHP: 7.4
Stable tag: 1.0.0
License: GPLv2 or later
License URI: http://www.gnu.org/licenses/gpl-2.0.html

A personal portfolio block theme, made with FolioBlocks.

== Description ==

A block theme with home, about, contact, blog and single post layouts, and colour style variations you can switch in Appearance > Editor > Styles.

== Installation ==

1. In your admin, go to Appearance > Themes > Add New Theme > Upload Theme.
2. Choose the zip file, click Install Now, then Activate.
3. Create the pages Home, About (template: About), Blog and Contact (template: Contact).
4. In Settings > Reading, choose "A static page": Homepage = Home, Posts page = Blog.

== Changelog ==

= 1.0.0 =
* Initial release.

== Copyright ==

${name} Portfolio WordPress Theme, (C) ${year} ${name}.
${name} Portfolio is distributed under the terms of the GNU GPL.

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 2 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU General Public License for more details.

== Images ==

Title: screenshot.png
Drawn by FolioBlocks from the theme's own colours and text.
License: GPLv2 or later, the same as the theme.

== Fonts ==

${fontCredits(state)}
`;
}

/** Ipsum-style functions.php: each function wrapped in function_exists, with @since. */
function functionsPhp(slug: string): string {
  const fn = slug.replace(/-/g, '_');
  return `<?php
/**
 * Theme functions.
 *
 * @package ${slug}
 * @since 1.0.0
 */

if ( ! function_exists( '${fn}_editor_styles' ) ) :
	/**
	 * Loads style.css in the editors, so they match the front end.
	 *
	 * @since 1.0.0
	 *
	 * @return void
	 */
	function ${fn}_editor_styles() {
		add_editor_style( 'style.css' );
	}
endif;
add_action( 'after_setup_theme', '${fn}_editor_styles' );

if ( ! function_exists( '${fn}_enqueue_styles' ) ) :
	/**
	 * Enqueues style.css on the front end.
	 *
	 * @since 1.0.0
	 *
	 * @return void
	 */
	function ${fn}_enqueue_styles() {
		wp_enqueue_style( '${slug}-style', get_stylesheet_uri(), array(), wp_get_theme()->get( 'Version' ) );
	}
endif;
add_action( 'wp_enqueue_scripts', '${fn}_enqueue_styles' );
`;
}

/** Generate every text file of the theme. Binary files (fonts, screenshot) are listed in `assets` or added by the zip step. */
export function generateTheme(state: BuilderState): { slug: string; files: ThemeFiles; assets: ThemeAsset[] } {
  const slug = themeSlug(state.info.name);
  const p = patterns(state, slug);
  const files: ThemeFiles = {
    'style.css': styleCss(state, slug),
    'theme.json': themeJson(state.style),
    ...colorVariations(state.style),
    'functions.php': functionsPhp(slug),
    'readme.txt': readme(state, slug),
    ...p.templates,
    ...p.patterns,
  };
  const assets = fontAssets([state.style.fonts.heading, state.style.fonts.body]);
  return { slug, files, assets };
}
