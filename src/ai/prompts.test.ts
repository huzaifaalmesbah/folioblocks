import { describe, expect, it } from 'vitest';
import { defaultState } from '../defaults';
import { generateTheme } from '../generator';
import { parseProfile } from '../layout';
import { bioPrompt, FILL_PROMPT, projectPrompt, taglinePrompt } from './prompts';

const current = {
  ...defaultState.info,
  avatar: 'data:image/webp;base64,AAAA',
  projects: [{ title: 'Campus Events', description: 'old', url: '', image: 'data:image/webp;base64,BBBB' }],
};

const ANSWER = `Sure! Here is your profile:

\`\`\`json
{
  "name": "Jane Doe",
  "tagline": "CSE Student & WordPress Contributor",
  "bio": "I study computer science.",
  "skills": ["PHP", "JavaScript"],
  "projects": [
    { "title": "campus events", "description": "A block plugin.", "url": "https://example.com" },
    { "title": "New One", "description": "Another.", "url": "" }
  ],
  "education": [{ "degree": "BSc CSE", "school": "Example University", "period": "2023 – 2027" }],
  "experience": [],
  "contributions": [{ "team": "Polyglots", "description": "Translations", "date": "2026", "url": "" }],
  "achievements": [],
  "cvUrl": "",
  "socials": { "github": "https://github.com/jane", "linkedin": "" },
  "avatar": "https://evil.test/x.png",
  "isAdmin": true
}
\`\`\`
Let me know if you want changes.`;

describe('Fill with AI', () => {
  it('reads the profile out of a chat answer and keeps photos', () => {
    const info = parseProfile(ANSWER, current);
    expect(info.name).toBe('Jane Doe');
    expect(info.skills).toEqual(['PHP', 'JavaScript']);
    expect(info.education[0].school).toBe('Example University');
    expect(info.socials).toEqual({ github: 'https://github.com/jane' });
    // Photos can't come from a chat: the avatar stays, and a project keeps its photo by title.
    expect(info.avatar).toBe(current.avatar);
    expect(info.projects[0].image).toBe('data:image/webp;base64,BBBB');
    expect(info.projects[1]).toEqual({ title: 'New One', description: 'Another.', url: '' });
    expect(info).not.toHaveProperty('isAdmin');
  });

  it('accepts a full settings file or { info } too', () => {
    expect(parseProfile('{"info":{"name":"A"}}', current).name).toBe('A');
    expect(parseProfile('{"format":"folioblocks-settings","state":{"info":{"name":"B"}}}', current).name).toBe('B');
  });

  it('explains what is wrong with a bad answer', () => {
    expect(() => parseProfile('I cannot help with that.', current)).toThrow('No JSON found');
    expect(() => parseProfile('{ "name": "Jane", ', current)).toThrow('No JSON found');
    expect(() => parseProfile('{ "name": "Jane", }', current)).toThrow('incomplete or broken');
    expect(() => parseProfile('{ "title": "x" }', current)).toThrow('no "name"');
  });

  it('the result builds a valid theme', () => {
    const info = parseProfile(ANSWER, current);
    const { files } = generateTheme({ ...defaultState, info });
    expect(files['patterns/page-home.php']).toContain("'campus events'");
  });

  it('the prompt asks for our fields and forbids inventing', () => {
    for (const key of ['"name"', '"tagline"', '"bio"', '"skills"', '"projects"', '"education"', '"experience"', '"contributions"', '"achievements"', '"socials"']) {
      expect(FILL_PROMPT).toContain(key);
    }
    expect(FILL_PROMPT).toContain('Never invent');
  });
});

describe('field prompts', () => {
  it('include what the student already entered', () => {
    const info = { ...defaultState.info, name: 'Jane Doe', university: 'Example University', skills: ['PHP'], bio: 'Draft bio.' };
    expect(bioPrompt(info)).toContain('Name: Jane Doe');
    expect(bioPrompt(info)).toContain('Draft bio.');
    expect(taglinePrompt(info)).toContain('Studying at: Example University');
    expect(projectPrompt({ title: 'Campus Events', description: 'events plugin', url: '' })).toContain('Project name: Campus Events');
  });

  it('ask the student for details when the form is empty', () => {
    expect(bioPrompt({ ...defaultState.info, skills: [] })).toContain('[Tell the AI');
  });
});

describe('AGENTS.md', () => {
  it('ships in the theme with its slug and rules', () => {
    const { slug, files } = generateTheme({ ...defaultState, info: { ...defaultState.info, name: 'Jane Doe' } });
    const md = files['AGENTS.md'];
    expect(md).toContain(`text domain: \`${slug}\``);
    expect(md).toContain('The pattern is the source of truth');
    expect(md).toContain('npx skills add WordPress/agent-skills');
  });
});
