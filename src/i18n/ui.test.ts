import { afterEach, describe, expect, it } from 'vitest';
import { BN } from './bn';
import { tr, translateText, useUi } from './ui';
import { PRESETS } from '../presets';
import { SECTION_LABELS } from '../generator/sections';
import { publishChecklist } from '../checklist';
import { defaultState } from '../defaults';

afterEach(() => useUi.setState({ lang: 'en' }));

describe('interface translation', () => {
  it('keeps English as it is and fills placeholders', () => {
    expect(tr('Loaded {file}.', { file: 'a.json' })).toBe('Loaded a.json.');
  });

  it('translates code-built strings and keeps the values', () => {
    useUi.setState({ lang: 'bn' });
    expect(tr('Loaded {file}.', { file: 'a.json' })).toBe('a.json লোড হয়েছে।');
    expect(tr('Not in the dictionary')).toBe('Not in the dictionary');
  });

  it('matches rendered text whatever the whitespace around it', () => {
    expect(translateText(BN, '\n   Start   building ')).toBe('\n   শুরু করুন ');
    expect(translateText(BN, 'Something else')).toBeNull();
    expect(translateText(BN, '   ')).toBeNull();
  });

  it('has no empty entries and keeps every placeholder', () => {
    for (const [en, bn] of Object.entries(BN)) {
      expect(bn.trim(), en).not.toBe('');
      expect((bn.match(/\{\w+\}/g) ?? []).sort(), en).toEqual((en.match(/\{\w+\}/g) ?? []).sort());
    }
  });

  it('covers every template and section name', () => {
    for (const p of PRESETS.filter((p) => !p.language)) {
      for (const text of [p.label, p.description, p.bestFor]) expect(BN[text], text).toBeTruthy();
    }
    for (const label of Object.values(SECTION_LABELS)) expect(BN[label], label).toBeTruthy();
  });

  it('writes the download checklist in Bengali', () => {
    useUi.setState({ lang: 'bn' });
    const items = publishChecklist(defaultState);
    expect(items.length).toBeGreaterThan(0);
    for (const i of items) expect(i.text, i.text).toMatch(/[ঀ-৿]/);
  });
});
