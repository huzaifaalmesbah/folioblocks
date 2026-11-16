import type { Info } from './types';

/** The old default bio, which older drafts may still hold: treated as empty. */
export const OLD_DEFAULT_BIO = 'Write two or three lines about who you are and what you are learning.';

/**
 * Sample content for the preview only. Where the student hasn't written
 * anything yet, the preview shows these so they can see what a section looks
 * like; the downloaded theme leaves empty sections out instead.
 */
export function withSamples(info: Info): Info {
  return {
    ...info,
    bio: info.bio.trim() || 'Write two or three lines about who you are, what you are studying and what you enjoy building.',
    email: info.email.trim() || 'you@example.com',
    skills: info.skills.length ? info.skills : ['HTML', 'CSS', 'WordPress'],
    projects: info.projects.length
      ? info.projects
      : [
          { title: 'Project one', description: 'Describe your project in one line.', url: '' },
          { title: 'Project two', description: 'Describe your project in one line.', url: '' },
          { title: 'Project three', description: 'Describe your project in one line.', url: '' },
        ],
    contributions: info.contributions.length
      ? info.contributions
      : [{ team: 'Your team', description: 'What you did: translations, testing, a meetup talk…', date: '2026' }],
    experience: info.experience.length
      ? info.experience
      : [{ role: 'Your role', org: 'Company or club', period: '2025 – now', description: 'One line about what you did there.' }],
    education: info.education.length ? info.education : [{ degree: 'Your degree', school: 'Your university', period: '2023 – 2027' }],
    achievements: info.achievements.length
      ? info.achievements
      : [{ title: 'Award or certificate', issuer: 'Who gave it', year: '2026', url: '' }],
  };
}
