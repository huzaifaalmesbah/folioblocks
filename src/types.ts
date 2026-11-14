export type Project = { title: string; description: string; url: string };
export type Contribution = { team: string; description: string };

export type Socials = {
  github?: string;
  linkedin?: string;
  x?: string;
  wordpress?: string;
};

export type Info = {
  name: string;
  tagline: string;
  university: string;
  location: string;
  bio: string;
  email: string;
  skills: string[];
  contributions: Contribution[];
  projects: Project[];
  socials: Socials;
};

export type Palette = {
  primary: string;
  secondary: string;
  base: string;
  contrast: string;
  accent: string;
};

export type FontKey = 'system-sans' | 'system-serif' | 'system-mono';

export type Style = {
  palette: Palette;
  fonts: { heading: FontKey; body: FontKey };
  radius: 'none' | 'sm' | 'md' | 'lg';
};

export type SectionType =
  | 'hero'
  | 'about'
  | 'skills'
  | 'contributions'
  | 'projects'
  | 'posts'
  | 'contact';

export type Section = { id: string; type: SectionType; variant: string };

export type PageKey = 'home' | 'about' | 'contact';

export type BuilderState = {
  info: Info;
  style: Style;
  preset: string;
  pages: Record<PageKey, Section[]>;
};

/** Map of theme-relative file path → file contents. */
export type ThemeFiles = Record<string, string>;
