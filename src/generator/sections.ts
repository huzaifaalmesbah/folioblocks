import type { Info, Section, SectionType } from '../types';
import { badge, block, buttons, columns, container, group, heading, join, list, paragraph, separator } from './blocks';
import { cleanUrl, type Php } from './utils';

export type Ctx = { info: Info; php: Php; /** Card/button corner radius as CSS, e.g. "10px". */ radius: string };
type Renderer = (ctx: Ctx) => string;

/** Surface: the faint wash behind cards and bands (Ipsum's `accent-5`). */
const SURFACE = 'accent-5';

/** Split items into rows of `size` columns. */
function grid(items: string[], size = 3): string[] {
  const rows: string[] = [];
  for (let i = 0; i < items.length; i += size) rows.push(columns(items.slice(i, i + size)));
  return rows;
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

/* ---------- Hero ---------- */

function heroCtas({ info, php }: Ctx): { label: string; href: string }[] {
  const ctas = [{ label: php.t('View my work'), href: '#projects' }];
  if (info.email) ctas.push({ label: php.t('Contact me'), href: php.url(`mailto:${info.email}`) });
  return ctas;
}

function heroText(ctx: Ctx, center: boolean): string {
  return join(
    heading(ctx.php.t(ctx.info.name), 1, center),
    paragraph(ctx.php.t(ctx.info.tagline), center),
    buttons(heroCtas(ctx), center),
  );
}

const heroCentered: Renderer = (ctx) =>
  group(heroText(ctx, true), { name: ctx.php.name('Hero'), tagName: 'section', align: 'full', padY: 80 });

const heroSplit: Renderer = (ctx) => {
  const art = group(heading(ctx.php.t(initials(ctx.info.name) || 'Hi'), 2, true), {
    name: ctx.php.name('Initials'),
    background: SURFACE,
    padY: 70,
    radius: ctx.radius,
  });
  return group(columns([heroText(ctx, false), art]), {
    name: ctx.php.name('Hero'),
    tagName: 'section',
    align: 'full',
    padY: 70,
  });
};

const heroBig: Renderer = (ctx) => {
  const { info, php } = ctx;
  const meta = [info.university, info.location].filter(Boolean).join(' · ');
  return group(
    join(
      paragraph(php.t("Hello, I'm")),
      heading(php.t(info.name), 1),
      paragraph(php.t(info.tagline)),
      meta && paragraph(php.t(meta)),
      buttons(heroCtas(ctx)),
    ),
    {
      name: php.name('Hero'),
      tagName: 'section',
      align: 'full',
      padY: 80,
      layout: { type: 'constrained', contentSize: '1000px' },
    },
  );
};

/* ---------- About ---------- */

function aboutMeta(info: Info): string {
  return [info.university, info.location].filter(Boolean).join(' · ');
}

const aboutText: Renderer = ({ info, php }) => {
  const meta = aboutMeta(info);
  return group(join(heading(php.t('About me')), paragraph(php.t(info.bio)), meta && paragraph(php.t(meta))), {
    name: php.name('About'),
    tagName: 'section',
    padY: 60,
  });
};

const aboutColumns: Renderer = ({ info, php }) => {
  const meta = aboutMeta(info);
  const left = join(heading(php.t('About me')), meta && paragraph(php.t(meta)));
  return group(columns([left, paragraph(php.t(info.bio))]), {
    name: php.name('About'),
    tagName: 'section',
    padY: 60,
    layout: { type: 'constrained', contentSize: '1000px' },
  });
};

/* ---------- Skills ---------- */

function skillItems(info: Info): string[] {
  return info.skills.length ? info.skills : ['Add your skills'];
}

const skillsList: Renderer = ({ info, php }) =>
  group(join(heading(php.t('Skills')), list(skillItems(info).map(php.t))), {
    name: php.name('Skills'),
    tagName: 'section',
    padY: 50,
  });

const skillsBadges: Renderer = ({ info, php, radius }) => {
  const pills = group(join(...skillItems(info).map((s) => badge(php.t(s), radius === '0' ? '0' : '9999px'))), {
    name: php.name('Skill badges'),
    layout: { type: 'flex', flexWrap: 'wrap' },
  });
  return group(join(heading(php.t('Skills')), pills), { name: php.name('Skills'), tagName: 'section', padY: 50 });
};

/* ---------- WordPress contributions ---------- */

function contributionItems(info: Info): Info['contributions'] {
  return info.contributions.length
    ? info.contributions
    : [{ team: 'Your team', description: 'Add your WordPress contributions (Make teams, translations, meetups…)' }];
}

const contributionsList: Renderer = ({ info, php }) => {
  const items = contributionItems(info).map((c) => `<strong>${php.t(c.team)}</strong>: ${php.t(c.description)}`);
  return group(join(heading(php.t('My WordPress journey')), list(items)), {
    name: php.name('WordPress journey'),
    tagName: 'section',
    padY: 50,
  });
};

const contributionsCards: Renderer = ({ info, php, radius }) => {
  const cards = contributionItems(info).map((c) =>
    group(join(heading(php.t(c.team), 3), paragraph(php.t(c.description))), {
      name: php.name('Contribution card'),
      background: SURFACE,
      pad: 40,
      radius,
    }),
  );
  return group(join(heading(php.t('My WordPress journey')), ...grid(cards)), {
    name: php.name('WordPress journey'),
    tagName: 'section',
    padY: 60,
    layout: { type: 'constrained', contentSize: '1280px' },
  });
};

/* ---------- Projects ---------- */

function projectContent({ php }: Ctx, p: Info['projects'][number]): string {
  const title = p.url ? `<a href="${php.url(p.url)}">${php.t(p.title)}</a>` : php.t(p.title);
  return join(heading(title, 3), paragraph(php.t(p.description)));
}

function projectItems(info: Info): Info['projects'] {
  return info.projects.length
    ? info.projects
    : [
        { title: 'Project one', description: 'Describe your project in one line.', url: '' },
        { title: 'Project two', description: 'Describe your project in one line.', url: '' },
        { title: 'Project three', description: 'Describe your project in one line.', url: '' },
      ];
}

const projectsGrid: Renderer = (ctx) =>
  group(join(heading(ctx.php.t('Projects')), ...grid(projectItems(ctx.info).map((p) => projectContent(ctx, p)))), {
    name: ctx.php.name('Projects'),
    tagName: 'section',
    anchor: 'projects',
    align: 'full',
    padY: 60,
    background: SURFACE,
  });

const projectsCards: Renderer = (ctx) => {
  const cards = projectItems(ctx.info).map((p) =>
    group(projectContent(ctx, p), { name: ctx.php.name('Project card'), background: SURFACE, pad: 40, radius: ctx.radius }),
  );
  return group(join(heading(ctx.php.t('Projects')), ...grid(cards)), {
    name: ctx.php.name('Projects'),
    tagName: 'section',
    anchor: 'projects',
    padY: 60,
    layout: { type: 'constrained', contentSize: '1280px' },
  });
};

const projectsList: Renderer = (ctx) =>
  group(join(heading(ctx.php.t('Projects')), ...projectItems(ctx.info).map((p) => projectContent(ctx, p))), {
    name: ctx.php.name('Projects'),
    tagName: 'section',
    padY: 60,
    anchor: 'projects',
  });

/* ---------- Latest posts ---------- */

/** The three latest posts. No `queryId`: the editor adds it when needed (Ipsum's rule). */
function latestQuery(template: string): string {
  const query = {
    query: {
      perPage: 3,
      pages: 0,
      offset: 0,
      postType: 'post',
      order: 'desc',
      orderBy: 'date',
      author: '',
      search: '',
      exclude: [],
      sticky: '',
      inherit: false,
    },
  };
  return container('query', query, 'div', 'wp-block-query', template);
}

const postsGrid: Renderer = ({ php }) => {
  const template = postTemplate(
    join(block('post-title', { isLink: true, level: 3 }), block('post-date'), block('post-excerpt')),
    { layout: { type: 'grid', columnCount: 3 } },
  );
  return group(join(heading(php.t('Latest posts')), latestQuery(template)), {
    name: php.name('Latest posts'),
    tagName: 'section',
    padY: 60,
    layout: { type: 'constrained', contentSize: '1280px' },
  });
};

const postsList: Renderer = ({ php }) => {
  const template = postTemplate(join(block('post-title', { isLink: true, level: 3 }), block('post-date'), separator()));
  return group(join(heading(php.t('Latest posts')), latestQuery(template)), {
    name: php.name('Latest posts'),
    tagName: 'section',
    padY: 60,
  });
};

/** A Post Template block. It saves no HTML of its own, only its children. */
export function postTemplate(children: string, attrs?: Record<string, unknown>): string {
  return block('post-template', attrs, children);
}

/* ---------- Contact ---------- */

const SOCIAL_SERVICES: Record<string, string> = {
  github: 'github',
  linkedin: 'linkedin',
  x: 'x',
  wordpress: 'wordpress',
};

export function socialLinks(info: Info, php: Php, justify: 'center' | 'right' | 'left' = 'center'): string {
  const links = Object.entries(info.socials)
    .filter(([, url]) => url && cleanUrl(url))
    .map(([key, url]) => block('social-link', { url: php.url(url!), service: SOCIAL_SERVICES[key] }));
  if (!links.length) return '';
  return container(
    'social-links',
    { metadata: { name: php.name('Social links') }, layout: { type: 'flex', justifyContent: justify } },
    'ul',
    'wp-block-social-links',
    join(...links),
  );
}

const contactCta: Renderer = ({ info, php }) =>
  group(
    join(
      heading(php.t("Let's work together"), 2, true),
      paragraph(php.t('Have a question or an idea? Get in touch.'), true),
      info.email && buttons([{ label: php.t('Email me'), href: php.url(`mailto:${info.email}`) }], true),
    ),
    { name: php.name('Call to action'), tagName: 'section', align: 'full', padY: 70, background: SURFACE },
  );

const contactFull: Renderer = ({ info, php }) =>
  group(
    join(
      heading(php.t('Contact'), 1, true),
      paragraph(php.t('The best way to reach me is by email.'), true),
      info.email
        ? paragraph(`<a href="${php.url(`mailto:${info.email}`)}">${php.t(info.email)}</a>`, true)
        : paragraph(php.t('[Add your email address]'), true),
      info.location && paragraph(php.t(info.location), true),
      socialLinks(info, php),
    ),
    { name: php.name('Contact'), tagName: 'section', padY: 80 },
  );

/* ---------- Registry ---------- */

type Variant = { label: string; render: Renderer };

export const SECTION_LABELS: Record<SectionType, string> = {
  hero: 'Hero',
  about: 'About',
  skills: 'Skills',
  contributions: 'WordPress journey',
  projects: 'Projects',
  posts: 'Latest posts',
  contact: 'Contact',
};

export const SECTIONS: Record<SectionType, Record<string, Variant>> = {
  hero: {
    centered: { label: 'Centered', render: heroCentered },
    split: { label: 'Split with initials', render: heroSplit },
    big: { label: 'Big type', render: heroBig },
  },
  about: {
    text: { label: 'Text', render: aboutText },
    columns: { label: 'Two columns', render: aboutColumns },
  },
  skills: {
    list: { label: 'List', render: skillsList },
    badges: { label: 'Badges', render: skillsBadges },
  },
  contributions: {
    list: { label: 'List', render: contributionsList },
    cards: { label: 'Cards', render: contributionsCards },
  },
  projects: {
    grid: { label: 'Grid band', render: projectsGrid },
    cards: { label: 'Cards', render: projectsCards },
    list: { label: 'List', render: projectsList },
  },
  posts: {
    grid: { label: '3-column grid', render: postsGrid },
    list: { label: 'List', render: postsList },
  },
  contact: {
    cta: { label: 'Call to action', render: contactCta },
    full: { label: 'Full contact', render: contactFull },
  },
};

export function renderSection(section: Section, ctx: Ctx): string {
  const variants = SECTIONS[section.type];
  const v = variants[section.variant] ?? Object.values(variants)[0];
  return v.render(ctx);
}
