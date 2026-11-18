import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import JSZip from 'jszip';
import { describe, expect, it } from 'vitest';
import { defaultState } from '../defaults';
import { parseSettings } from '../layout';
import { buildTheme, builderLink, CliError, loadProject, saveProject, withTemplate } from './project';

const dir = () => mkdtempSync(join(tmpdir(), 'folioblocks-cli-'));

function project(info: Record<string, unknown>, key = 'bento') {
  const d = dir();
  const file = join(d, 'folioblocks.json');
  saveProject(file, withTemplate(structuredClone(defaultState), key));
  const data = JSON.parse(readFileSync(file, 'utf8'));
  Object.assign(data.state.info, info);
  writeFileSync(file, JSON.stringify(data));
  return { d, file };
}

describe('folioblocks command line', () => {
  it('reads a project, embedding a local photo with its real type', () => {
    const { d, file } = project({ name: 'Test Student', avatar: 'me.png' });
    writeFileSync(join(d, 'me.png'), readFileSync('public/images/avatar.webp'));
    // A .png path keeps the PNG type, whatever the bytes are.
    const state = loadProject(file);
    expect(state.info.name).toBe('Test Student');
    expect(state.info.avatar?.startsWith('data:image/png;base64,')).toBe(true);
    expect(state.preset).toBe('bento');
  });

  it('says clearly what is wrong with a file', () => {
    const { d, file } = project({ avatar: 'missing.jpg' });
    expect(() => loadProject(file)).toThrow(CliError);
    expect(() => loadProject(file)).toThrow('photo not found: missing.jpg');
    writeFileSync(join(d, 'broken.json'), '{ "state": ');
    expect(() => loadProject(join(d, 'broken.json'))).toThrow('not valid JSON');
    expect(() => withTemplate(defaultState, 'nope')).toThrow('unknown template "nope"');
  });

  it('switches template and keeps the info', () => {
    const state = withTemplate({ ...defaultState, info: { ...defaultState.info, name: 'Keep Me' } }, 'terminal');
    expect(state.preset).toBe('terminal');
    expect(state.style.look).toBe('terminal');
    expect(state.info.name).toBe('Keep Me');
  });

  it('builds the theme folder and an installable zip with a screenshot', async () => {
    const out = dir();
    const state = withTemplate({ ...defaultState, info: { ...defaultState.info, name: 'Zip Test' } }, 'profile');
    const { zip } = await buildTheme(state, out);
    expect(zip).toBe(join(out, 'zip-test-portfolio.zip'));
    const names = Object.keys((await JSZip.loadAsync(readFileSync(zip))).files);
    for (const f of ['style.css', 'theme.json', 'screenshot.png', 'templates/front-page.html', 'styles/blocks/section-card.json']) {
      expect(names).toContain(`zip-test-portfolio/${f}`);
    }
    const png = readFileSync(join(out, 'zip-test-portfolio', 'screenshot.png'));
    expect([...png.subarray(0, 8)]).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
  });

  it('makes a builder link that loads the same project, without photos', () => {
    const state = { ...defaultState, info: { ...defaultState.info, name: 'Link Test', avatar: 'data:image/webp;base64,AAAA' } };
    const link = builderLink(state, 'https://example.org/');
    expect(link.startsWith('https://example.org/#/build?import=')).toBe(true);
    const json = Buffer.from(link.split('import=')[1], 'base64url').toString('utf8');
    const back = parseSettings(json).state;
    expect(back.info.name).toBe('Link Test');
    expect(back.info.avatar).toBe('');
  });
});
