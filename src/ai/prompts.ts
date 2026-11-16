import type { Info, Project } from '../types';

/**
 * Prompts a student copies into any AI chat (Claude, ChatGPT, Gemini…).
 * FolioBlocks never calls an AI itself: the student pastes the prompt, and
 * pastes the answer back. Every prompt tells the AI not to invent facts.
 */

/** Turns a CV, LinkedIn text or rough notes into the profile JSON that "Fill my profile" reads. */
export const FILL_PROMPT = `You are helping me fill in my portfolio website. Below this prompt I will paste my CV, LinkedIn profile or rough notes.

Turn it into ONE JSON object in exactly this shape, and reply with the JSON only, inside a code block:

{
  "name": "Full name",
  "tagline": "One line, max 8 words, e.g. CSE Student & WordPress Contributor",
  "bio": "2-3 friendly sentences in first person about who I am, what I study and what I like to build",
  "university": "University or department",
  "location": "City, Country",
  "email": "",
  "skills": ["up to 10 short skills"],
  "projects": [{ "title": "", "description": "one line: what it does and what I built", "url": "" }],
  "education": [{ "degree": "", "school": "", "period": "2023 – 2027" }],
  "experience": [{ "role": "", "org": "", "period": "Jan 2026 – now", "description": "one line" }],
  "contributions": [{ "team": "WordPress team or event, e.g. Polyglots", "description": "what I did", "date": "2026", "url": "" }],
  "achievements": [{ "title": "", "issuer": "", "year": "", "url": "" }],
  "cvUrl": "",
  "socials": { "github": "", "linkedin": "", "x": "", "wordpress": "" }
}

Rules:
- Use only facts from my text. Never invent names, dates, links, numbers or achievements.
- If something is missing, use "" or [] for it. Do not guess.
- "contributions" is only for WordPress or open-source community work. Put jobs and internships in "experience".
- Newest first in every list. Keep every description to one clear line.
- Keep my language: if my text is in Bengali, write the bio and descriptions in Bengali.
- Links must be full URLs starting with https://.

My text:
`;

const facts = (info: Info) =>
  [
    info.name && info.name !== 'Your Name' && `Name: ${info.name}`,
    info.university && `Studying at: ${info.university}`,
    info.location && `Location: ${info.location}`,
    info.skills.length && `Skills: ${info.skills.join(', ')}`,
    info.projects.length && `Projects: ${info.projects.map((p) => p.title).filter(Boolean).join(', ')}`,
    info.contributions.length && `WordPress contributions: ${info.contributions.map((c) => c.team).filter(Boolean).join(', ')}`,
    info.experience.length && `Experience: ${info.experience.map((e) => [e.role, e.org].filter(Boolean).join(' at ')).join('; ')}`,
  ]
    .filter(Boolean)
    .join('\n');

const NO_INVENTING = 'Use only the facts I gave. Do not invent anything. Plain text only, no quotes or headings.';

export function bioPrompt(info: Info): string {
  return `Write a short bio for my portfolio website: 2-3 friendly sentences in first person, simple words, no buzzwords.
Give me 3 different versions so I can pick one. ${NO_INVENTING}

About me:
${facts(info) || '[Tell the AI: what you study, what you enjoy building, and one thing you are proud of]'}
${info.bio ? `\nMy current draft (improve it, keep the meaning):\n${info.bio}` : ''}`;
}

export function taglinePrompt(info: Info): string {
  return `Write 5 taglines for my portfolio website. Each is one line, at most 8 words, says what I am or do, with no hype words like "passionate" or "ninja". ${NO_INVENTING}

About me:
${facts(info) || '[Tell the AI: what you study and what you do]'}`;
}

export function projectPrompt(project: Project): string {
  return `Write a one-line description (at most 20 words) of my project for my portfolio website. Say what it does and what I built. Give me 3 versions. ${NO_INVENTING}

Project name: ${project.title || '[project name]'}
${project.url ? `Link: ${project.url}\n` : ''}What I know about it: ${project.description || '[write a few rough words here before sending]'}`;
}
