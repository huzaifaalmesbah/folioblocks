import type { BuilderState } from '../types';
import { headerSafe } from './utils';

/**
 * AGENTS.md for the generated theme, as Ipsum ships one: what an AI coding
 * agent needs to know to change this theme without breaking it.
 */
export function agentsMd(state: BuilderState, slug: string): string {
  const name = headerSafe(state.info.name) || 'the site owner';
  const bengali = state.language === 'bn';
  return `# AGENTS.md

How coding agents should work on this theme. It is a WordPress block theme for ${name}'s portfolio, made with FolioBlocks, and it follows the conventions of Ipsum, WordPress' default theme.

- Theme folder and text domain: \`${slug}\`
- Pattern slug prefix: \`${slug}/\`
- Requires WordPress 6.8 or later. Core blocks only: no plugins, no build step.
${bengali ? "- The theme's own strings are written in Bengali. Keep new strings in Bengali, and keep the Noto Sans Bengali font for them.\n" : ''}
## Skills to use

Install them from https://github.com/WordPress/agent-skills and follow them:

\`\`\`bash
npx skills add WordPress/agent-skills --skill wp-block-themes wp-patterns wp-env wp-wpcli-and-ops wp-playground
\`\`\`

## Key files

- \`templates/*.html\`, \`parts/*.html\` - One-line delegates to a pattern. Do not put markup here.
- \`patterns/hidden-*.php\` - The markup of each template (\`Inserter: no\`, \`Template Types\`).
- \`patterns/page-home.php\`, \`page-about.php\`, \`page-contact.php\` - The content of the Home, About and Contact pages.
- \`patterns/header.php\`, \`patterns/footer.php\` - The header and footer.
- \`theme.json\` - Colours, fonts, spacing, per-block styles, \`customTemplates\`.
- \`styles/colors/*.json\` - Colour style variations.
- \`assets/fonts/\`, \`assets/images/\` - Bundled fonts and images, credited in \`readme.txt\`.

## Rules

- **The pattern is the source of truth.** To change a template or part, edit the pattern it names.
- **Every pattern** keeps its \`Title\`, \`Slug\` and \`Description\` headers.
- **Every visible string** goes through \`esc_html__()\`, \`esc_attr__()\` or \`wp_kses_post( __() )\` with the \`${slug}\` text domain. URLs go through \`esc_url()\`.
- **Use the design tokens.** Colours: \`base\` (background), \`contrast\` (text), \`accent-1\` (primary: links, buttons), \`accent-3\` (hover), \`accent-5\` (surface: cards, bands), \`accent-6\` (lines). Spacing: \`var:preset|spacing|20\` to \`80\`. No literal colours or pixel sizes in patterns.
- **Images** use \`get_parent_theme_file_uri( 'assets/images/…' )\`, translated alt text, and no \`id\` or \`wp-image-\` class.
- **Do not reformat block markup.** It is written as the editor saves it: one delimiter per line, a blank line between sibling blocks, a wrapper element on the same line as its first child.
- **Leave out editor leftovers**: \`queryId\`, \`theme\` and \`area\` on template parts, \`patternName\`.
- **New fonts or images** must be GPL-compatible (OFL fonts, CC0 images) and credited in \`readme.txt\`.
- **Do not invent facts** about ${name}. Ask for missing details.

## Checking your work

1. Run the site (wp-env, WordPress Studio or Playground) and activate the theme.
2. Open each changed template in Appearance → Editor. There must be no "invalid block" or "Attempt recovery" notices.
3. Check the page on a narrow screen, and in every colour variation under Styles.
4. Before sharing a zip: the theme folder sits at the root of the zip, with no \`.git\`, \`node_modules\` or \`.DS_Store\`.
`;
}
