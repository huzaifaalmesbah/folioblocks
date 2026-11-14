import type { FontKey } from './fonts';

export type { FontKey };

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

export type Radius = 'none' | 'sm' | 'md' | 'lg';

export type Style = {
  palette: Palette;
  fonts: { heading: FontKey; body: FontKey };
  radius: Radius;
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

export type HeaderVariant = 'inline' | 'centered';
export type FooterVariant = 'centered' | 'split';

export type BuilderState = {
  info: Info;
  style: Style;
  preset: string;
  header: HeaderVariant;
  footer: FooterVariant;
  pages: Record<PageKey, Section[]>;
};

/** Map of theme-relative file path → file contents. */
export type ThemeFiles = Record<string, string>;
