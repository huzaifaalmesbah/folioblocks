import type { BuilderState } from './types';

export const defaultState: BuilderState = {
  info: {
    name: 'Your Name',
    tagline: 'Student & WordPress Contributor',
    university: '',
    location: '',
    bio: 'Write two or three lines about who you are and what you are learning.',
    email: '',
    skills: ['HTML', 'CSS', 'WordPress'],
    contributions: [],
    projects: [],
    socials: {},
  },
  style: {
    palette: {
      primary: '#3858e9',
      secondary: '#1e1e1e',
      base: '#ffffff',
      contrast: '#1e1e1e',
      accent: '#f0f3ff',
    },
    fonts: { heading: 'system-sans', body: 'system-sans' },
    radius: 'md',
  },
  preset: 'minimal',
  pages: {
    home: [
      { id: 'h1', type: 'hero', variant: 'centered' },
      { id: 'h2', type: 'about', variant: 'text' },
      { id: 'h3', type: 'projects', variant: 'grid' },
      { id: 'h4', type: 'posts', variant: 'grid' },
      { id: 'h5', type: 'contact', variant: 'cta' },
    ],
    about: [
      { id: 'a1', type: 'about', variant: 'text' },
      { id: 'a2', type: 'skills', variant: 'list' },
      { id: 'a3', type: 'contributions', variant: 'list' },
    ],
    contact: [{ id: 'c1', type: 'contact', variant: 'full' }],
  },
};
