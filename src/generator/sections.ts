import type { Info, Section, SectionType } from '../types';
import {
  badge as baseBadge,
  block,
  buttons,
  columns,
  container,
  group as baseGroup,
  heading as baseHeading,
  image,
  inlineColor,
  join,
  list,
  metaText,
  paragraph,
  quote,
  separator,
  sizedParagraph,
} from './blocks';
import type { LookDef } from './looks';
import { portraitAlt, screenshotAlt } from './i18n';
import { avatarPath, projectImagePath } from './images';
import { cleanUrl, makePhp, type Php } from './utils';

export type Ctx = {
  info: Info;
  php: Php;
  /** Card/button corner radius as CSS, e.g. "10px". */
  radius: string;
  /** The look's rules for sections, cards and headings (generator/looks.ts). */
  look?: LookDef;
  /** Numbers section headings on a page when the look asks for it. Reset for each page. */
  counter?: { n: number };
};
/** Returns the section's markup, or '' when the student has nothing to show in it yet. */
type Renderer = (ctx: Ctx) => string;

/** Surface: the faint wash behind cards and bands (Ipsum's `accent-5`). */
const SURFACE = 'accent-5';

/* ---------- The look, applied while a section renders ---------- */

/** Heroes that are a design of their own: the look's section style leaves them alone. */
const OWN_DESIGN = new Set(['hero/terminal', 'hero/bento', 'hero/cover']);

/** Set by renderSection for the section being rendered (rendering is synchronous). */
let current: { ctx: Ctx; styled: boolean } | null = null;

type GroupOpts = NonNullable<Parameters<typeof baseGroup>[1]>;

/**
 * Group, with the look applied: sections get the look's block style and
 * lose their wide/full alignment when they become cards; Surface cards get
 * the look's border and shadow, and a Base ground inside a card-like section.
 */
function group(children: string, opts: GroupOpts = {}): string {
  const look = current?.ctx.look;
  if (!look) return baseGroup(children, opts);
  const o = { ...opts };
  if (o.tagName === 'section') {
    if (current!.styled) {
      if (look.section?.style) o.className = [o.className, `is-style-${look.section.style}`].filter(Boolean).join(' ');
      if (look.section?.dropAlign) {
        delete o.align;
        if (o.background === SURFACE) delete o.background;
      }
    }
  } else if (o.background === SURFACE) {
    if (current!.styled && look.card?.background) o.background = look.card.background;
    if (look.card?.border) o.border = look.card.border;
    if (look.card?.shadow) o.shadow = look.card.shadow;
  }
  return baseGroup(children, o);
}

/** Section headings (h2) carry the look's prefix: a `$` prompt or a running number. */
function heading(html: string, level = 2, center = false): string {
  const ctx = current?.ctx;
  if (level === 2 && ctx?.look?.headings === 'prompt') return baseHeading(`${inlineColor('$', 'accent-1')} ${html}`, level, center);
  if (level === 2 && ctx?.look?.headings === 'number' && ctx.counter) {
    const n = String(++ctx.counter.n).padStart(2, '0');
    return baseHeading(`${inlineColor(`${n} —`, 'accent-1')}<br>${html}`, level, center);
  }
  return baseHeading(html, level, center);
}

/** Skill pills sit on Base when the section itself is Surface-coloured. */
function badge(html: string, radius: string): string {
  return baseBadge(html, radius, current?.styled && current.ctx.look?.card?.background ? current.ctx.look.card.background : SURFACE);
}


/** Split items into rows of `size` columns. */
function grid(items: string[], size = 3): string[] {
  const rows: string[] = [];
  for (let i = 0; i < items.length; i += size) rows.push(columns(items.slice(i, i + size)));
  return rows;
}

/** The student's photo (or the placeholder), with translated alt text. */
function avatar({ info, php }: Ctx, opts: Parameters<typeof image>[2]): string {
  return image(php.themeFile(avatarPath(info)), php.attr(portraitAlt(php.lang, info.name)), opts);
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
    ctx.info.tagline && paragraph(ctx.php.t(ctx.info.tagline), center),
    heroButtons(ctx, center),
  );
}

const heroCentered: Renderer = (ctx) =>
  group(heroText(ctx, true), { name: ctx.php.name('Hero'), tagName: 'section', align: 'full', padY: 80 });

/** A full-width band in the secondary colour with light text: loud and simple. */
const heroBand: Renderer = (ctx) =>
  group(heroText(ctx, true), {
    name: ctx.php.name('Hero'),
    tagName: 'section',
    align: 'full',
    padY: 80,
    background: 'accent-3',
    textColor: 'base',
  });

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
    info.tagline && paragraph(php.t(info.tagline)),
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
    info.tagline && paragraph(php.t(info.tagline)),
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
    (c) => `<strong>${contributionTitle(php, c)}</strong>${c.description ? `: ${php.t(c.description)}` : ''}${c.date ? ` (${php.t(c.date)})` : ''}`,
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
    group(join(c.date && metaText(php.t(c.date)), heading(contributionTitle(php, c), 3), c.description && paragraph(php.t(c.description))), {
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
    group(join(c.date && metaText(php.t(c.date)), heading(contributionTitle(php, c), 3), c.description && paragraph(php.t(c.description))), {
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
    group(join(heading(php.t(e.degree), 3), (e.school || e.period) && paragraph(php.t([e.school, e.period].filter(Boolean).join(' · ')))), {
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
  return join(heading(title, 3), p.description && paragraph(php.t(p.description)));
}

function projectPicture({ php, info }: Ctx, p: Info['projects'][number], i: number, aspectRatio = '3/2'): string {
  return image(php.themeFile(projectImagePath(info, i)), php.attr(screenshotAlt(php.lang, p.title)), { aspectRatio });
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

/** Two large tiles per row, picture first: for visual work. */
const projectsGallery: Renderer = (ctx) =>
  ctx.info.projects.length
    ? group(
        join(
          heading(ctx.php.t('Selected work')),
          ...grid(
            ctx.info.projects.map((p, i) => join(projectPicture(ctx, p, i, '4/3'), projectText(ctx, p))),
            2,
          ),
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

/** Three square pictures per row with just a title: a photo wall. */
const projectsTiles: Renderer = (ctx) =>
  ctx.info.projects.length
    ? group(
        join(
          ...grid(
            ctx.info.projects.map((p, i) => {
              const title = p.url ? `<a href="${ctx.php.url(p.url)}">${ctx.php.t(p.title)}</a>` : ctx.php.t(p.title);
              return join(projectPicture(ctx, p, i, '1'), metaText(title));
            }),
          ),
        ),
        {
          name: ctx.php.name('Projects'),
          tagName: 'section',
          anchor: 'projects',
          padY: 50,
          layout: { type: 'constrained', contentSize: '1280px' },
        },
      )
    : '';

/* ---------- Services and testimonials ---------- */

const servicesCards: Renderer = ({ info, php, radius }) => {
  if (!info.services.length) return '';
  const cards = info.services.map((s) =>
    group(join(heading(php.t(s.title), 3), s.description && paragraph(php.t(s.description))), {
      name: php.name('Service'),
      background: SURFACE,
      pad: 40,
      radius,
      layout: { type: 'default' },
    }),
  );
  return group(join(heading(php.t('Services')), ...grid(cards)), {
    name: php.name('Services'),
    tagName: 'section',
    padY: 60,
    layout: { type: 'constrained', contentSize: '1280px' },
  });
};

/** Each kind word on its own card, two per row, with who said it underneath. */
const testimonialsCards: Renderer = ({ info, php, radius }) => {
  const real = info.testimonials.filter((t) => t.quote.trim());
  if (!real.length) return '';
  const cards = real.map((t) =>
    group(
      join(
        paragraph(`${inlineColor('“', 'accent-1')}${php.t(t.quote)}”`),
        metaText(php.t([t.name, t.role].filter(Boolean).join(', '))),
      ),
      { name: php.name('Testimonial'), background: SURFACE, pad: 40, radius, layout: { type: 'default' } },
    ),
  );
  return group(join(heading(php.t('Kind words')), ...grid(cards, 2)), { name: php.name('Testimonials'), tagName: 'section', padY: 60 });
};

const testimonialsQuotes: Renderer = ({ info, php }) => {
  const real = info.testimonials.filter((t) => t.quote.trim());
  if (!real.length) return '';
  const quotes = real.map((t) => quote(php.t(t.quote), php.t([t.name, t.role].filter(Boolean).join(', '))));
  return group(join(heading(php.t('Kind words')), ...quotes), { name: php.name('Testimonials'), tagName: 'section', padY: 60 });
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

/**
 * Social icons. With `iconColor`, core's Logos Only style in one colour (the
 * text colour, as a slug and its hex value: the block stores both), so the
 * icons sit quietly in a footer instead of as bright brand circles.
 */
export function socialLinks(
  info: Info,
  php: Php,
  justify: 'center' | 'right' | 'left' = 'center',
  iconColor?: { slug: string; value: string },
): string {
  const links = Object.entries(info.socials)
    .filter(([, url]) => url && cleanUrl(url))
    .map(([key, url]) => block('social-link', { url: php.url(url!), service: SOCIAL_SERVICES[key] }));
  if (!links.length) return '';
  const attrs: Record<string, unknown> = { metadata: { name: php.name('Social links') } };
  let className = 'wp-block-social-links';
  if (iconColor) {
    attrs.iconColor = iconColor.slug;
    attrs.iconColorValue = iconColor.value;
    attrs.className = 'is-style-logos-only';
    className = 'wp-block-social-links has-icon-color is-style-logos-only';
  }
  attrs.layout = { type: 'flex', justifyContent: justify };
  return container('social-links', attrs, 'ul', className, join(...links));
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

/* ---------- Designs from html-templates/, in core blocks only ---------- */

/** Profile: a gradient banner with the round photo overlapping it, then name, details and buttons. */
const heroCover: Renderer = (ctx) => {
  const { info, php } = ctx;
  const meta = [info.location, info.university].filter(Boolean).join(' · ');
  const card = ctx.look?.section?.style;
  const banner = group('', {
    name: php.name('Cover'),
    gradient: ctx.look?.banner,
    background: ctx.look?.banner ? undefined : 'accent-1',
    minHeight: '200px',
    radius: card ? undefined : ctx.radius,
    radiusTop: card ? '16px' : undefined,
    layout: { type: 'default' },
  });
  const photo = group(avatar(ctx, { aspectRatio: '1', width: '168px', rounded: true, border: { color: card ? 'accent-5' : 'base', width: '6px' } }), {
    name: php.name('Photo'),
    marginTop: '-96px',
    layout: { type: 'default' },
  });
  const body = group(join(photo, heading(php.t(info.name), 1), info.tagline && paragraph(php.t(info.tagline)), meta && metaText(php.t(meta)), heroButtons(ctx)), {
    name: php.name('Profile'),
    pad: 50,
    layout: { type: 'default' },
  });
  // In a card look the hero is a card too, with the banner edge to edge at its top.
  return group(join(banner, body), {
    name: php.name('Hero'),
    tagName: 'section',
    className: card ? `is-style-${card}` : undefined,
    noPadding: true,
    blockGap: '0',
    layout: { type: 'default' },
  });
};

/** Terminal: a window with three dots and a `whoami` prompt, your details as its output. */
const heroTerminal: Renderer = (ctx) => {
  const { info, php } = ctx;
  const prompt = (cmd: string) => metaText(`${inlineColor('❯', 'accent-1')} ${php.t(cmd)}`);
  const meta = [info.location, info.university].filter(Boolean).join(' · ');
  const dots = paragraph(['#ff5f57', '#febc2e', '#28c840'].map((hex) => `<mark style="background-color:rgba(0, 0, 0, 0);color:${hex}" class="has-inline-color">●</mark>`).join(' '));
  const window = baseGroup(
    join(
      dots,
      prompt('whoami'),
      heading(php.t(info.name), 1),
      info.tagline && paragraph(php.t(info.tagline)),
      meta && paragraph(`${inlineColor('#', 'accent-3')} ${php.t(meta)}`),
      info.bio && paragraph(php.t(info.bio)),
      heroButtons(ctx),
      paragraph(`${inlineColor('❯', 'accent-1')} ${inlineColor('▋', 'accent-1')}`),
    ),
    {
      name: php.name('Terminal window'),
      background: SURFACE,
      border: { color: 'accent-6', width: '1px' },
      shadow: ctx.look?.headings === 'prompt' ? 'deep' : undefined,
      pad: 50,
      radius: ctx.radius,
      layout: { type: 'default' },
    },
  );
  return group(window, { name: php.name('Hero'), tagName: 'section', padY: 70, layout: { type: 'constrained', contentSize: '960px' } });
};

/** Bento: everything at a glance in a grid of tiles. Tiles without content are left out. */
const heroBento: Renderer = (ctx) => {
  const { info, php } = ctx;
  const tile = (children: string, span?: { columns?: number; rows?: number }, accent = false) =>
    baseGroup(children, {
      name: php.name('Tile'),
      background: accent ? 'accent-1' : SURFACE,
      textColor: accent ? 'base' : undefined,
      border: { color: 'accent-6', width: '1px' },
      radius: '28px',
      pad: 40,
      span,
      layout: { type: 'default' },
    });
  const stats = [
    { n: info.projects.length, label: 'Projects' },
    { n: info.contributions.length, label: 'Contributions' },
    { n: info.skills.length, label: 'Skills' },
  ].filter((s) => s.n > 0);
  const socials = socialLinks(info, php, 'left');
  const tiles = [
    tile(
      join(avatar(ctx, { aspectRatio: '1', width: '96px', rounded: true }), heading(php.t(info.name), 1), info.tagline && paragraph(php.t(info.tagline)), heroButtons(ctx)),
      { columns: 2, rows: 2 },
    ),
    info.bio && tile(join(metaText(php.t('About me')), paragraph(php.t(info.bio))), { columns: 2 }),
    (info.location || info.university) &&
      tile(join(metaText(php.t('Based in')), info.location && heading(php.t(info.location), 3), info.university && paragraph(php.t(info.university)))),
    ...stats.map((s) => tile(join(sizedParagraph(String(s.n), 'xx-large'), metaText(php.t(s.label))))),
    info.skills.length > 0 &&
      tile(
        join(
          metaText(php.t('Skills')),
          baseGroup(join(...info.skills.map((s) => baseBadge(php.t(s), '9999px', 'base'))), {
            name: php.name('Skill badges'),
            layout: { type: 'flex', flexWrap: 'wrap' },
          }),
        ),
        { columns: 2 },
      ),
    socials && tile(join(metaText(php.t('Find me online')), socials)),
    info.email &&
      tile(
        join(heading(php.t("Let's work together"), 3), paragraph(`<a href="${php.url(`mailto:${info.email}`)}">${php.t(info.email)}</a>`)),
        undefined,
        true,
      ),
  ];
  return group(join(...tiles), {
    name: php.name('Hero'),
    tagName: 'section',
    align: 'wide',
    padY: 50,
    layout: { type: 'grid', columnCount: 4, minimumColumnWidth: '14rem' },
  });
};

/** One role: when, what, where and what you did there. */
function experienceItem(php: Php, e: Info['experience'][number]): string {
  const p = paragraph;
  return join(
    e.period && metaText(`${inlineColor('●', 'accent-1')} ${php.t(e.period)}`),
    heading(php.t(e.role), 3),
    e.org && p(`<strong>${php.t(e.org)}</strong>`),
    e.description && p(php.t(e.description)),
  );
}

/** A line down the left with each role beside it. */
const experienceSteps: Renderer = ({ info, php }) => {
  if (!info.experience.length) return '';
  const items = info.experience.map((e) => group(experienceItem(php, e), { name: php.name('Experience item'), layout: { type: 'default' } }));
  const line = group(join(...items), {
    name: php.name('Timeline'),
    borderLeft: { color: 'accent-6', width: '2px' },
    pad: 40,
    layout: { type: 'default' },
  });
  return group(join(heading(php.t('Experience')), line), { name: php.name('Experience'), tagName: 'section', padY: 60 });
};

/** Career story: each role on a card, left and right of a centre line. Stacks on phones. */
const experienceAlternating: Renderer = ({ info, php, radius }) => {
  if (!info.experience.length) return '';
  const rows = info.experience.map((e, i) => {
    const card = group(experienceItem(php, e), { name: php.name('Experience item'), background: SURFACE, pad: 40, radius, layout: { type: 'default' } });
    const cols = [i % 2 ? '' : card, '', i % 2 ? card : ''];
    const children = join(
      ...cols.map((c, j) =>
        j === 1
          ? block(
              'column',
              { width: '4%', style: { border: { left: { color: 'var:preset|color|accent-6', width: '2px' } } } },
              '<div class="wp-block-column" style="border-left-color:var(--wp--preset--color--accent-6);border-left-width:2px;flex-basis:4%"></div>',
            )
          : block('column', { width: '48%' }, `<div class="wp-block-column" style="flex-basis:48%">${c}</div>`),
      ),
    );
    return block(
      'columns',
      { style: { spacing: { margin: { top: '0', bottom: '0' }, padding: { bottom: 'var:preset|spacing|40' } } } },
      `<div class="wp-block-columns" style="margin-top:0;margin-bottom:0;padding-bottom:var(--wp--preset--spacing--40)">${children}</div>`,
    );
  });
  const timeline = group(join(...rows), { name: php.name('Timeline'), blockGap: '0', layout: { type: 'default' } });
  return group(join(heading(php.t('Experience'), 2, true), timeline), {
    name: php.name('Experience'),
    tagName: 'section',
    padY: 60,
    layout: { type: 'constrained', contentSize: '1100px' },
  });
};

/** Case studies: a wide picture, then the title beside the story. */
const projectsCases: Renderer = (ctx) => {
  const { info, php } = ctx;
  if (!info.projects.length) return '';
  const cases = info.projects.map((p, i) => {
    const link = p.url && cleanUrl(p.url) ? buttons([{ label: php.t('View project'), href: php.url(p.url) }]) : '';
    const title = `${inlineColor(`${String(i + 1).padStart(2, '0')} —`, 'accent-1')} ${php.t(p.title)}`;
    return group(join(projectPicture(ctx, p, i, '16/9'), columns([heading(title, 3), join(p.description && paragraph(php.t(p.description)), link)])), {
      name: php.name('Case study'),
      padY: 40,
      layout: { type: 'default' },
    });
  });
  return group(join(heading(php.t('Selected work')), ...cases), {
    name: php.name('Projects'),
    tagName: 'section',
    anchor: 'projects',
    padY: 70,
    layout: { type: 'constrained', contentSize: '1100px' },
  });
};

/** A loud band of skills in a row, in the primary colour. */
const skillsStrip: Renderer = ({ info, php }) =>
  info.skills.length
    ? group(
        join(...info.skills.map((s, i) => paragraph(`${i ? `${inlineColor('✦', 'base')} ` : ''}<strong>${php.t(s)}</strong>`))),
        {
          name: php.name('Skills'),
          tagName: 'section',
          align: 'full',
          padY: 30,
          background: 'accent-1',
          textColor: 'base',
          layout: { type: 'flex', flexWrap: 'wrap', justifyContent: 'center' },
        },
      )
    : '';

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
  services: 'Services',
  testimonials: 'Testimonials',
  projects: 'Projects',
  posts: 'Latest posts',
  contact: 'Contact',
};

export const SECTIONS: Record<SectionType, Record<string, Variant>> = {
  hero: {
    avatar: { label: 'Round photo, centered', render: heroAvatar },
    band: { label: 'Bold colour band', render: heroBand },
    centered: { label: 'Centered text', render: heroCentered },
    split: { label: 'Text beside photo', render: heroSplit },
    big: { label: 'Big type beside a tall photo', render: heroBig },
    profile: { label: 'Profile: photo, details and bio', render: heroProfile },
    cover: { label: 'Cover banner with overlapping photo', render: heroCover },
    terminal: { label: 'Terminal window', render: heroTerminal },
    bento: { label: 'Bento grid of tiles', render: heroBento },
  },
  about: {
    text: { label: 'Text', render: aboutText },
    columns: { label: 'Two columns', render: aboutColumns },
    photo: { label: 'Photo beside text', render: aboutPhoto },
  },
  skills: {
    list: { label: 'List', render: skillsList },
    badges: { label: 'Badges', render: skillsBadges },
    strip: { label: 'Colour strip', render: skillsStrip },
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
    steps: { label: 'Line with dots', render: experienceSteps },
    alternating: { label: 'Career story, left and right', render: experienceAlternating },
  },
  education: { list: { label: 'List', render: educationList } },
  achievements: { list: { label: 'List', render: achievementsList } },
  services: { cards: { label: 'Cards', render: servicesCards } },
  testimonials: {
    quotes: { label: 'Quotes', render: testimonialsQuotes },
    cards: { label: 'Cards', render: testimonialsCards },
  },
  projects: {
    grid: { label: 'Grid band', render: projectsGrid },
    cards: { label: 'Cards', render: projectsCards },
    rows: { label: 'Showcase rows', render: projectsRows },
    gallery: { label: 'Gallery, two per row', render: projectsGallery },
    tiles: { label: 'Photo wall', render: projectsTiles },
    list: { label: 'Compact list', render: projectsList },
    cases: { label: 'Case studies', render: projectsCases },
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
  const key = section.variant in variants ? section.variant : Object.keys(variants)[0];
  const prev = current;
  current = { ctx, styled: !OWN_DESIGN.has(`${section.type}/${key}`) };
  try {
    return variants[key].render(ctx);
  } finally {
    current = prev;
  }
}

/** Whether a section has nothing to show for this person, so the theme leaves it out. */
export function isSectionEmpty(section: Section, info: Info): boolean {
  return renderSection(section, { info, php: makePhp('x'), radius: '0' }) === '';
}
