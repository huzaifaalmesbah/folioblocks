import type { Info, Section, SectionType } from '../types';
import { badge, block, buttons, columns, container, group, heading, image, join, list, metaText, paragraph, separator } from './blocks';
import { portraitAlt, screenshotAlt } from './i18n';
import { AVATAR, projectImage } from './images';
import { cleanUrl, makePhp, type Php } from './utils';

export type Ctx = { info: Info; php: Php; /** Card/button corner radius as CSS, e.g. "10px". */ radius: string };
/** Returns the section's markup, or '' when the student has nothing to show in it yet. */
type Renderer = (ctx: Ctx) => string;

/** Surface: the faint wash behind cards and bands (Ipsum's `accent-5`). */
const SURFACE = 'accent-5';

/** Split items into rows of `size` columns. */
function grid(items: string[], size = 3): string[] {
  const rows: string[] = [];
  for (let i = 0; i < items.length; i += size) rows.push(columns(items.slice(i, i + size)));
  return rows;
}

/** The student's photo (or the placeholder), with translated alt text. */
function avatar({ info, php }: Ctx, opts: Parameters<typeof image>[2]): string {
  return image(php.themeFile(AVATAR), php.attr(portraitAlt(php.lang, info.name)), opts);
}

/* ---------- Hero ---------- */

/** Hero buttons: only the ones that lead somewhere. '' when there are none. */
function heroButtons({ info, php }: Ctx, center = false): string {
  const ctas: { label: string; href: string }[] = [];
  if (info.projects.length) ctas.push({ label: php.t('View my work'), href: '#projects' });
  if (info.email) ctas.push({ label: php.t('Contact me'), href: php.url(`mailto:${info.email}`) });
  if (info.cvUrl && cleanUrl(info.cvUrl)) ctas.push({ label: php.t('Download CV'), href: php.url(info.cvUrl) });
  return ctas.length ? buttons(ctas, center) : '';
}

function heroText(ctx: Ctx, center: boolean): string {
  return join(
    heading(ctx.php.t(ctx.info.name), 1, center),
    paragraph(ctx.php.t(ctx.info.tagline), center),
    heroButtons(ctx, center),
  );
}

const heroCentered: Renderer = (ctx) =>
  group(heroText(ctx, true), { name: ctx.php.name('Hero'), tagName: 'section', align: 'full', padY: 80 });

/** Round photo above a centered name: the friendliest start. */
const heroAvatar: Renderer = (ctx) =>
  group(join(avatar(ctx, { aspectRatio: '1', width: '160px', align: 'center', rounded: true }), heroText(ctx, true)), {
    name: ctx.php.name('Hero'),
    tagName: 'section',
    align: 'full',
    padY: 80,
  });

const heroSplit: Renderer = (ctx) => {
  return group(columns([heroText(ctx, false), avatar(ctx, { aspectRatio: '1' })]), {
    name: ctx.php.name('Hero'),
    tagName: 'section',
    align: 'full',
    padY: 70,
  });
};

/** Big type on the left, a tall portrait on the right. */
const heroBig: Renderer = (ctx) => {
  const { info, php } = ctx;
  const meta = [info.university, info.location].filter(Boolean).join(' · ');
  const text = join(
    paragraph(php.t("Hello, I'm")),
    heading(php.t(info.name), 1),
    paragraph(php.t(info.tagline)),
    meta && paragraph(php.t(meta)),
    heroButtons(ctx),
  );
  return group(columns([text, avatar(ctx, { aspectRatio: '4/5' })], { verticalAlignment: 'center' }), {
    name: php.name('Hero'),
    tagName: 'section',
    align: 'full',
    padY: 80,
    layout: { type: 'constrained', contentSize: '1100px' },
  });
};

/** A research-profile start: portrait beside name, details and bio. */
const heroProfile: Renderer = (ctx) => {
  const { info, php } = ctx;
  const meta = [info.university, info.location].filter(Boolean).join(' · ');
  const text = join(
    heading(php.t(info.name), 1),
    paragraph(php.t(info.tagline)),
    meta && paragraph(php.t(meta)),
    info.bio && paragraph(php.t(info.bio)),
    heroButtons(ctx),
  );
  return group(columns([avatar(ctx, { aspectRatio: '4/5' }), text]), {
    name: php.name('Hero'),
    tagName: 'section',
    align: 'full',
    padY: 70,
    layout: { type: 'constrained', contentSize: '1000px' },
  });
};

/* ---------- About ---------- */

function aboutMeta(info: Info): string {
  return [info.university, info.location].filter(Boolean).join(' · ');
}

const aboutText: Renderer = ({ info, php }) => {
  const meta = aboutMeta(info);
  if (!info.bio && !meta) return '';
  return group(join(heading(php.t('About me')), info.bio && paragraph(php.t(info.bio)), meta && paragraph(php.t(meta))), {
    name: php.name('About'),
    tagName: 'section',
    padY: 60,
  });
};

const aboutColumns: Renderer = ({ info, php }) => {
  const meta = aboutMeta(info);
  if (!info.bio) return aboutText({ info, php, radius: '' });
  const left = join(heading(php.t('About me')), meta && paragraph(php.t(meta)));
  return group(columns([left, paragraph(php.t(info.bio))]), {
    name: php.name('About'),
    tagName: 'section',
    padY: 60,
    layout: { type: 'constrained', contentSize: '1000px' },
  });
};

/** Photo beside the story. */
const aboutPhoto: Renderer = (ctx) => {
  const { info, php } = ctx;
  const meta = aboutMeta(info);
  if (!info.bio && !meta) return '';
  const text = join(heading(php.t('About me')), info.bio && paragraph(php.t(info.bio)), meta && paragraph(php.t(meta)));
  return group(columns([avatar(ctx, { aspectRatio: '4/5' }), text]), {
    name: php.name('About'),
    tagName: 'section',
    padY: 60,
    layout: { type: 'constrained', contentSize: '1000px' },
  });
};

/* ---------- Skills ---------- */

const skillsList: Renderer = ({ info, php }) =>
  info.skills.length
    ? group(join(heading(php.t('Skills')), list(info.skills.map(php.t))), {
        name: php.name('Skills'),
        tagName: 'section',
        padY: 50,
      })
    : '';

const skillsBadges: Renderer = ({ info, php, radius }) => {
  if (!info.skills.length) return '';
  const pills = group(join(...info.skills.map((s) => badge(php.t(s), radius === '0' ? '0' : '9999px'))), {
    name: php.name('Skill badges'),
    layout: { type: 'flex', flexWrap: 'wrap' },
  });
  return group(join(heading(php.t('Skills')), pills), { name: php.name('Skills'), tagName: 'section', padY: 50 });
};

/* ---------- WordPress contributions ---------- */

/** A contribution's team name, linked to the proof (a ticket, a profile, an event page) when there is one. */
function contributionTitle(php: Php, c: Info['contributions'][number]): string {
  return c.url && cleanUrl(c.url) ? `<a href="${php.url(c.url)}">${php.t(c.team)}</a>` : php.t(c.team);
}

const contributionsList: Renderer = ({ info, php }) => {
  if (!info.contributions.length) return '';
  const items = info.contributions.map(
    (c) => `<strong>${contributionTitle(php, c)}</strong>: ${php.t(c.description)}${c.date ? ` (${php.t(c.date)})` : ''}`,
  );
  return group(join(heading(php.t('My WordPress journey')), list(items)), {
    name: php.name('WordPress journey'),
    tagName: 'section',
    padY: 50,
  });
};

const contributionsCards: Renderer = ({ info, php, radius }) => {
  if (!info.contributions.length) return '';
  const cards = info.contributions.map((c) =>
    group(join(c.date && metaText(php.t(c.date)), heading(contributionTitle(php, c), 3), paragraph(php.t(c.description))), {
      name: php.name('Contribution card'),
      background: SURFACE,
      pad: 40,
      radius,
      layout: { type: 'default' },
    }),
  );
  return group(join(heading(php.t('My WordPress journey')), ...grid(cards)), {
    name: php.name('WordPress journey'),
    tagName: 'section',
    padY: 60,
    layout: { type: 'constrained', contentSize: '1280px' },
  });
};

/** Dated entries, newest first as written: the date leads, then what happened. */
const contributionsTimeline: Renderer = ({ info, php }) => {
  if (!info.contributions.length) return '';
  const items = info.contributions.map((c) =>
    group(join(c.date && metaText(php.t(c.date)), heading(contributionTitle(php, c), 3), paragraph(php.t(c.description))), {
      name: php.name('Contribution'),
      layout: { type: 'default' },
    }),
  );
  return group(join(heading(php.t('My WordPress journey')), ...items.flatMap((item, i) => (i ? [separator(), item] : [item]))), {
    name: php.name('WordPress journey'),
    tagName: 'section',
    padY: 60,
  });
};

/* ---------- Numbers at a glance ---------- */

/** Counts taken from the profile itself, so they are never made up. Needs at least two to be worth showing. */
const statsRow: Renderer = ({ info, php }) => {
  const stats = [
    { n: info.projects.length, label: 'Projects' },
    { n: info.contributions.length, label: 'Contributions' },
    { n: info.skills.length, label: 'Skills' },
  ].filter((s) => s.n > 0);
  if (stats.length < 2) return '';
  const cols = stats.map((s) => join(heading(String(s.n), 3, true), paragraph(php.t(s.label), true)));
  return group(columns(cols), { name: php.name('Stats'), tagName: 'section', align: 'full', padY: 50, background: SURFACE });
};

/* ---------- Experience, education, achievements ---------- */

const experienceTimeline: Renderer = ({ info, php }) => {
  if (!info.experience.length) return '';
  const items = info.experience.map((e) =>
    group(
      join(
        e.period && metaText(php.t(e.period)),
        heading(php.t(e.role), 3),
        e.org && paragraph(php.t(e.org)),
        e.description && paragraph(php.t(e.description)),
      ),
      { name: php.name('Experience item'), layout: { type: 'default' } },
    ),
  );
  return group(join(heading(php.t('Experience')), ...items), { name: php.name('Experience'), tagName: 'section', padY: 50 });
};

/** One line each: for a CV-style page. */
const experienceCompact: Renderer = ({ info, php }) => {
  if (!info.experience.length) return '';
  const items = info.experience.map((e) => {
    const where = [e.org, e.period].filter(Boolean).join(', ');
    return `<strong>${php.t(e.role)}</strong>${where ? `: ${php.t(where)}` : ''}`;
  });
  return group(join(heading(php.t('Experience')), list(items)), { name: php.name('Experience'), tagName: 'section', padY: 50 });
};

const educationList: Renderer = ({ info, php }) => {
  if (!info.education.length) return '';
  const items = info.education.map((e) =>
    group(join(heading(php.t(e.degree), 3), paragraph(php.t([e.school, e.period].filter(Boolean).join(' · ')))), {
      name: php.name('Education item'),
      layout: { type: 'default' },
    }),
  );
  return group(join(heading(php.t('Education')), ...items), { name: php.name('Education'), tagName: 'section', padY: 50 });
};

const achievementsList: Renderer = ({ info, php }) => {
  if (!info.achievements.length) return '';
  const items = info.achievements.map((a) => {
    const title = a.url && cleanUrl(a.url) ? `<a href="${php.url(a.url)}">${php.t(a.title)}</a>` : php.t(a.title);
    const details = [a.issuer, a.year].filter(Boolean).join(', ');
    return `<strong>${title}</strong>${details ? `: ${php.t(details)}` : ''}`;
  });
  return group(join(heading(php.t('Achievements')), list(items)), { name: php.name('Achievements'), tagName: 'section', padY: 50 });
};

/* ---------- Projects ---------- */

function projectText({ php }: Ctx, p: Info['projects'][number]): string {
  const title = p.url ? `<a href="${php.url(p.url)}">${php.t(p.title)}</a>` : php.t(p.title);
  return join(heading(title, 3), paragraph(php.t(p.description)));
}

function projectPicture({ php }: Ctx, p: Info['projects'][number], i: number, aspectRatio = '3/2'): string {
  return image(php.themeFile(projectImage(i)), php.attr(screenshotAlt(php.lang, p.title)), { aspectRatio });
}

/** Picture on top, then title and description. */
function projectContent(ctx: Ctx, p: Info['projects'][number], i: number): string {
  return join(projectPicture(ctx, p, i), projectText(ctx, p));
}

const projectsGrid: Renderer = (ctx) =>
  ctx.info.projects.length
    ? group(join(heading(ctx.php.t('Projects')), ...grid(ctx.info.projects.map((p, i) => projectContent(ctx, p, i)))), {
        name: ctx.php.name('Projects'),
        tagName: 'section',
        anchor: 'projects',
        align: 'full',
        padY: 60,
        background: SURFACE,
      })
    : '';

const projectsCards: Renderer = (ctx) => {
  if (!ctx.info.projects.length) return '';
  const cards = ctx.info.projects.map((p, i) =>
    group(projectContent(ctx, p, i), {
      name: ctx.php.name('Project card'),
      background: SURFACE,
      pad: 40,
      radius: ctx.radius,
      layout: { type: 'default' },
    }),
  );
  return group(join(heading(ctx.php.t('Projects')), ...grid(cards)), {
    name: ctx.php.name('Projects'),
    tagName: 'section',
    anchor: 'projects',
    padY: 60,
    layout: { type: 'constrained', contentSize: '1280px' },
  });
};

/** Compact rows: small picture beside the text. */
const projectsList: Renderer = (ctx) =>
  ctx.info.projects.length
    ? group(
        join(
          heading(ctx.php.t('Projects')),
          ...ctx.info.projects.map((p, i) => columns([projectPicture(ctx, p, i), projectText(ctx, p)])),
        ),
        { name: ctx.php.name('Projects'), tagName: 'section', padY: 60, anchor: 'projects' },
      )
    : '';

/** Large pictures, alternating sides: a showcase. */
const projectsRows: Renderer = (ctx) =>
  ctx.info.projects.length
    ? group(
        join(
          heading(ctx.php.t('Selected work')),
          ...ctx.info.projects.map((p, i) => {
            const pic = projectPicture(ctx, p, i, '4/3');
            const text = projectText(ctx, p);
            return columns(i % 2 ? [text, pic] : [pic, text]);
          }),
        ),
        {
          name: ctx.php.name('Projects'),
          tagName: 'section',
          anchor: 'projects',
          padY: 70,
          layout: { type: 'constrained', contentSize: '1280px' },
        },
      )
    : '';

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
    join(
      block('post-featured-image', { isLink: true, aspectRatio: '3/2' }),
      block('post-title', { isLink: true, level: 3 }),
      block('post-date'),
      block('post-excerpt'),
    ),
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
  const row = group(
    join(
      block('post-featured-image', { isLink: true, aspectRatio: '3/2', width: '200px' }),
      group(join(block('post-title', { isLink: true, level: 3 }), block('post-date')), {
        name: php.name('Title and Date'),
        layout: { type: 'default' },
      }),
    ),
    { name: php.name('Post'), layout: { type: 'flex', flexWrap: 'nowrap' } },
  );
  const template = postTemplate(join(row, separator()));
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

/** A call to action needs somewhere to go: hidden without an email. */
const contactCta: Renderer = ({ info, php }) =>
  info.email
    ? group(
        join(
          heading(php.t("Let's work together"), 2, true),
          paragraph(php.t('Have a question or an idea? Get in touch.'), true),
          buttons([{ label: php.t('Email me'), href: php.url(`mailto:${info.email}`) }], true),
        ),
        { name: php.name('Call to action'), tagName: 'section', align: 'full', padY: 70, background: SURFACE },
      )
    : '';

const contactFull: Renderer = ({ info, php }) => {
  const socials = socialLinks(info, php);
  if (!info.email && !info.location && !socials) return '';
  return group(
    join(
      heading(php.t('Contact'), 1, true),
      info.email && paragraph(php.t('The best way to reach me is by email.'), true),
      info.email && paragraph(`<a href="${php.url(`mailto:${info.email}`)}">${php.t(info.email)}</a>`, true),
      info.location && paragraph(php.t(info.location), true),
      socials,
    ),
    { name: php.name('Contact'), tagName: 'section', padY: 80 },
  );
};

/* ---------- Registry ---------- */

type Variant = { label: string; render: Renderer };

export const SECTION_LABELS: Record<SectionType, string> = {
  hero: 'Hero',
  about: 'About',
  skills: 'Skills',
  contributions: 'WordPress journey',
  stats: 'Numbers at a glance',
  experience: 'Experience',
  education: 'Education',
  achievements: 'Achievements',
  projects: 'Projects',
  posts: 'Latest posts',
  contact: 'Contact',
};

export const SECTIONS: Record<SectionType, Record<string, Variant>> = {
  hero: {
    avatar: { label: 'Round photo, centered', render: heroAvatar },
    centered: { label: 'Centered text', render: heroCentered },
    split: { label: 'Text beside photo', render: heroSplit },
    big: { label: 'Big type beside a tall photo', render: heroBig },
    profile: { label: 'Profile: photo, details and bio', render: heroProfile },
  },
  about: {
    text: { label: 'Text', render: aboutText },
    columns: { label: 'Two columns', render: aboutColumns },
    photo: { label: 'Photo beside text', render: aboutPhoto },
  },
  skills: {
    list: { label: 'List', render: skillsList },
    badges: { label: 'Badges', render: skillsBadges },
  },
  contributions: {
    list: { label: 'List', render: contributionsList },
    cards: { label: 'Cards', render: contributionsCards },
    timeline: { label: 'Timeline', render: contributionsTimeline },
  },
  stats: { row: { label: 'Row of numbers', render: statsRow } },
  experience: {
    timeline: { label: 'Timeline', render: experienceTimeline },
    compact: { label: 'Compact list', render: experienceCompact },
  },
  education: { list: { label: 'List', render: educationList } },
  achievements: { list: { label: 'List', render: achievementsList } },
  projects: {
    grid: { label: 'Grid band', render: projectsGrid },
    cards: { label: 'Cards', render: projectsCards },
    rows: { label: 'Showcase rows', render: projectsRows },
    list: { label: 'Compact list', render: projectsList },
  },
  posts: {
    grid: { label: '3-column grid with images', render: postsGrid },
    list: { label: 'List with thumbnails', render: postsList },
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

/** Whether a section has nothing to show for this person, so the theme leaves it out. */
export function isSectionEmpty(section: Section, info: Info): boolean {
  return renderSection(section, { info, php: makePhp('x'), radius: '0' }) === '';
}
