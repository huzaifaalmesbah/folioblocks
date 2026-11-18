import { describe, expect, it } from 'vitest';
import { defaultState } from './defaults';
import { generateTheme } from './generator';
import { addSection, exportSettings, layoutFromState, moveSection, parseSettings, removeSection } from './layout';
import type { Section } from './types';

const list: Section[] = [
  { id: 'a', type: 'hero', variant: 'avatar' },
  { id: 'b', type: 'about', variant: 'text' },
  { id: 'c', type: 'contact', variant: 'cta' },
];

describe('section lists', () => {
  it('adds a section with a unique id and a valid variant', () => {
    const next = addSection(list, 'projects');
    expect(next).toHaveLength(4);
    expect(next[3]).toMatchObject({ type: 'projects', variant: 'grid' });
    expect(new Set(next.map((s) => s.id)).size).toBe(4);
    expect(addSection(list, 'projects', 'rows')[3].variant).toBe('rows');
    expect(addSection(list, 'projects', 'nope')[3].variant).toBe('grid');
  });

  it('removes and moves sections without touching the original', () => {
    expect(removeSection(list, 'b').map((s) => s.id)).toEqual(['a', 'c']);
    expect(moveSection(list, 0, 2).map((s) => s.id)).toEqual(['b', 'c', 'a']);
    expect(moveSection(list, 2, 0).map((s) => s.id)).toEqual(['c', 'a', 'b']);
    expect(moveSection(list, 1, 99).map((s) => s.id)).toEqual(['a', 'c', 'b']);
    expect(moveSection(list, 5, 0)).toBe(list);
    expect(list.map((s) => s.id)).toEqual(['a', 'b', 'c']);
  });

  it('a page with added, removed and moved sections still generates valid themes', () => {
    let home = addSection(addSection(defaultState.pages.home, 'skills', 'badges'), 'contributions', 'cards');
    home = moveSection(removeSection(home, home[0].id), home.length - 2, 0);
    const { files } = generateTheme({ ...defaultState, pages: { ...defaultState.pages, home } });
    expect(files['patterns/page-home.php']).toContain('wp-block-group');
    // An empty page is allowed too.
    expect(generateTheme({ ...defaultState, pages: { ...defaultState.pages, contact: [] } }).files['patterns/page-contact.php']).toBeTruthy();
  });
});

describe('saved layouts', () => {
  it('captures the design but not the person', () => {
    const state = { ...defaultState, info: { ...defaultState.info, name: 'Jane', avatar: 'data:image/webp;base64,AAAA' } };
    const layout = layoutFromState(state, '  Night mode  ');
    expect(layout.label).toBe('Night mode');
    expect(layout).not.toHaveProperty('info');
    expect(layout.pages).toEqual(state.pages);
    expect(layout.pages).not.toBe(state.pages);
  });
});

describe('settings files', () => {
  it('round-trips state and saved layouts', () => {
    const state = {
      ...defaultState,
      info: {
        ...defaultState.info,
        name: 'Jane Doe',
        avatar: 'data:image/webp;base64,AAAA',
        projects: [{ title: 'P', description: 'D', url: 'https://example.com', image: 'data:image/webp;base64,BBBB' }],
      },
    };
    const layouts = [layoutFromState(state, 'Mine')];
    const parsed = parseSettings(exportSettings(state, layouts));
    expect(parsed.state).toEqual(state);
    expect(parsed.layouts).toEqual(layouts);
  });

  it('keeps the look, and drops one it does not know', () => {
    const state = { ...defaultState, style: { ...defaultState.style, look: 'terminal' as const } };
    expect(parseSettings(exportSettings(state, [])).state.style.look).toBe('terminal');
    const bad = exportSettings({ ...state, style: { ...state.style, look: 'nope' as never } }, []);
    expect(parseSettings(bad).state.style.look).toBeUndefined();
  });

  it('rejects files that are not FolioBlocks settings', () => {
    expect(() => parseSettings('not json')).toThrow('not valid JSON');
    expect(() => parseSettings('{"hello":1}')).toThrow('not a FolioBlocks settings file');
  });

  it('drops anything unknown or unsafe and falls back to defaults', () => {
    const parsed = parseSettings(
      JSON.stringify({
        format: 'folioblocks-settings',
        version: 1,
        state: {
          info: { name: 'X', avatar: 'javascript:alert(1)', projects: [{ title: 'P', image: 'https://evil.test/x.png' }] },
          style: { palette: { primary: 'red; background:url(x)' }, fonts: { heading: 'comic-sans' }, radius: 'huge' },
          header: 'sideways',
          pages: { home: [{ type: 'hero', variant: 'nope' }, { type: 'marquee', variant: 'x' }] },
        },
      }),
    );
    expect(parsed.state.info.name).toBe('X');
    expect(parsed.state.info.avatar).toBe('');
    expect(parsed.state.info.projects[0].image).toBeUndefined();
    expect(parsed.state.style.palette.primary).toBe(defaultState.style.palette.primary);
    expect(parsed.state.style.fonts.heading).toBe(defaultState.style.fonts.heading);
    expect(parsed.state.style.radius).toBe(defaultState.style.radius);
    expect(parsed.state.header).toBe('inline');
    expect(parsed.state.pages.home).toHaveLength(1);
    expect(parsed.state.pages.home[0]).toMatchObject({ type: 'hero', variant: 'avatar' });
    expect(parsed.state.pages.about).toEqual(defaultState.pages.about);
  });
});

describe('store', () => {
  it('knows when a design was changed, and keeps it before a switch (three at most)', async () => {
    const { designChanged, useBuilder } = await import('./store');
    useBuilder.setState({ savedLayouts: [] });
    const s = () => useBuilder.getState();
    s().applyPreset('terminal');
    expect(designChanged(s(), s().savedLayouts)).toBe(false);
    // Switching an unchanged design keeps nothing.
    s().applyPreset('bento');
    expect(s().savedLayouts).toHaveLength(0);
    for (let i = 0; i < 4; i++) {
      s().setStyle({ radius: i % 2 ? 'none' : 'lg' });
      s().setPalette('primary', `#00000${i}`);
      expect(designChanged(s(), s().savedLayouts)).toBe(true);
      s().applyPreset(i % 2 ? 'bento' : 'terminal');
      expect(designChanged(s(), s().savedLayouts)).toBe(false);
    }
    const autos = s().savedLayouts.filter((l) => l.auto);
    expect(autos).toHaveLength(3);
    expect(autos.at(-1)!.style.palette.primary).toBe('#000003');
    useBuilder.setState({ savedLayouts: [] });
  });

  it('keeps existing saved layouts when a draft is imported', async () => {
    const { useBuilder } = await import('./store');
    const store = useBuilder.getState();
    store.saveLayout('Mine');
    const mine = useBuilder.getState().savedLayouts[0];
    const incoming = layoutFromState(defaultState, 'From file');
    useBuilder.getState().importSettings({ ...defaultState, info: { ...defaultState.info, name: 'Imported' } }, [incoming]);
    const after = useBuilder.getState();
    expect(after.info.name).toBe('Imported');
    expect(after.savedLayouts.map((l) => l.key)).toEqual([mine.key, incoming.key]);
  });

  it('adds, moves and removes sections on a page', async () => {
    const { useBuilder } = await import('./store');
    useBuilder.getState().reset();
    const before = useBuilder.getState().pages.contact.length;
    useBuilder.getState().addSection('contact', 'skills');
    let contact = useBuilder.getState().pages.contact;
    expect(contact).toHaveLength(before + 1);
    useBuilder.getState().moveSection('contact', contact.length - 1, 0);
    contact = useBuilder.getState().pages.contact;
    expect(contact[0].type).toBe('skills');
    useBuilder.getState().removeSection('contact', contact[0].id);
    expect(useBuilder.getState().pages.contact).toHaveLength(before);
  });
});
