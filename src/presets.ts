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
  {
    key: 'slate',
    label: 'Slate',
    palette: { primary: '#2563eb', secondary: '#1e3a8a', base: '#eef2f7', contrast: '#0f172a', accent: '#ffffff' },
  },
  {
    key: 'terminal',
    label: 'Terminal',
    palette: { primary: '#4ade80', secondary: '#38bdf8', base: '#0b0f14', contrast: '#d6e2ee', accent: '#111820' },
  },
  {
    key: 'canvas',
    label: 'Canvas',
    palette: { primary: '#4f46e5', secondary: '#312e81', base: '#f3f1ec', contrast: '#17171c', accent: '#ffffff' },
  },
  {
    key: 'ink',
    label: 'Ink',
    palette: { primary: '#1f4e79', secondary: '#0f2740', base: '#eef1f5', contrast: '#1b1f24', accent: '#ffffff' },
  },
  {
    key: 'newsprint',
    label: 'Newsprint',
    palette: { primary: '#b8361c', secondary: '#1a1714', base: '#f5efe3', contrast: '#1a1714', accent: '#ebe2d0' },
  },
  {
    key: 'aurora',
    label: 'Aurora',
    palette: { primary: '#5eead4', secondary: '#a78bfa', base: '#0b1028', contrast: '#e7ecff', accent: '#18204a' },
  },
  {
    key: 'pop',
    label: 'Pop',
    palette: { primary: '#2b44ff', secondary: '#111111', base: '#fff4d6', contrast: '#111111', accent: '#ffd23f' },
  },
  {
    key: 'sage',
    label: 'Sage',
    palette: { primary: '#1f6b45', secondary: '#9a3f1c', base: '#faf7f0', contrast: '#1f2a24', accent: '#eef2ea' },
  },
];

const palette = (key: string) => PALETTES.find((p) => p.key === key)!.palette;

export type PresetDef = {
  key: string;
  label: string;
  description: string;
  /** Who it suits, shown in the gallery. */
  bestFor: string;
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
  {
    key: 'profile',
    label: 'Profile',
    description: 'A cover banner with your photo over it, then each part of your story on its own card.',
    bestFor: 'Developers with a job, and anyone with work history',
    style: { palette: palette('slate'), fonts: { heading: 'space-grotesk', body: 'inter' }, radius: 'md', look: 'profile' },
    header: 'inline',
    footer: 'centered',
    pages: {
      home: [s('hero', 'cover'), s('about', 'text'), s('experience', 'steps'), s('projects', 'cards'), s('contributions', 'timeline'), s('testimonials', 'cards'), s('contact', 'cta')],
      about: [s('about', 'photo'), s('skills', 'badges'), s('experience', 'steps'), s('education', 'list'), s('achievements', 'list'), s('contributions', 'list')],
      contact: [s('contact', 'full')],
    },
  },
  {
    key: 'terminal',
    label: 'Terminal',
    description: 'Your intro in a terminal window, code-style headings and outlined panes. All monospace.',
    bestFor: 'CSE students and developers',
    style: { palette: palette('terminal'), fonts: { heading: 'jetbrains-mono', body: 'jetbrains-mono' }, radius: 'sm', look: 'terminal' },
    header: 'inline',
    footer: 'centered',
    pages: {
      home: [s('hero', 'terminal'), s('skills', 'badges'), s('experience', 'steps'), s('projects', 'cards'), s('contributions', 'timeline'), s('contact', 'cta')],
      about: [s('about', 'columns'), s('skills', 'list'), s('experience', 'steps'), s('education', 'list'), s('achievements', 'list')],
      contact: [s('contact', 'full')],
    },
  },
  {
    key: 'bento',
    label: 'Bento',
    description: 'Everything at a glance in a grid of rounded tiles: you, where you are, skills, numbers, contact.',
    bestFor: 'Students and junior developers',
    style: { palette: palette('canvas'), fonts: { heading: 'space-grotesk', body: 'dm-sans' }, radius: 'lg', look: 'bento' },
    header: 'inline',
    footer: 'centered',
    pages: {
      home: [s('hero', 'bento'), s('projects', 'cards'), s('experience', 'steps'), s('testimonials', 'cards'), s('posts', 'grid'), s('contact', 'cta')],
      about: [s('about', 'photo'), s('skills', 'badges'), s('experience', 'steps'), s('education', 'list'), s('contributions', 'cards'), s('achievements', 'list')],
      contact: [s('contact', 'full')],
    },
  },
  {
    key: 'sheet',
    label: 'Résumé Sheet',
    description: 'Your CV on a white sheet: compact sections and small caps headings.',
    bestFor: 'Job applications in any field',
    style: { palette: palette('ink'), fonts: { heading: 'lora', body: 'inter' }, radius: 'sm', look: 'sheet' },
    header: 'inline',
    footer: 'centered',
    pages: {
      home: [s('hero', 'profile'), s('experience', 'steps'), s('projects', 'list'), s('education', 'list'), s('skills', 'badges'), s('achievements', 'list'), s('contact', 'cta')],
      about: [s('about', 'text'), s('contributions', 'list'), s('testimonials', 'cards')],
      contact: [s('contact', 'full')],
    },
  },
  {
    key: 'editorial',
    label: 'Editorial',
    description: 'Magazine style: huge serif headlines, numbered sections and big case studies.',
    bestFor: 'Product and UI/UX designers',
    style: { palette: palette('newsprint'), fonts: { heading: 'playfair-display', body: 'inter' }, radius: 'none', look: 'editorial' },
    header: 'inline',
    footer: 'centered',
    pages: {
      home: [s('hero', 'big'), s('projects', 'cases'), s('about', 'columns'), s('services', 'cards'), s('testimonials', 'quotes'), s('posts', 'list'), s('contact', 'cta')],
      about: [s('about', 'photo'), s('experience', 'compact'), s('skills', 'badges'), s('education', 'list'), s('achievements', 'list')],
      contact: [s('contact', 'full')],
    },
  },
  {
    key: 'aurora',
    label: 'Aurora',
    description: 'Dark, with soft colour glows and glowing pill buttons.',
    bestFor: 'New graduates looking for a first job',
    style: { palette: palette('aurora'), fonts: { heading: 'space-grotesk', body: 'dm-sans' }, radius: 'lg', look: 'aurora' },
    header: 'inline',
    footer: 'centered',
    pages: {
      home: [s('hero', 'split'), s('about', 'columns'), s('skills', 'badges'), s('projects', 'cards'), s('experience', 'steps'), s('testimonials', 'cards'), s('posts', 'grid'), s('contact', 'cta')],
      about: [s('about', 'photo'), s('education', 'list'), s('contributions', 'cards'), s('achievements', 'list')],
      contact: [s('contact', 'full')],
    },
  },
  {
    key: 'brutal',
    label: 'Brutal',
    description: 'Thick black borders, hard shadows and loud colour.',
    bestFor: 'Graphic and brand design students',
    style: { palette: palette('pop'), fonts: { heading: 'space-grotesk', body: 'dm-sans' }, radius: 'sm', look: 'brutal' },
    header: 'inline',
    footer: 'centered',
    pages: {
      home: [s('hero', 'big'), s('skills', 'strip'), s('projects', 'gallery'), s('services', 'cards'), s('testimonials', 'cards'), s('contact', 'cta')],
      about: [s('about', 'photo'), s('experience', 'steps'), s('education', 'list'), s('achievements', 'list')],
      contact: [s('contact', 'full')],
    },
  },
  {
    key: 'journey',
    label: 'Journey',
    description: 'Your career as a story: each role a stop on a timeline, left and right.',
    bestFor: 'Job holders and career changers',
    style: { palette: palette('sage'), fonts: { heading: 'lora', body: 'inter' }, radius: 'md', look: 'journey' },
    header: 'inline',
    footer: 'centered',
    pages: {
      home: [s('hero', 'split'), s('stats', 'row'), s('experience', 'alternating'), s('projects', 'cards'), s('services', 'cards'), s('testimonials', 'cards'), s('contact', 'cta')],
      about: [s('about', 'photo'), s('skills', 'badges'), s('education', 'list'), s('achievements', 'list')],
      contact: [s('contact', 'full')],
    },
  },
];

export function presetByKey(key: string): PresetDef {
  return PRESETS.find((p) => p.key === key) ?? PRESETS[0];
}
