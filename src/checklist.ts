import { contrastRatio } from './color';
import { tr } from './i18n/ui';
import { isSectionEmpty, SECTION_LABELS } from './generator/sections';
import type { BuilderState } from './types';

/**
 * What to look at before downloading. "fix" items make the site look
 * unfinished or broken to a visitor; "tip" items are worth a moment.
 */
export type CheckItem = { level: 'fix' | 'tip'; text: string; step: 'info' | 'style' | 'layout' };

const isUrl = (u: string) => /^https?:\/\/\S+\.\S+/.test(u.trim());
const isEmail = (e: string) => /^\S+@\S+\.\S+$/.test(e.trim());

export function publishChecklist(state: BuilderState): CheckItem[] {
  const { info, style, pages } = state;
  const items: CheckItem[] = [];
  const fix = (text: string, step: CheckItem['step'] = 'info') => items.push({ level: 'fix', text: tr(text), step });
  const tip = (text: string, step: CheckItem['step'] = 'info') => items.push({ level: 'tip', text: tr(text), step });

  if (!info.name.trim() || info.name.trim() === 'Your Name') fix('Your site still says "Your Name". Add your name.');
  if (!info.avatar) fix('No profile photo: a grey placeholder figure will show instead. Upload a photo.');
  if (!info.bio.trim()) fix('No bio yet. Two or three lines about you make the site feel finished.');
  if (!info.email.trim()) tip('No email: the "Contact me" buttons and the contact call-to-action are left out.');
  else if (!isEmail(info.email)) fix(tr('"{email}" doesn\'t look like an email address.', { email: info.email }));

  const links: [string, string | undefined][] = [
    [tr('CV link'), info.cvUrl],
    ...Object.entries(info.socials).map(([k, v]) => [tr('{name} link', { name: k }), v] as [string, string | undefined]),
    ...info.projects.map((p) => [tr('Link of project "{name}"', { name: p.title || tr('untitled') }), p.url] as [string, string]),
    ...info.contributions.map((c) => [tr('Link of contribution "{name}"', { name: c.team || tr('untitled') }), c.url] as [string, string | undefined]),
    ...info.achievements.map((a) => [tr('Link of achievement "{name}"', { name: a.title || tr('untitled') }), a.url] as [string, string]),
  ];
  for (const [label, url] of links) {
    if (url?.trim() && !isUrl(url)) fix(tr('{label} should be a full address starting with https://', { label }));
  }

  if (info.projects.some((p) => !p.title.trim())) fix('A project has no title. Give it one or remove it.');
  if (info.projects.length && info.projects.every((p) => !p.image)) tip('Your projects use sample photos. Add a screenshot to each.');
  if (!info.projects.length) tip('No projects yet. Even one or two make a portfolio convincing.');

  if (contrastRatio(style.palette.contrast, style.palette.base) < 4.5) fix('Your text colour is hard to read on your background.', 'style');
  if (contrastRatio(style.palette.base, style.palette.primary) < 4.5) fix('Button text is hard to read on your primary colour.', 'style');

  const hidden = new Set<string>();
  for (const sections of Object.values(pages)) {
    for (const s of sections) if (isSectionEmpty(s, info)) hidden.add(tr(SECTION_LABELS[s.type]));
  }
  if (hidden.size) tip(tr('Left out because they are empty: {list}.', { list: [...hidden].join(', ') }), 'layout');

  return items;
}
