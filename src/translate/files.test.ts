import JSZip from 'jszip';
import { describe, expect, it } from 'vitest';
import { localeFiles } from '../i18n/languages';
import { folderFiles, readUpload, type Draft } from './files';

const meta = { code: 'xx', name: 'Xx', englishName: 'Test', dir: 'ltr' as const, enabled: false };
const draft: Draft = { meta, files: { home: {}, builder: {}, templates: { Minimal: 'Mini' }, theme: { 'Portrait of {name}': '{name} pic' } } };

describe('translate page files', () => {
  it('writes the whole folder: every English string, translated or English', () => {
    const files = folderFiles(draft);
    expect(Object.keys(files).sort()).toEqual(['builder.json', 'home.json', 'language.json', 'templates.json', 'theme.json']);
    const en = localeFiles('en')!;
    const templates = JSON.parse(files['templates.json']);
    expect(Object.keys(templates)).toEqual(Object.keys(en.templates!));
    expect(templates.Minimal).toBe('Mini');
    expect(templates.Creative).toBe('Creative');
    expect(JSON.parse(files['language.json'])).toEqual(meta);
  });

  it('reads its own zip back', async () => {
    const zip = new JSZip();
    for (const [name, text] of Object.entries(folderFiles(draft))) zip.folder('xx')!.file(name, text);
    const blob = await zip.generateAsync({ type: 'arraybuffer' });
    const file = new File([blob], 'folioblocks-xx.zip');
    const empty: Draft = { meta, files: { home: {}, builder: {}, templates: {}, theme: {} } };
    const back = await readUpload(file, empty);
    expect(back.files.templates).toEqual({ Minimal: 'Mini' });
    expect(back.files.theme).toEqual({ 'Portrait of {name}': '{name} pic' });
  });
});
