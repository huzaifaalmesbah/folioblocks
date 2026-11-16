import type { FooterVariant, HeaderVariant, PageKey, Palette, Section, Style } from './types';

export type PaletteDef = { key: string; label: string; palette: Palette };

export const PALETTES: PaletteDef[] = [
  {
    key: 'wordpress-blue',
    label: 'WordPress Blue',
    palette: { primary: '#3858e9', secondary: '#1e1e1e', base: '#ffffff', contrast: '#1e1e1e', accent: '#f0f3ff' },
  },
  {
    key: 'sunset',
    label: 'Sunset',
    palette: { primary: '#c2410c', secondary: '#7c2d12', base: '#fffaf5', contrast: '#292524', accent: '#ffedd5' },
  },
  {
    key: 'midnight',
    label: 'Midnight',
    palette: { primary: '#38bdf8', secondary: '#f472b6', base: '#0f172a', contrast: '#e2e8f0', accent: '#1e293b' },
  },
  {
    key: 'forest',
    label: 'Forest',
    palette: { primary: '#2f6b4f', secondary: '#1f3d30', base: '#fdfcf8', contrast: '#1c2420', accent: '#e9f1ec' },
  },
  {
    key: 'rose',
    label: 'Rose',
    palette: { primary: '#be185d', secondary: '#831843', base: '#fffbfd', contrast: '#27151d', accent: '#fce7f3' },
  },
  {
    key: 'mono',
    label: 'Monochrome',
    palette: { primary: '#111111', secondary: '#525252', base: '#ffffff', contrast: '#111111', accent: '#f4f4f5' },
  },
];

const palette = (key: string) => PALETTES.find((p) => p.key === key)!.palette;

export type PresetDef = {
  key: string;
  label: string;
  description: string;
  style: Style;
  header: HeaderVariant;
  footer: FooterVariant;
  pages: Record<PageKey, Section[]>;
};

let n = 0;
const s = (type: Section['type'], variant: string): Section => ({ id: `s${++n}`, type, variant });

export const PRESETS: PresetDef[] = [
  {
    key: 'minimal',
    label: 'Minimal',
    description: 'Round photo, centered name, a clean project grid. Calm and simple.',
    style: { palette: palette('wordpress-blue'), fonts: { heading: 'inter', body: 'inter' }, radius: 'md' },
    header: 'inline',
    footer: 'centered',
    pages: {
      home: [s('hero', 'avatar'), s('about', 'text'), s('projects', 'grid'), s('posts', 'grid'), s('contact', 'cta')],
      about: [s('about', 'photo'), s('skills', 'list'), s('experience', 'timeline'), s('education', 'list'), s('contributions', 'list'), s('achievements', 'list')],
      contact: [s('contact', 'full')],
    },
  },
  {
    key: 'creative',
    label: 'Creative',
    description: 'Big serif type beside your photo, large showcase rows. Warm colours.',
    style: { palette: palette('sunset'), fonts: { heading: 'playfair-display', body: 'dm-sans' }, radius: 'lg' },
    header: 'centered',
    footer: 'centered',
    pages: {
      home: [s('hero', 'big'), s('skills', 'badges'), s('projects', 'rows'), s('posts', 'grid'), s('contact', 'cta')],
      about: [s('about', 'photo'), s('skills', 'badges'), s('experience', 'timeline'), s('education', 'list'), s('contributions', 'cards'), s('achievements', 'list')],
      contact: [s('contact', 'full')],
    },
  },
  {
    key: 'developer',
    label: 'Developer',
    description: 'Dark mode, monospace headings, project cards and a post list with thumbnails.',
    style: { palette: palette('midnight'), fonts: { heading: 'jetbrains-mono', body: 'inter' }, radius: 'sm' },
    header: 'inline',
    footer: 'split',
    pages: {
      home: [s('hero', 'split'), s('skills', 'badges'), s('projects', 'cards'), s('contributions', 'cards'), s('posts', 'list'), s('contact', 'cta')],
      about: [s('about', 'columns'), s('skills', 'list'), s('experience', 'timeline'), s('education', 'list'), s('contributions', 'list'), s('achievements', 'list')],
      contact: [s('contact', 'full')],
    },
  },
  {
    key: 'academic',
    label: 'Academic',
    description: 'A research profile: portrait beside your details and bio, serif type, compact lists.',
    style: { palette: palette('forest'), fonts: { heading: 'lora', body: 'lora' }, radius: 'none' },
    header: 'inline',
    footer: 'split',
    pages: {
      home: [s('hero', 'profile'), s('contributions', 'list'), s('projects', 'list'), s('posts', 'list'), s('contact', 'cta')],
      about: [s('about', 'columns'), s('skills', 'list'), s('experience', 'timeline'), s('education', 'list'), s('contributions', 'list'), s('achievements', 'list')],
      contact: [s('contact', 'full')],
    },
  },
];

export function presetByKey(key: string): PresetDef {
  return PRESETS.find((p) => p.key === key) ?? PRESETS[0];
}
