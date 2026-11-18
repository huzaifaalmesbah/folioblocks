/**
 * Pure helpers behind the Layout step: editing a page's section list,
 * saved layouts, and settings export/import. Kept free of React and the
 * store so they are easy to test.
 */
import { defaultState } from './defaults';
import { FONT_KEYS } from './fonts';
import { LOOK_KEYS } from './generator/looks';
import { isEnabled, SOURCE } from './i18n/languages';
import { SECTIONS } from './generator/sections';
import type { BuilderState, FooterVariant, HeaderVariant, Info, PageKey, Section, SectionType, Style } from './types';

/* ---------- Section lists ---------- */

export function newSectionId(): string {
  return `s-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

/** Append a section of `type`, using its first variant unless one is given. */
export function addSection(sections: Section[], type: SectionType, variant?: string): Section[] {
  const v = variant && SECTIONS[type][variant] ? variant : Object.keys(SECTIONS[type])[0];
  return [...sections, { id: newSectionId(), type, variant: v }];
}

export function removeSection(sections: Section[], id: string): Section[] {
  return sections.filter((s) => s.id !== id);
}

/** Move the section at `from` to `to` (indexes clamped to the list). */
export function moveSection(sections: Section[], from: number, to: number): Section[] {
  if (from < 0 || from >= sections.length) return sections;
  const target = Math.max(0, Math.min(sections.length - 1, to));
  if (from === target) return sections;
  const next = [...sections];
  const [item] = next.splice(from, 1);
  next.splice(target, 0, item);
  return next;
}

/* ---------- Saved layouts ---------- */

/** A layout the student saved: everything about the design, nothing about them. */
export type SavedLayout = {
  key: string;
  label: string;
  style: Style;
  header: HeaderVariant;
  footer: FooterVariant;
  pages: Record<PageKey, Section[]>;
  /** Saved by the builder itself, before a switch replaced a changed design. */
  auto?: boolean;
};

export function layoutFromState(state: BuilderState, label: string): SavedLayout {
  return {
    // Time plus randomness: two layouts made in the same millisecond must not share a key.
    key: `custom-${newSectionId().slice(2)}`,
    label: label.trim() || 'My layout',
    style: structuredClone(state.style),
    header: state.header,
    footer: state.footer,
    pages: structuredClone(state.pages),
  };
}

/* ---------- Settings export / import ---------- */

const FORMAT = 'folioblocks-settings';
const MAX_IMAGE_CHARS = 3_000_000; // ~2 MB of image per data URL is far more than a resized photo needs.

export type SettingsFile = {
  format: typeof FORMAT;
  version: 1;
  exported: string;
  state: BuilderState;
  layouts: SavedLayout[];
};

export function exportSettings(state: BuilderState, layouts: SavedLayout[]): string {
  const file: SettingsFile = { format: FORMAT, version: 1, exported: new Date().toISOString(), state, layouts };
  return `${JSON.stringify(file, null, 2)}\n`;
}

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);
const str = (v: unknown, fallback = '') => (typeof v === 'string' ? v.slice(0, 2000) : fallback);
const HEX = /^#[0-9a-f]{6}$/i;

function image(v: unknown): string {
  return typeof v === 'string' && v.startsWith('data:image/') && v.length <= MAX_IMAGE_CHARS ? v : '';
}

function sections(v: unknown, fallback: Section[]): Section[] {
  if (!Array.isArray(v)) return structuredClone(fallback);
  return v
    .filter(isObj)
    .filter((s) => typeof s.type === 'string' && s.type in SECTIONS)
    .map((s) => {
      const type = s.type as SectionType;
      const variant = typeof s.variant === 'string' && SECTIONS[type][s.variant] ? s.variant : Object.keys(SECTIONS[type])[0];
      return { id: typeof s.id === 'string' && s.id ? s.id.slice(0, 64) : newSectionId(), type, variant };
    })
    .slice(0, 30);
}

function style(v: unknown): Style {
  const d = defaultState.style;
  if (!isObj(v)) return structuredClone(d);
  const p = isObj(v.palette) ? v.palette : {};
  const palette = Object.fromEntries(
    (Object.keys(d.palette) as (keyof Style['palette'])[]).map((k) => [k, HEX.test(String(p[k])) ? String(p[k]) : d.palette[k]]),
  ) as Style['palette'];
  const f = isObj(v.fonts) ? v.fonts : {};
  const font = (x: unknown, fb: Style['fonts']['heading']) => (FONT_KEYS.includes(x as never) ? (x as typeof fb) : fb);
  const radius = ['none', 'sm', 'md', 'lg'].includes(v.radius as string) ? (v.radius as Style['radius']) : d.radius;
  const look = LOOK_KEYS.includes(v.look as never) ? (v.look as Style['look']) : undefined;
  return { palette, fonts: { heading: font(f.heading, d.fonts.heading), body: font(f.body, d.fonts.body) }, radius, ...(look && { look }) };
}

function pages(v: unknown): Record<PageKey, Section[]> {
  const o = isObj(v) ? v : {};
  return {
    home: sections(o.home, defaultState.pages.home),
    about: sections(o.about, defaultState.pages.about),
    contact: sections(o.contact, defaultState.pages.contact),
  };
}

const header = (v: unknown): HeaderVariant => (v === 'centered' ? 'centered' : 'inline');
const footer = (v: unknown): FooterVariant => (v === 'split' ? 'split' : 'centered');

/** Keep only known, well-formed profile fields; anything else falls back to empty or the default. */
export function sanitizeInfo(raw: unknown): Info {
  const i = isObj(raw) ? raw : {};
  const d = defaultState.info;
  return {
    name: str(i.name, d.name),
    tagline: str(i.tagline, d.tagline),
    university: str(i.university),
    location: str(i.location),
    bio: str(i.bio),
    email: str(i.email),
    skills: Array.isArray(i.skills) ? i.skills.filter((x) => typeof x === 'string').map((x) => x.slice(0, 100)).slice(0, 50) : d.skills,
    contributions: Array.isArray(i.contributions)
      ? i.contributions
          .filter(isObj)
          .map((c) => ({ team: str(c.team), description: str(c.description), date: str(c.date), url: str(c.url) }))
          .slice(0, 30)
      : [],
    experience: Array.isArray(i.experience)
      ? i.experience
          .filter(isObj)
          .map((e) => ({ role: str(e.role), org: str(e.org), period: str(e.period), description: str(e.description) }))
          .slice(0, 20)
      : [],
    education: Array.isArray(i.education)
      ? i.education.filter(isObj).map((e) => ({ degree: str(e.degree), school: str(e.school), period: str(e.period) })).slice(0, 10)
      : [],
    achievements: Array.isArray(i.achievements)
      ? i.achievements
          .filter(isObj)
          .map((a) => ({ title: str(a.title), issuer: str(a.issuer), year: str(a.year), url: str(a.url) }))
          .slice(0, 30)
      : [],
    services: Array.isArray(i.services)
      ? i.services.filter(isObj).map((x) => ({ title: str(x.title), description: str(x.description) })).slice(0, 12)
      : [],
    testimonials: Array.isArray(i.testimonials)
      ? i.testimonials.filter(isObj).map((x) => ({ quote: str(x.quote), name: str(x.name), role: str(x.role) })).slice(0, 12)
      : [],
    cvUrl: str(i.cvUrl),
    projects: Array.isArray(i.projects)
      ? i.projects
          .filter(isObj)
          .map((p) => ({ title: str(p.title), description: str(p.description), url: str(p.url), ...(image(p.image) && { image: image(p.image) }) }))
          .slice(0, 12)
      : [],
    socials: isObj(i.socials)
      ? Object.fromEntries(
          ['github', 'linkedin', 'x', 'wordpress']
            .map((k) => [k, str((i.socials as Obj)[k])])
            .filter(([, url]) => url),
        )
      : {},
    avatar: image(i.avatar),
  };
}

/**
 * Read a settings file, keeping only known, well-formed values: anything
 * missing or odd falls back to the defaults, so a hand-edited or older file
 * can't break the app or the generated theme.
 */
export function parseSettings(text: string): { state: BuilderState; layouts: SavedLayout[] } {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('This file is not valid JSON.');
  }
  if (!isObj(data) || data.format !== FORMAT || !isObj(data.state)) {
    throw new Error('This is not a FolioBlocks settings file.');
  }
  const s = data.state;
  const state: BuilderState = {
    info: sanitizeInfo(s.info),
    style: style(s.style),
    language: isEnabled(s.language) ? s.language : SOURCE,
    preset: str(s.preset, defaultState.preset),
    header: header(s.header),
    footer: footer(s.footer),
    pages: pages(s.pages),
  };
  const layouts: SavedLayout[] = Array.isArray(data.layouts)
    ? data.layouts.filter(isObj).slice(0, 20).map((l) => ({
        key: str(l.key) || `custom-${newSectionId()}`,
        label: str(l.label, 'My layout').slice(0, 60),
        style: style(l.style),
        header: header(l.header),
        footer: footer(l.footer),
        pages: pages(l.pages),
      }))
    : [];
  return { state, layouts };
}
