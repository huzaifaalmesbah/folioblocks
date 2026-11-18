/**
 * Home page content: the AI agent guide (the FolioBlocks skill, WordPress
 * skills and prompts) and the publishing guide. Kept apart from the layout
 * so it's easy to update when tools or plans change.
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

/* ---------- AI agent: the FolioBlocks skill ---------- */

/** Adds the FolioBlocks skill to an AI coding agent (via the skills CLI). */
export const INSTALL_FOLIOBLOCKS_SKILL = 'npx skills add huzaifaalmesbah/folioblocks --skill folioblocks';

/** The one prompt a student gives; the skill does the rest. */
export const ONE_PROMPT = 'Make my portfolio website with the folioblocks skill.';

/** Three steps on the home page. */
export const AGENT_STEPS: { title: string; text: string; code?: string; link?: GuideLink }[] = [
  {
    title: 'Get Node.js and an AI agent',
    text: 'Install Node.js (free), and use an AI coding agent: Claude Code, Codex, Cursor or GitHub Copilot all work.',
    link: { label: 'Download Node.js', url: 'https://nodejs.org/' },
  },
  {
    title: 'Add the FolioBlocks skill',
    text: 'In an empty folder, run this once. It teaches your agent how to make a FolioBlocks theme.',
    code: INSTALL_FOLIOBLOCKS_SKILL,
  },
  {
    title: 'Ask for your portfolio',
    text: 'Give the agent this one prompt. It asks you a few questions, builds your theme, shows it to you and tells you how to publish it.',
    code: ONE_PROMPT,
  },
];

/** A short example of the conversation, so people know what to expect. */
export const SAMPLE_CHAT: { who: 'agent' | 'you'; text: string }[] = [
  { who: 'you', text: 'Make my portfolio website with the folioblocks skill.' },
  { who: 'agent', text: 'Happy to! A few short questions first, about ten minutes in all. Say "skip" to anything. What name should the site show?' },
  { who: 'you', text: 'Rafid Hasan. CSE final year at BUET, Dhaka.' },
  { who: 'agent', text: 'Thanks! Which fits you best: developer, designer, student, or someone with a job? I\'ll suggest three designs.' },
  { who: 'you', text: 'Developer and student.' },
  { who: 'agent', text: 'Your theme is built: theme/rafid-hasan-portfolio.zip. Your site is running at http://127.0.0.1:9400 to look around. Want any changes?' },
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
];

/** For people who'd rather have the agent build the whole theme from nothing. */
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
