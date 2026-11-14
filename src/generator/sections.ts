import type { Info, Section, SectionType } from '../types';
import { block, buttons, columns, group, heading, list, paragraph } from './blocks';
import { cleanUrl, phpString, type Php } from './utils';

type Ctx = { info: Info; php: Php };
type Renderer = (ctx: Ctx) => string;


/* ---------- Hero ---------- */

function heroText({ info, php }: Ctx, center: boolean): string {
  const ctas = [{ label: php.t('View my work'), href: '#projects' }];
  if (info.email) ctas.push({ label: php.t('Contact me'), href: php.url(`mailto:${info.email}`) });
  return [
    heading(php.t(info.name), 1, center),
    paragraph(php.t(info.tagline), center),
    buttons(ctas, center),
  ].join('\n');
}

const heroCentered: Renderer = (ctx) =>
  group(heroText(ctx, true), { tagName: 'section', align: 'full', padY: 80 });

const heroSplit: Renderer = (ctx) => {
  const initials = ctx.info.name
    .split(/\s+/)
    .map((w) => w[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const badge = group(heading(ctx.php.t(initials || 'Hi'), 2, true), {
    background: 'accent',
    padY: 70,
  });
  return group(columns([heroText(ctx, false), badge]), {
    tagName: 'section',
    align: 'full',
    padY: 70,
  });
};

/* ---------- About ---------- */

const aboutText: Renderer = ({ info, php }) => {
  const meta = [info.university, info.location].filter(Boolean).join(' · ');
  return group(
    [
      heading(php.t('About me')),
      paragraph(php.t(info.bio)),
      meta ? paragraph(php.t(meta)) : '',
    ]
      .filter(Boolean)
      .join('\n'),
    { tagName: 'section', padY: 60 },
  );
};

/* ---------- Skills ---------- */

const skillsList: Renderer = ({ info, php }) => {
  const skills = info.skills.length ? info.skills : ['Add your skills'];
  return group([heading(php.t('Skills')), list(skills.map(php.t))].join('\n'), {
    tagName: 'section',
    padY: 50,
  });
};

/* ---------- WordPress contributions ---------- */

const contributionsList: Renderer = ({ info, php }) => {
  const items = info.contributions.length
    ? info.contributions.map(
        (c) => `<strong>${php.t(c.team)}</strong>: ${php.t(c.description)}`,
      )
    : [php.t('Add your WordPress contributions (Make teams, translations, meetups…)')];
  return group([heading(php.t('My WordPress journey')), list(items)].join('\n'), {
    tagName: 'section',
    padY: 50,
  });
};

/* ---------- Projects ---------- */

function projectCard({ php }: Ctx, p: Info['projects'][number]): string {
  const title = p.url
    ? `<a href="${php.url(p.url)}">${php.t(p.title)}</a>`
    : php.t(p.title);
  return [heading(title, 3), paragraph(php.t(p.description))].join('\n');
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

const projectsGrid: Renderer = (ctx) => {
  const cards = projectItems(ctx.info).map((p) => projectCard(ctx, p));
  const rows: string[] = [];
  for (let i = 0; i < cards.length; i += 3) rows.push(columns(cards.slice(i, i + 3)));
  return group([heading(ctx.php.t('Projects')), ...rows].join('\n'), {
    tagName: 'section',
    anchor: 'projects',
    align: 'full',
    padY: 60,
    background: 'accent',
  });
};

const projectsList: Renderer = (ctx) =>
  group(
    [heading(ctx.php.t('Projects')), ...projectItems(ctx.info).map((p) => projectCard(ctx, p))].join(
      '\n',
    ),
    { tagName: 'section', padY: 60, anchor: 'projects' },
  );

/* ---------- Latest posts ---------- */

const postsGrid: Renderer = ({ php }) => {
  const query = {
    queryId: 1,
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
  const template = block(
    'post-template',
    { layout: { type: 'grid', columnCount: 3 } },
    [block('post-title', { isLink: true, level: 3 }), block('post-date'), block('post-excerpt')].join(
      '\n',
    ),
  );
  return group(
    [
      heading(php.t('Latest posts')),
      block('query', query, `<div class="wp-block-query">\n${template}\n</div>`),
    ].join('\n'),
    { tagName: 'section', padY: 60, layout: { type: 'constrained', contentSize: '1200px' } },
  );
};

/* ---------- Contact ---------- */

const SOCIAL_SERVICES: Record<string, string> = {
  github: 'github',
  linkedin: 'linkedin',
  x: 'x',
  wordpress: 'wordpress',
};

export function socialLinks(info: Info): string {
  const links = Object.entries(info.socials)
    .filter(([, url]) => url && cleanUrl(url))
    .map(
      ([key, url]) =>
        // Written by hand: the url attribute holds PHP that must not be JSON-escaped.
        `<!-- wp:social-link {"url":"<?php echo esc_url( ${phpString(cleanUrl(url!))} ); ?>","service":"${SOCIAL_SERVICES[key]}"} /-->`,
    );
  if (!links.length) return '';
  return block(
    'social-links',
    { layout: { type: 'flex', justifyContent: 'center' } },
    `<ul class="wp-block-social-links">\n${links.join('\n')}\n</ul>`,
  );
}

const contactCta: Renderer = ({ info, php }) => {
  const parts = [
    heading(php.t("Let's work together"), 2, true),
    paragraph(php.t('Have a question or an idea? Get in touch.'), true),
  ];
  if (info.email) {
    parts.push(buttons([{ label: php.t('Email me'), href: php.url(`mailto:${info.email}`) }], true));
  }
  return group(parts.join('\n'), { tagName: 'section', align: 'full', padY: 70, background: 'accent' });
};

const contactFull: Renderer = ({ info, php }) => {
  const parts = [heading(php.t('Contact'), 1, true)];
  parts.push(paragraph(php.t('The best way to reach me is by email.'), true));
  if (info.email) {
    parts.push(
      paragraph(`<a href="${php.url(`mailto:${info.email}`)}">${php.t(info.email)}</a>`, true),
    );
  } else {
    parts.push(paragraph(php.t('[Add your email address]'), true));
  }
  if (info.location) parts.push(paragraph(php.t(info.location), true));
  const socials = socialLinks(info);
  if (socials) parts.push(socials);
  return group(parts.join('\n'), { tagName: 'section', padY: 80 });
};

/* ---------- Registry ---------- */

export const SECTIONS: Record<SectionType, Record<string, { label: string; render: Renderer }>> = {
  hero: {
    centered: { label: 'Centered', render: heroCentered },
    split: { label: 'Split', render: heroSplit },
  },
  about: { text: { label: 'Text', render: aboutText } },
  skills: { list: { label: 'List', render: skillsList } },
  contributions: { list: { label: 'List', render: contributionsList } },
  projects: {
    grid: { label: 'Grid', render: projectsGrid },
    list: { label: 'List', render: projectsList },
  },
  posts: { grid: { label: '3-column grid', render: postsGrid } },
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
