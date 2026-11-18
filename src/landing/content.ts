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

export const WPCOM_LINKS = {
  upload: 'https://wordpress.com/support/themes/uploading-setting-up-custom-themes/',
  studio: 'https://wordpress.studio/',
  studioSync: 'https://wordpress.studio/docs/sync/',
};

/* ---------- Publish guide: shared by the Publish step and the Guide page ---------- */

export type GuideLink = { label: string; url: string };
export type GuidePart = { id: string; title: string; text?: string; steps: string[]; links: GuideLink[] };

const DOCS = 'https://wordpress.org/documentation/article';

/** Where to install the theme: the first part of the guide, one tab each. */
export const INSTALL_PLACES: GuidePart[] = [
  {
    id: 'any',
    title: 'Any WordPress site',
    text: 'A site on any web host where you can log in to WP Admin.',
    steps: [
      'Log in to your WP Admin and go to Appearance → Themes.',
      'Click "Add New Theme", then "Upload Theme".',
      'Choose your zip (don\'t unzip it) and click "Install Now".',
      'Click "Activate".',
    ],
    links: [{ label: 'WordPress: Work with themes', url: `${DOCS}/work-with-themes/#adding-new-themes-using-the-administration-screens` }],
  },
  {
    id: 'wpcom',
    title: 'WordPress.com',
    text: 'Theme upload needs the Personal plan or higher; the Free plan can\'t.',
    steps: [
      'In WordPress.com, go to Appearance → Themes.',
      'Click "Add Theme", then "Upload Theme", and choose your zip.',
      'Click "Install Now", then "Activate".',
    ],
    links: [
      { label: 'WordPress.com: Upload a theme', url: WPCOM_LINKS.upload },
    ],
  },
  {
    id: 'local',
    title: 'On your computer',
    text: 'Try it privately first with WordPress Studio (free), then publish when you are ready.',
    steps: [
      'Install WordPress Studio and create a local site.',
      'Open the site\'s WP Admin: Appearance → Themes → Add New Theme → Upload Theme → Activate.',
      'When you are happy, publish it to WordPress.com from Studio. The first time, publish only your theme: "Content and settings" replaces the live site\'s content.',
    ],
    links: [
      { label: 'WordPress Studio', url: WPCOM_LINKS.studio },
      { label: 'Studio Sync', url: WPCOM_LINKS.studioSync },
    ],
  },
];

/** After installing: the rest of the guide, in order. */
export const GUIDE_PARTS: GuidePart[] = [
  {
    id: 'pages',
    title: 'Set up your pages',
    text: 'Your theme has a Home, About, Blog and Contact layout. Create the pages once:',
    steps: [
      'Go to Pages → Add New Page and create Home, About, Blog and Contact (a title is enough).',
      'For About, open Settings on the right → Template → choose "About". Do the same for Contact with "Contact".',
      'Go to Settings → Reading → "A static page": Homepage = Home, Posts page = Blog. Save.',
    ],
    links: [
      { label: 'WordPress: Create pages', url: `${DOCS}/create-pages/` },
      { label: 'WordPress: Reading settings', url: `${DOCS}/settings-reading-screen/` },
    ],
  },
  {
    id: 'customize',
    title: 'Make it yours in the Site Editor',
    text: 'Everything the builder made can be changed later in WordPress, with blocks:',
    steps: [
      'Go to Appearance → Editor.',
      'Styles: change colours and fonts, or pick one of the colour variations that come with your theme.',
      'Navigation: choose which pages show in the menu, and their order.',
      'Templates and Patterns: click any section to edit it, move it or remove it. Click Save when done.',
      'A section\'s look (cards, tiles, lines…) is in that block\'s Styles panel.',
    ],
    links: [
      { label: 'WordPress: Site Editor', url: `${DOCS}/site-editor/` },
      { label: 'WordPress: Styles', url: `${DOCS}/styles-overview/` },
      { label: 'WordPress: Navigation', url: `${DOCS}/site-editor-navigation` },
    ],
  },
  {
    id: 'new-page',
    title: 'Add a new page',
    steps: [
      'Go to Pages → Add New Page and give it a title.',
      'WordPress offers your theme\'s page designs to start from: pick one, or start empty.',
      'Add blocks with the + button: text, images, buttons, columns.',
      'Click Publish. To show it in the menu, add it in Appearance → Editor → Navigation.',
    ],
    links: [{ label: 'WordPress: Create pages', url: `${DOCS}/create-pages/` }],
  },
  {
    id: 'post',
    title: 'Write and publish a post',
    steps: [
      'Go to Posts → Add New Post.',
      'Write a title and your text; add images with the + button.',
      'In the settings on the right, set a featured image and a category.',
      'Click Publish. The post shows on your Blog page and in "Latest posts" on your home page.',
    ],
    links: [{ label: 'WordPress: Writing posts', url: `${DOCS}/writing-posts/` }],
  },
  {
    id: 'update',
    title: 'Update your theme later',
    steps: [
      'Change your design or info here in FolioBlocks and download the zip again.',
      'Upload it the same way. When WordPress asks, choose "Replace active with uploaded".',
      'Your pages, posts and menu stay. Changes you made in the Site Editor stay too, and keep winning over the theme\'s.',
    ],
    links: [],
  },
];

export type Course = { title: string; url: string; lessons: number; note: string };
export type CourseGroup = { id: 'everyone' | 'designer' | 'developer' | 'contributor'; title: string; courses: Course[] };

const LEARN = 'https://learn.wordpress.org/course';

/** Free courses on Learn WordPress (checked November 2026), grouped by who they suit. */
export const COURSE_GROUPS: CourseGroup[] = [
  {
    id: 'everyone',
    title: 'Everyone',
    courses: [
      { title: 'Getting Started With WordPress: Get Set Up', url: `${LEARN}/getting-started-with-wordpress-get-setup/`, lessons: 11, note: 'Your first WordPress site, step by step.' },
      { title: 'Getting Started With WordPress: Get Familiar', url: `${LEARN}/getting-started-with-wordpress-get-familiar/`, lessons: 18, note: 'Find your way around WP Admin.' },
      { title: 'Beginner WordPress User', url: `${LEARN}/beginner-wordpress-user/`, lessons: 24, note: 'Pages, posts, blocks and menus.' },
      { title: 'Intermediate WordPress User', url: `${LEARN}/intermediate-wordpress-user/`, lessons: 37, note: 'The Site Editor, patterns and more.' },
      { title: 'Creating a 4-page business website', url: `${LEARN}/creating-a-4-page-business-website/`, lessons: 10, note: 'A small real site from start to finish.' },
    ],
  },
  {
    id: 'designer',
    title: 'Designers',
    courses: [
      { title: 'Beginner WordPress Designer', url: `${LEARN}/beginner-wordpress-designer/`, lessons: 24, note: 'Design a site with blocks and the Site Editor.' },
      { title: 'WordPress Credits Designer Track', url: `${LEARN}/wordpress-credits-designer-track/`, lessons: 39, note: 'Design work for the WordPress project.' },
    ],
  },
  {
    id: 'developer',
    title: 'Developers',
    courses: [
      { title: 'Develop Your First Low-Code Block Theme', url: `${LEARN}/develop-your-first-low-code-block-theme/`, lessons: 23, note: 'Build a block theme like the one you just made.' },
      { title: 'Beginner WordPress Developer', url: `${LEARN}/beginner-wordpress-developer/`, lessons: 59, note: 'Themes, plugins and how WordPress works.' },
      { title: 'Intermediate Theme Developer', url: `${LEARN}/intermediate-theme-developer/`, lessons: 32, note: 'theme.json, templates and patterns in depth.' },
      { title: 'WordPress Credits Developer Track', url: `${LEARN}/wordpress-credits-developer-track/`, lessons: 27, note: 'Code contributions to WordPress.' },
    ],
  },
  {
    id: 'contributor',
    title: 'Contributors',
    courses: [
      { title: 'WordPress Credits Foundations', url: `${LEARN}/wordpress-credits-foundations/`, lessons: 26, note: 'How to start contributing to WordPress.' },
      { title: 'WordPress Credits Translation Track', url: `${LEARN}/wordpress-credits-translation-track/`, lessons: 42, note: 'Translate WordPress, and FolioBlocks too.' },
    ],
  },
];

/** Three courses to suggest right after publishing. */
export const FIRST_COURSES: Course[] = [
  COURSE_GROUPS[0].courses[2],
  COURSE_GROUPS[1].courses[0],
  COURSE_GROUPS[2].courses[0],
];

/** WordPress's own help, for people using the theme. */
export const USER_DOCS: GuideLink[] = [
  { label: 'Block themes', url: `${DOCS}/block-themes/` },
  { label: 'Site Editor', url: `${DOCS}/site-editor/` },
  { label: 'Styles', url: `${DOCS}/styles-overview/` },
  { label: 'Navigation', url: `${DOCS}/site-editor-navigation` },
  { label: 'Create pages', url: `${DOCS}/create-pages/` },
  { label: 'Writing posts', url: `${DOCS}/writing-posts/` },
  { label: 'Work with themes', url: `${DOCS}/work-with-themes/` },
];

/** The Theme Handbook, for people who want to change the theme's code. */
export const DEV_DOCS: GuideLink[] = [
  { label: 'Theme Handbook', url: 'https://developer.wordpress.org/themes/' },
  { label: 'Theme structure', url: 'https://developer.wordpress.org/themes/core-concepts/theme-structure/' },
  { label: 'Templates', url: 'https://developer.wordpress.org/themes/core-concepts/templates/' },
  { label: 'Global settings and styles (theme.json)', url: 'https://developer.wordpress.org/themes/global-settings-and-styles/' },
  { label: 'Style variations', url: 'https://developer.wordpress.org/themes/global-settings-and-styles/style-variations/' },
  { label: 'Block style variations', url: 'https://developer.wordpress.org/themes/features/block-style-variations/' },
  { label: 'Patterns', url: 'https://developer.wordpress.org/themes/global-settings-and-styles/patterns/' },
];
