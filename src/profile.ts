import type { Info } from './types';

/**
 * How complete a profile is, and what to add next. The basics carry most
 * of the weight: with those five a site already looks finished. Optional
 * extras (experience, achievements, CV…) don't count against anyone.
 */
type Check = { label: string; weight: number; done: (i: Info) => boolean };

const CHECKS: Check[] = [
  { label: 'Add your name', weight: 12, done: (i) => Boolean(i.name.trim()) && i.name.trim() !== 'Your Name' },
  { label: 'Add a tagline', weight: 8, done: (i) => Boolean(i.tagline.trim()) },
  { label: 'Write a short bio', weight: 15, done: (i) => i.bio.trim().length >= 20 },
  { label: 'Upload a profile photo', weight: 15, done: (i) => Boolean(i.avatar) },
  { label: 'Add your email', weight: 10, done: (i) => Boolean(i.email.trim()) },
  { label: 'List at least 3 skills', weight: 8, done: (i) => i.skills.length >= 3 },
  { label: 'Add 2 projects', weight: 14, done: (i) => i.projects.filter((p) => p.title.trim()).length >= 2 },
  { label: 'Add your education', weight: 8, done: (i) => i.education.some((e) => e.degree.trim()) },
  { label: 'Add a social link', weight: 10, done: (i) => Object.values(i.socials).some((u) => u?.trim()) },
];

export function profileCompleteness(info: Info): { percent: number; next: string[] } {
  const total = CHECKS.reduce((n, c) => n + c.weight, 0);
  const done = CHECKS.filter((c) => c.done(info));
  return {
    percent: Math.round((done.reduce((n, c) => n + c.weight, 0) / total) * 100),
    next: CHECKS.filter((c) => !c.done(info)).map((c) => c.label),
  };
}
