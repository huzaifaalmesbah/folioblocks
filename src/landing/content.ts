/**
 * Home page content: the AI agent guide (skills, commands, prompts) and
 * the WordPress.com steps. Kept apart from the layout so it's easy to
 * update when tools or plans change.
 */

export const SKILLS_REPO = 'https://github.com/WordPress/agent-skills';

/** Skills from WordPress/agent-skills that a portfolio project uses, and what each is for. */
export const SKILLS: { name: string; use: string }[] = [
  { name: 'wp-block-themes', use: 'theme.json, templates, template parts, patterns and style variations. The main one.' },
  { name: 'wp-patterns', use: 'Writing and changing block patterns: headers, Inserter, i18n, valid markup.' },
  { name: 'wp-env', use: 'Running WordPress locally with @wordpress/env, mapping your theme, running WP-CLI.' },
  { name: 'wp-wpcli-and-ops', use: 'Creating pages, menus, posts and settings from the command line.' },
  { name: 'wp-playground', use: 'Trying the site in WordPress Playground without installing anything.' },
  { name: 'blueprint', use: 'Writing a Playground Blueprint so anyone can open your site with one link.' },
  { name: 'wp-project-triage', use: 'Lets the agent work out what kind of project it is in before changing things.' },
  { name: 'wp-performance', use: 'A final check: image sizes, fonts, caching and Core Web Vitals.' },
];

export const INSTALL_SKILLS =
  'npx skills add WordPress/agent-skills --skill wp-block-themes wp-patterns wp-env wp-wpcli-and-ops wp-playground blueprint wp-project-triage wp-performance';

export const LOCAL_SETUP: { title: string; text: string; code?: string }[] = [
  {
    title: 'Build and download your theme',
    text: 'Make your theme in FolioBlocks, click "Download …zip", and unzip it into an empty project folder. The theme folder (with style.css inside) should sit at the top of that folder.',
  },
  {
    title: 'Open the folder in your AI agent',
    text: 'Claude Code, Cursor, GitHub Copilot or Codex all work. Then install the WordPress skills, so the agent follows WordPress best practice instead of guessing:',
    code: INSTALL_SKILLS,
  },
  {
    title: 'Start WordPress locally',
    text: 'Pick one. wp-env needs Node.js and Docker; WordPress Studio is a desktop app with nothing else to install; Playground CLI needs only Node.js. The first prompt below sets wp-env up for you.',
    code: 'npm i -g @wordpress/env    # then the agent writes .wp-env.json and runs: wp-env start',
  },
  {
    title: 'Give the agent the prompts below',
    text: 'Copy one prompt at a time, replace the [brackets], and let the agent finish and show you the result before the next one. Check the site in your browser after each step.',
  },
];

export type Prompt = { title: string; skills: string[]; text: string };

export const PROMPTS: Prompt[] = [
  {
    title: '1. Set up the site',
    skills: ['wp-env', 'wp-wpcli-and-ops'],
    text: `This folder has my block theme in ./[theme-folder], made with FolioBlocks. Use the wp-env and wp-wpcli-and-ops skills.

1. Create .wp-env.json that maps ./[theme-folder] as a theme (latest WordPress, PHP 8.3, WP_DEBUG on).
2. Start wp-env, then with WP-CLI: activate the theme; set the site title to "[Your Name]" and the tagline to "[Your tagline]"; create the pages Home, About (template "About"), Blog and Contact (template "Contact"); set Home as the front page and Blog as the posts page; use /%postname%/ permalinks.
3. Add bin/setup.sh with those WP-CLI steps, written so running it twice changes nothing, and run it from the lifecycleScripts afterStart hook.
4. Tell me the site URL and the admin login.`,
  },
  {
    title: '2. Customize the design',
    skills: ['wp-block-themes', 'wp-patterns'],
    text: `Use the wp-block-themes and wp-patterns skills on the theme in ./[theme-folder].

I want: [describe the change, e.g. "a sticky header", "a testimonials section on the home page", "a darker style variation called Night", "bigger headings"].

Follow the conventions already in the theme (they come from WordPress' Ipsum theme):
- templates/*.html and parts/*.html stay one-line delegates; edit the hidden-* or page-* pattern they point to
- every pattern keeps Title, Slug and Description headers; template patterns keep "Inserter: no"
- every visible string goes through esc_html__() / esc_attr__() with the theme's text domain
- use the palette slugs (base, contrast, accent-1, accent-3, accent-5, accent-6) and spacing presets, never literal colours or pixel sizes
- write block markup exactly as the editor saves it

Then reload the site, open the template in the Site Editor, and confirm there are no "invalid block" warnings.`,
  },
  {
    title: '3. Add a new page or section',
    skills: ['wp-block-themes', 'wp-patterns', 'wp-wpcli-and-ops'],
    text: `Use the wp-block-themes, wp-patterns and wp-wpcli-and-ops skills.

Add a "[Page name, e.g. Talks]" page to my portfolio:
1. A new page pattern patterns/page-[slug].php (Categories, Post Types: page, Block Types: core/post-content, Description) built from core blocks, in the same style as page-about.php.
2. A custom template "page-[slug]" registered in theme.json customTemplates, delegating to a hidden-page-[slug] pattern, like page-about.
3. Create the page with WP-CLI, assign the template, and add it to the navigation.
Content: [list what should be on the page].`,
  },
  {
    title: '4. Fill in real content',
    skills: ['wp-wpcli-and-ops'],
    text: `Use the wp-wpcli-and-ops skill. Replace the sample content with mine:
- Delete the three sample posts and their images.
- Create these posts (draft first, I will review): [title — two or three lines each].
- Upload these images from ./content/images and set them as featured images: [file → post].
- Update the About page text to: [your text].
Show me the list of posts and pages when you are done.`,
  },
  {
    title: '5. Check quality before publishing',
    skills: ['wp-block-themes', 'wp-performance'],
    text: `Use the wp-block-themes and wp-performance skills to review ./[theme-folder] as if it were going to WordPress.org:
- theme.json is valid against its schema; style.css and readme.txt headers are complete
- no untranslated or unescaped output; text domain matches the folder
- every bundled font and image is GPL-compatible and credited in readme.txt
- colour contrast passes WCAG AA in every style variation
- images are a sensible size; nothing loads from a third-party CDN
List problems first, then fix them, then make [theme-folder].zip with the theme folder at the root of the zip (no .git, node_modules or .DS_Store).`,
  },
  {
    title: '6. Share a live demo link',
    skills: ['blueprint', 'wp-playground'],
    text: `Use the blueprint and wp-playground skills. My theme is on GitHub at [https://github.com/you/repo] in the folder [theme-folder].

Write blueprint.json that installs and activates the theme from that repo, sets the site title, creates the same pages and settings as bin/setup.sh, and imports a few sample posts. Validate it against the Blueprint schema, try it with the Playground CLI, and give me the https://playground.wordpress.net/?blueprint-url=… link for my README.`,
  },
];

/** For people who'd rather have the agent build the whole theme from nothing. */
export const FROM_SCRATCH_PROMPT = `Use the wp-block-themes, wp-patterns and wp-env skills from WordPress/agent-skills.

Build me a personal portfolio block theme. Before writing code, ask me, one group at a time: my name, tagline, university and location; a short bio; my skills; my WordPress contributions; 2–4 projects; contact links; a colour and font mood. Never invent facts about me.

Then build it following WordPress' Ipsum conventions: templates and parts delegate to hidden-* patterns; every pattern has Title, Slug and Description; all strings translatable and escaped; theme.json v3 with "$schema": "https://schemas.wp.org/trunk/theme.json", Twenty Twenty-Five palette slugs and a spacing scale; Home, About, Blog, single post, Contact and 404 templates; self-hosted fonts credited in readme.txt; core blocks only.

Run it with wp-env, check every template in the Site Editor for invalid blocks, and finally zip it with the theme folder at the root of the zip.`;

export const WPCOM_UPLOAD_STEPS = [
  'In FolioBlocks, click "Download …zip". Don\'t unzip it.',
  'In your WordPress.com dashboard, go to Appearance → Themes.',
  'Click "Add Theme" (or "Install new theme"), then "Upload Theme", choose the zip and click "Install Now".',
  'Click "Activate". (Not ready to go live? Try it on a staging site first.)',
  'Create the pages Home, About, Blog and Contact. For About and Contact, pick the "About" and "Contact" template in the page settings.',
  'In Settings → Reading, choose "A static page": Homepage = Home, Posts page = Blog.',
  'Open Appearance → Editor to change colours (Styles has your other palettes), fonts, the menu and any text. Your edits are saved separately from the theme files.',
];

export const STUDIO_STEPS = [
  'Install WordPress Studio (free, from wordpress.studio) and create a local site.',
  'Open the local site\'s WP Admin and install your zip the same way: Appearance → Themes → Add New Theme → Upload Theme → Activate.',
  'Customize locally, by hand or with an AI agent and the prompts above.',
  'Click "Publish" in Studio, connect your WordPress.com site, choose "Choose files…", tick your theme under themes, and publish.',
];

export const WPCOM_LINKS = {
  upload: 'https://wordpress.com/support/themes/uploading-setting-up-custom-themes/',
  pricing: 'https://wordpress.com/pricing/',
  studio: 'https://wordpress.studio/',
  studioSync: 'https://wordpress.studio/docs/sync/',
  studentPlan: 'https://wordpress.com/support/plan-features/student-plan/',
  edu: 'https://wordpress.com/edu/',
};
