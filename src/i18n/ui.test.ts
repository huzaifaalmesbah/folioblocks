import { afterEach, describe, expect, it } from 'vitest';
import { publishChecklist } from '../checklist';
import { defaultState } from '../defaults';
import { allLanguages, ALL_PARTS, appDict, enabledLanguages, localeFiles, themeDict } from './languages';
import { tr, translateText, useUi } from './ui';

afterEach(() => useUi.setState({ lang: 'en' }));

const BN = appDict('bn');

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

  it('writes the download checklist in Bengali', () => {
    useUi.setState({ lang: 'bn' });
    const items = publishChecklist(defaultState);
    expect(items.length).toBeGreaterThan(0);
    for (const i of items) expect(i.text, i.text).toMatch(/[ঀ-৿]/);
  });
});

describe('language files', () => {
  const en = localeFiles('en')!;

  it('English is always on and first', () => {
    expect(enabledLanguages()[0].code).toBe('en');
    expect(allLanguages()[0].code).toBe('en');
  });

  it.each(allLanguages().map((l) => l.code))('%s keeps every placeholder and only uses English keys', (code) => {
    const files = localeFiles(code)!;
    expect(files.language.code).toBe(code);
    for (const part of ALL_PARTS) {
      for (const [source, text] of Object.entries(files[part] ?? {})) {
        expect(en[part], `${code}/${part}.json: "${source}" is not in en/${part}.json`).toHaveProperty([source]);
        expect((text.match(/\{\w+\}/g) ?? []).sort(), `${code}/${part}.json: ${source}`).toEqual((source.match(/\{\w+\}/g) ?? []).sort());
      }
    }
  });

  it('Bengali has the template names and the theme words', () => {
    expect(appDict('bn').Minimal).toBe('মিনিমাল');
    expect(themeDict('bn')['About me']).toBe('আমার সম্পর্কে');
  });
});
