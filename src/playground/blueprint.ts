import { SITE_URL } from '../config';
import { SAMPLE_POST_IMAGES } from '../generator/images';
import type { ThemeAsset } from '../fonts';
import type { BuilderState, ThemeFiles } from '../types';

type FileTree = { [name: string]: string | FileTree };

/** Turn flat paths ("templates/index.html") into the nested tree a literal:directory resource expects. */
export function toFileTree(files: ThemeFiles): FileTree {
  const tree: FileTree = {};
  for (const [path, content] of Object.entries(files)) {
    const parts = path.split('/');
    let node = tree;
    for (const dir of parts.slice(0, -1)) {
      node = (node[dir] ??= {}) as FileTree;
    }
    node[parts[parts.length - 1]] = content;
  }
  return tree;
}

/** PHP that creates the pages, sample posts and reading settings a portfolio needs. */
const SETUP_PHP = `<?php
require '/wordpress/wp-load.php';

// Pretty permalinks, with rewrite rules rebuilt so /post-name/ URLs resolve.
global $wp_rewrite;
$wp_rewrite->set_permalink_structure( '/%postname%/' );

function fb_page( $title, $template = '' ) {
	$args = array( 'post_type' => 'page', 'post_status' => 'publish', 'post_title' => $title );
	if ( $template ) {
		$args['page_template'] = $template;
	}
	return wp_insert_post( $args );
}

$home    = fb_page( 'Home' );
$about   = fb_page( 'About', 'page-about' );
$blog    = fb_page( 'Blog' );
$contact = fb_page( 'Contact', 'page-contact' );

update_option( 'show_on_front', 'page' );
update_option( 'page_on_front', $home );
update_option( 'page_for_posts', $blog );

// Remove the default "Hello world!" post and "Sample Page".
wp_delete_post( 1, true );
wp_delete_post( 2, true );

$term = wp_insert_term( 'Learning', 'category' );
$cat  = is_wp_error( $term ) ? 1 : $term['term_id'];
$posts = array(
	array( 'My first WordPress contribution', 'How I found a good first ticket, set up wordpress-develop and opened my first patch.' ),
	array( 'What I learned at my first WordCamp', 'Notes from the talks, the contributor day and the people I met.' ),
	array( 'Building a block theme from scratch', 'theme.json, templates, template parts and patterns: what each one does.' ),
);
foreach ( $posts as $i => $p ) {
	$post_id = wp_insert_post( array(
		'post_author'   => 1,
		'post_status'   => 'publish',
		'post_title'    => $p[0],
		'post_content'  => '<!-- wp:paragraph --><p>' . $p[1] . '</p><!-- /wp:paragraph -->',
		'post_excerpt'  => $p[1],
		'post_category' => array( $cat ),
		'tags_input'    => array( 'wordpress', 'student' ),
		'post_date'     => gmdate( 'Y-m-d H:i:s', time() - ( $i + 1 ) * DAY_IN_SECONDS ),
	) );

	// A featured image, from the placeholder written by an earlier step.
	$relative = 'folioblocks/post-' . ( $i + 1 ) . '.webp';
	$file     = WP_CONTENT_DIR . '/uploads/' . $relative;
	if ( file_exists( $file ) ) {
		$attachment = wp_insert_attachment(
			array(
				'post_mime_type' => 'image/webp',
				'post_title'     => $p[0],
				'post_status'    => 'inherit',
			),
			$file,
			$post_id
		);
		wp_update_attachment_metadata( $attachment, array( 'width' => 1200, 'height' => 800, 'file' => $relative, 'sizes' => array() ) );
		set_post_thumbnail( $post_id, $attachment );
	}
}

flush_rewrite_rules( false );
`;

/**
 * A Blueprint that installs the generated theme straight from its files
 * (no zip hosting needed) and sets up a ready-to-browse portfolio site.
 */
export function buildBlueprint(
  state: BuilderState,
  slug: string,
  files: ThemeFiles,
  /** Binary theme files (fonts), fetched by Playground from `assetBaseUrl`. */
  assets: ThemeAsset[] = [],
  opts: {
    /** Public URL where the app serves those files, e.g. https://example.github.io/folioblocks/. */
    assetBaseUrl?: string;
    /** Theme folder name. Defaults to the slug; the live preview uses a fixed one so renaming needs no reinstall. */
    folder?: string;
    /** Turn off WordPress' theme caches (patterns, theme.json), for a preview whose files keep changing. */
    developmentMode?: boolean;
  } = {},
) {
  const { assetBaseUrl = SITE_URL, folder = slug, developmentMode = false } = opts;
  // Binary files can't travel inside the JSON, so Playground downloads them from the FolioBlocks site.
  // writeFile does not create folders, so make each asset folder first.
  const themeDir = `/wordpress/wp-content/themes/${folder}`;
  // The student's own photos are data URLs: they travel inside the Blueprint and PHP writes them out.
  const dirs = [...new Set(assets.map((a) => a.path.slice(0, a.path.lastIndexOf('/'))))];
  const assetSteps = [
    ...dirs.map((dir) => ({ step: 'mkdir', path: `${themeDir}/${dir}` })),
    ...assets.map((a) =>
      a.data
        ? {
            step: 'runPHP',
            code: `<?php file_put_contents( '${themeDir}/${a.path}', base64_decode( '${a.data.replace(/^data:[^,]*,/, '')}' ) );`,
          }
        : {
            step: 'writeFile',
            path: `${themeDir}/${a.path}`,
            data: { resource: 'url', url: new URL(a.src ?? '', assetBaseUrl).href },
          },
    ),
  ];
  // Sample post thumbnails go in the uploads folder; SETUP_PHP attaches them to the posts.
  const sampleImageSteps = [
    { step: 'mkdir', path: '/wordpress/wp-content/uploads/folioblocks' },
    ...SAMPLE_POST_IMAGES.map((src, i) => ({
      step: 'writeFile',
      path: `/wordpress/wp-content/uploads/folioblocks/post-${i + 1}.webp`,
      data: { resource: 'url', url: new URL(src, assetBaseUrl).href },
    })),
  ];
  return {
    $schema: 'https://playground.wordpress.net/blueprint-schema.json',
    meta: {
      title: `${state.info.name} Portfolio`,
      description: 'A portfolio block theme made with FolioBlocks.',
      author: 'FolioBlocks',
    },
    landingPage: '/',
    preferredVersions: { php: '8.3', wp: 'latest' },
    login: true,
    steps: [
      ...(developmentMode ? [{ step: 'defineWpConfigConsts', consts: { WP_DEVELOPMENT_MODE: 'theme' } }] : []),
      {
        step: 'installTheme',
        themeData: { resource: 'literal:directory', name: folder, files: toFileTree(files) },
        options: { activate: true },
      },
      ...assetSteps,
      ...sampleImageSteps,
      {
        step: 'setSiteOptions',
        options: {
          blogname: state.info.name,
          blogdescription: state.info.tagline,
        },
      },
      { step: 'runPHP', code: SETUP_PHP },
    ],
  };
}

/** Base64-encode UTF-8 text (btoa alone breaks on non-Latin characters such as Bangla). */
function base64Utf8(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}

/** A playground.wordpress.net link that carries the whole Blueprint in the URL fragment. */
export function playgroundUrl(blueprint: object): string {
  return `https://playground.wordpress.net/#${base64Utf8(JSON.stringify(blueprint))}`;
}
