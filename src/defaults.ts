import { presetByKey } from './presets';
import type { BuilderState } from './types';

const minimal = presetByKey('minimal');

export const defaultState: BuilderState = {
  info: {
    name: 'Your Name',
    tagline: 'Student & WordPress Contributor',
    university: '',
    location: '',
    bio: '',
    email: '',
    skills: ['HTML', 'CSS', 'WordPress'],
    contributions: [],
    projects: [],
    experience: [],
    education: [],
    achievements: [],
    cvUrl: '',
    socials: {},
    avatar: '',
  },
  style: minimal.style,
  preset: minimal.key,
  header: minimal.header,
  footer: minimal.footer,
  pages: minimal.pages,
};
