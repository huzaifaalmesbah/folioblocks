import { presetByKey } from './presets';
import type { BuilderState } from './types';

const minimal = presetByKey('minimal');

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
    avatar: '',
    cover: '',
  },
  style: minimal.style,
  preset: minimal.key,
  header: minimal.header,
  footer: minimal.footer,
  pages: minimal.pages,
};
