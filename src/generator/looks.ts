/**
 * Looks: what gives a preset its character (a terminal window, tiles, thick
 * brutalist borders…), built only from what WordPress core offers, the way
 * Ipsum does it, with no custom CSS:
 *
 * - `theme.json` settings and styles: layout widths, shadow and gradient
 *   presets, element styles (buttons, headings) and per-block styles.
 * - Block style variations in `styles/blocks/*.json` (the class is
 *   `is-style-<slug>`), so they show in the block's Styles panel.
 * - Block attributes on our own markup: borders, shadows, gradients, grid
 *   spans, inline text colours. Those are set by the section renderers,
 *   which read `section`, `card` and `headings` below.
 *
 * Everything uses the palette's slugs, so every look works with every palette.
 */
import type { Look, Style } from '../types';
import { RADIUS } from './themeJson';

type Json = Record<string, unknown>;

export type BlockStyleDef = { slug: string; title: string; blockTypes: string[]; styles: Json };

export type LookDef = {
  label: string;
  description: string;
  /** Merged into theme.json `settings`. */
  settings?: (style: Style) => Json;
  /** Merged into theme.json `styles`. */
  styles?: (style: Style) => Json;
  /** Block style variations, written to styles/blocks/<slug>.json. */
  blockStyles?: (style: Style) => BlockStyleDef[];
  /** How the main element of the Home, About and Contact templates is laid out. */
  frame?: 'constrained' | 'sheet';
  /** Applied to every page section (except the heroes that are a design of their own). */
  section?: { style?: string; dropAlign?: boolean };
  /** Applied to cards: the Surface-coloured groups inside sections. */
  card?: {
    /** Background for cards inside a styled section, which already has the Surface colour. */
    background?: string;
    border?: { color: string; width: string };
    shadow?: string;
  };
  /** A gradient preset (from `settings`) for the profile cover banner. */
  banner?: string;
  /** A prefix on each section heading: a `$` prompt, or a running number like "01 —". */
  headings?: 'prompt' | 'number';
};

const color = (slug: string) => `var:preset|color|${slug}`;
const cssColor = (slug: string) => `var(--wp--preset--color--${slug})`;
const solid = (slug: string, width: string) => ({ color: color(slug), style: 'solid', width });

/** A group style that turns a section into a card. */
function sectionCard(slug: string, title: string, radius: string): BlockStyleDef {
  return {
    slug,
    title,
    blockTypes: ['core/group'],
    styles: {
      color: { background: color('accent-5') },
      border: { ...solid('accent-6', '1px'), radius },
      spacing: { padding: { left: 'var:preset|spacing|50', right: 'var:preset|spacing|50' } },
    },
  };
}

const pillButton = { border: { radius: '999px' } };

export const LOOKS: Record<Look, LookDef> = {
  plain: { label: 'Plain', description: 'Just your colours and fonts.' },

  profile: {
    label: 'Profile',
    description: 'Each section on its own card, like a social profile.',
    settings: () => ({
      layout: { contentSize: '880px' },
      color: { gradients: [{ slug: 'cover', name: 'Cover', gradient: `linear-gradient(120deg, ${cssColor('accent-1')} 0%, ${cssColor('accent-3')} 100%)` }] },
    }),
    blockStyles: () => [sectionCard('section-card', 'Card', '16px')],
    banner: 'cover',
    frame: 'constrained',
    section: { style: 'section-card', dropAlign: true },
    card: { background: 'base' },
  },

  terminal: {
    label: 'Terminal',
    description: 'A terminal window, $ prompts before headings, outlined panes and buttons.',
    settings: () => ({
      layout: { contentSize: '960px' },
      shadow: { defaultPresets: false, presets: [{ slug: 'deep', name: 'Deep', shadow: '0 30px 80px -40px rgba(0, 0, 0, 0.6)' }] },
    }),
    styles: () => ({
      elements: {
        button: {
          color: { background: 'transparent', text: color('accent-1') },
          border: solid('accent-1', '1px'),
          ':hover': { color: { background: color('accent-1'), text: color('base') } },
        },
      },
    }),
    blockStyles: ({ radius }) => [sectionCard('section-pane', 'Pane', RADIUS[radius])],
    frame: 'constrained',
    section: { style: 'section-pane', dropAlign: true },
    card: { background: 'base', border: { color: 'accent-6', width: '1px' } },
    headings: 'prompt',
  },

  bento: {
    label: 'Bento',
    description: 'Everything on rounded tiles in a grid.',
    settings: () => ({ layout: { contentSize: '1280px' } }),
    styles: () => ({ elements: { button: pillButton } }),
    blockStyles: () => [sectionCard('section-tile', 'Tile', '28px')],
    frame: 'constrained',
    section: { style: 'section-tile', dropAlign: true },
    card: { background: 'base', border: { color: 'accent-6', width: '1px' } },
  },

  sheet: {
    label: 'Résumé sheet',
    description: 'Your pages sit on a white sheet, with small caps section headings.',
    settings: () => ({
      shadow: { defaultPresets: false, presets: [{ slug: 'paper', name: 'Paper', shadow: '0 24px 60px -28px rgba(0, 0, 0, 0.35)' }] },
    }),
    styles: () => ({
      elements: {
        h2: { typography: { fontSize: 'var:preset|font-size|small', textTransform: 'uppercase', letterSpacing: '0.14em' }, color: { text: color('accent-1') } },
        h3: { typography: { fontSize: 'var:preset|font-size|medium' } },
      },
    }),
    frame: 'sheet',
    section: { dropAlign: true },
    card: { background: 'base' },
  },

  editorial: {
    label: 'Editorial',
    description: 'Huge headlines, numbered sections, fine rules and outline buttons.',
    styles: () => ({
      elements: {
        h1: { typography: { fontSize: 'clamp(3rem, 3rem + ((1vw - 0.2rem) * 4), 7rem)', lineHeight: '0.95', fontWeight: '500', letterSpacing: '-0.035em' } },
        h2: { typography: { fontSize: 'clamp(2.2rem, 2.2rem + ((1vw - 0.2rem) * 1.8), 4rem)', lineHeight: '1.05', fontWeight: '500' } },
        button: {
          color: { background: 'transparent', text: color('contrast') },
          border: { ...solid('contrast', '1px'), radius: '999px' },
          ':hover': { color: { background: color('contrast'), text: color('base') } },
        },
      },
      blocks: {
        'core/quote': {
          typography: { fontSize: 'clamp(1.5rem, 1.5rem + ((1vw - 0.2rem) * 1), 2.4rem)', fontStyle: 'italic', lineHeight: '1.25' },
        },
      },
    }),
    blockStyles: () => [
      { slug: 'section-rule', title: 'Rule above', blockTypes: ['core/group'], styles: { border: { top: solid('contrast', '1px') } } },
    ],
    section: { style: 'section-rule' },
    headings: 'number',
  },

  aurora: {
    label: 'Aurora',
    description: 'Soft colour glows behind see-through cards, pill buttons that glow.',
    settings: () => ({
      shadow: { defaultPresets: false, presets: [{ slug: 'glow', name: 'Glow', shadow: `0 10px 34px -12px ${cssColor('accent-1')}` }] },
    }),
    styles: () => ({
      color: {
        gradient: [
          `radial-gradient(60% 40% at 15% 0%, color-mix(in srgb, ${cssColor('accent-1')} 22%, transparent), transparent 70%)`,
          `radial-gradient(50% 35% at 90% 12%, color-mix(in srgb, ${cssColor('accent-3')} 24%, transparent), transparent 70%)`,
          cssColor('base'),
        ].join(', '),
      },
      elements: { button: { ...pillButton, shadow: 'var:preset|shadow|glow' } },
    }),
    card: { border: { color: 'accent-6', width: '1px' } },
  },

  brutal: {
    label: 'Brutal',
    description: 'Thick borders, hard shadows, uppercase headings and loud colour.',
    settings: () => ({
      shadow: { defaultPresets: false, presets: [{ slug: 'hard', name: 'Hard', shadow: `6px 6px 0 ${cssColor('contrast')}` }] },
    }),
    styles: () => ({
      elements: {
        heading: { typography: { textTransform: 'uppercase', fontWeight: '800' } },
        button: { border: solid('contrast', '3px'), shadow: 'var:preset|shadow|hard', typography: { fontWeight: '700' } },
      },
      blocks: {
        'core/image': { border: solid('contrast', '3px'), shadow: 'var:preset|shadow|hard' },
        'core/quote': {
          border: solid('contrast', '3px'),
          shadow: 'var:preset|shadow|hard',
          color: { background: color('base') },
          spacing: { padding: { top: 'var:preset|spacing|40', right: 'var:preset|spacing|40', bottom: 'var:preset|spacing|40', left: 'var:preset|spacing|40' } },
        },
      },
    }),
    card: { border: { color: 'contrast', width: '3px' }, shadow: 'hard' },
  },

  journey: {
    label: 'Journey',
    description: 'Calm bordered cards for your career story.',
    card: { border: { color: 'accent-6', width: '1px' } },
  },
};

export const LOOK_KEYS = Object.keys(LOOKS) as Look[];

export function lookDef(style: Style): LookDef {
  return LOOKS[style.look ?? 'plain'] ?? LOOKS.plain;
}

/** Deep merge for theme.json objects. Arrays and values from `b` replace those in `a`. */
export function mergeJson(a: Json, b: Json): Json {
  const out: Json = { ...a };
  for (const [k, v] of Object.entries(b)) {
    const prev = out[k];
    out[k] =
      v && typeof v === 'object' && !Array.isArray(v) && prev && typeof prev === 'object' && !Array.isArray(prev)
        ? mergeJson(prev as Json, v as Json)
        : v;
  }
  return out;
}
