import type { FooterVariant, HeaderVariant, Language, PageKey, Palette, Section, Style } from './types';

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
    key: 'ocean',
    label: 'Ocean',
    palette: { primary: '#0b62a8', secondary: '#0c3b5e', base: '#ffffff', contrast: '#0f2231', accent: '#e6f1f9' },
  },
  {
    key: 'paper',
    label: 'Paper',
    palette: { primary: '#8a4b1f', secondary: '#4a2a12', base: '#faf7f2', contrast: '#2b2118', accent: '#f0e8dc' },
  },
  {
    key: 'shapla',
    label: 'Shapla',
    palette: { primary: '#006a4e', secondary: '#b3202f', base: '#ffffff', contrast: '#1a1a1a', accent: '#e6f3ee' },
  },
  {
    key: 'electric',
    label: 'Electric',
    palette: { primary: '#4f46e5', secondary: '#111827', base: '#ffffff', contrast: '#111827', accent: '#eef2ff' },
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
  /** Who it suits, shown in the gallery. */
  bestFor: string;
  /** Set when the template is written for a language; applying it switches the site language. */
  language?: Language;
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
    bestFor: 'Anyone: a clean, friendly start',
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
    bestFor: 'Designers and creative work',
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
    bestFor: 'Developers and plugin authors',
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
    bestFor: 'Researchers and academic profiles',
    style: { palette: palette('forest'), fonts: { heading: 'lora', body: 'lora' }, radius: 'none' },
    header: 'inline',
    footer: 'split',
    pages: {
      home: [s('hero', 'profile'), s('contributions', 'list'), s('projects', 'list'), s('posts', 'list'), s('contact', 'cta')],
      about: [s('about', 'columns'), s('skills', 'list'), s('experience', 'timeline'), s('education', 'list'), s('contributions', 'list'), s('achievements', 'list')],
      contact: [s('contact', 'full')],
    },
  },
  {
    key: 'contributor',
    label: 'Contributor',
    description: 'Your WordPress work first: numbers at a glance, a dated contribution timeline, then projects.',
    bestFor: 'WordPress Credits and Campus Connect students',
    style: { palette: palette('ocean'), fonts: { heading: 'space-grotesk', body: 'inter' }, radius: 'md' },
    header: 'inline',
    footer: 'split',
    pages: {
      home: [s('hero', 'split'), s('stats', 'row'), s('contributions', 'timeline'), s('projects', 'cards'), s('posts', 'grid'), s('contact', 'cta')],
      about: [s('about', 'photo'), s('skills', 'badges'), s('experience', 'timeline'), s('education', 'list'), s('achievements', 'list')],
      contact: [s('contact', 'full')],
    },
  },
  {
    key: 'resume',
    label: 'Resume',
    description: 'A one-page CV: profile, experience, education, skills and achievements on the home page.',
    bestFor: 'Job and internship applications',
    style: { palette: palette('mono'), fonts: { heading: 'dm-sans', body: 'dm-sans' }, radius: 'sm' },
    header: 'inline',
    footer: 'split',
    pages: {
      home: [s('hero', 'profile'), s('experience', 'timeline'), s('education', 'list'), s('skills', 'badges'), s('achievements', 'list'), s('projects', 'list'), s('contact', 'cta')],
      about: [s('about', 'text'), s('contributions', 'list')],
      contact: [s('contact', 'full')],
    },
  },
  {
    key: 'writer',
    label: 'Writer',
    description: 'Words first: a quiet intro, then your latest posts. Serif headings on warm paper.',
    bestFor: 'Bloggers and people who like to write',
    style: { palette: palette('paper'), fonts: { heading: 'lora', body: 'inter' }, radius: 'sm' },
    header: 'centered',
    footer: 'centered',
    pages: {
      home: [s('hero', 'centered'), s('posts', 'list'), s('about', 'text'), s('contact', 'cta')],
      about: [s('about', 'photo'), s('experience', 'compact'), s('education', 'list'), s('skills', 'list')],
      contact: [s('contact', 'full')],
    },
  },
  {
    key: 'bangla',
    label: 'বাংলা (Bangla)',
    description: 'Headings, buttons and menu in Bengali, with a Bengali font. Write your own text in Bangla.',
    bestFor: 'Sites written in Bengali',
    language: 'bn',
    style: { palette: palette('shapla'), fonts: { heading: 'noto-sans-bengali', body: 'noto-sans-bengali' }, radius: 'md' },
    header: 'inline',
    footer: 'centered',
    pages: {
      home: [s('hero', 'avatar'), s('about', 'text'), s('skills', 'badges'), s('projects', 'grid'), s('posts', 'grid'), s('contact', 'cta')],
      about: [s('about', 'photo'), s('experience', 'timeline'), s('education', 'list'), s('contributions', 'list'), s('achievements', 'list')],
      contact: [s('contact', 'full')],
    },
  },
  {
    key: 'designer',
    label: 'Designer',
    description: 'Your work does the talking: a short intro, then a large two-column gallery.',
    bestFor: 'Designers, illustrators and UI work',
    style: { palette: palette('rose'), fonts: { heading: 'space-grotesk', body: 'dm-sans' }, radius: 'none' },
    header: 'inline',
    footer: 'centered',
    pages: {
      home: [s('hero', 'centered'), s('projects', 'gallery'), s('skills', 'badges'), s('testimonials', 'quotes'), s('contact', 'cta')],
      about: [s('about', 'photo'), s('experience', 'timeline'), s('education', 'list'), s('achievements', 'list')],
      contact: [s('contact', 'full')],
    },
  },
  {
    key: 'freelancer',
    label: 'Freelancer',
    description: 'What you offer, proof it works, and an easy way to hire you.',
    bestFor: 'Freelancers and students taking client work',
    style: { palette: palette('ocean'), fonts: { heading: 'dm-sans', body: 'dm-sans' }, radius: 'lg' },
    header: 'inline',
    footer: 'split',
    pages: {
      home: [s('hero', 'split'), s('services', 'cards'), s('projects', 'cards'), s('testimonials', 'quotes'), s('contact', 'cta')],
      about: [s('about', 'photo'), s('skills', 'badges'), s('experience', 'timeline'), s('education', 'list')],
      contact: [s('contact', 'full')],
    },
  },
  {
    key: 'bold',
    label: 'Bold',
    description: 'A dark colour band with your name in big type, numbers at a glance and strong buttons.',
    bestFor: 'Standing out fast',
    style: { palette: palette('electric'), fonts: { heading: 'space-grotesk', body: 'inter' }, radius: 'lg' },
    header: 'inline',
    footer: 'centered',
    pages: {
      home: [s('hero', 'band'), s('stats', 'row'), s('about', 'columns'), s('projects', 'grid'), s('posts', 'grid'), s('contact', 'cta')],
      about: [s('about', 'photo'), s('skills', 'badges'), s('experience', 'timeline'), s('education', 'list'), s('contributions', 'cards')],
      contact: [s('contact', 'full')],
    },
  },
  {
    key: 'photographer',
    label: 'Photographer',
    description: 'A wall of square photos under a quiet name. Almost no words.',
    bestFor: 'Photographers and visual diaries',
    style: { palette: palette('mono'), fonts: { heading: 'playfair-display', body: 'inter' }, radius: 'none' },
    header: 'centered',
    footer: 'centered',
    pages: {
      home: [s('hero', 'centered'), s('projects', 'tiles'), s('about', 'text'), s('contact', 'cta')],
      about: [s('about', 'photo'), s('achievements', 'list'), s('testimonials', 'quotes')],
      contact: [s('contact', 'full')],
    },
  },
];

export function presetByKey(key: string): PresetDef {
  return PRESETS.find((p) => p.key === key) ?? PRESETS[0];
}
