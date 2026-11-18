import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import { useEffect, useMemo, useState } from 'react';
import { REPO_URL } from '../config';
import { allLanguages, ALL_PARTS, SOURCE, type LanguageMeta, type Part } from '../i18n/languages';
import { englishOf, folderFiles, loadDraft, placeholders, readUpload, save, type Draft } from './files';
import { inputCls } from '../ui/fields';
import { SiteFooter, SiteHeader } from '../ui/SiteChrome';

/**
 * Help translate: translate FolioBlocks in the browser, with no git and no
 * JSON editing. English on the left, your language on the right, saved in
 * this browser as you type. When done, download the language's folder as a
 * zip and send it through GitHub (see TRANSLATING.md).
 */

const PART_INFO: Record<Part, { title: string; note: string }> = {
  home: { title: 'Home page', note: 'The FolioBlocks home page.' },
  builder: { title: 'Builder', note: 'The form, buttons and messages of the builder.' },
  templates: { title: 'Template names', note: 'Names and descriptions of templates, sections, looks and colours.' },
  theme: { title: "The site's own words", note: "Headings, buttons and menu the student's WordPress site shows." },
};

function Progress({ done, total }: { done: number; total: number }) {
  const pct = total ? Math.floor((done / total) * 100) : 0;
  return (
    <span className="flex items-center gap-2 text-xs text-slate-600">
      <span className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-200" aria-hidden>
        <span className={`block h-full ${pct === 100 ? 'bg-green-600' : 'bg-blue-600'}`} style={{ width: `${pct}%` }} />
      </span>
      {done}/{total}
    </span>
  );
}

function NewLanguageForm({ onCreate }: { onCreate: (meta: LanguageMeta) => void }) {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [englishName, setEnglishName] = useState('');
  const [dir, setDir] = useState<'ltr' | 'rtl'>('ltr');
  const valid = /^[a-z]{2,3}(-[A-Za-z0-9]{2,8})*$/.test(code) && name.trim() && englishName.trim();
  const taken = allLanguages().some((l) => l.code === code);
  return (
    <form
      className="grid gap-3 rounded-xl border border-slate-200 p-4 sm:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (valid && !taken) onCreate({ code, name: name.trim(), englishName: englishName.trim(), dir, enabled: false });
      }}
    >
      <label className="block text-sm font-medium text-slate-700">
        Language name in English
        <input className={inputCls} value={englishName} onChange={(e) => setEnglishName(e.target.value)} placeholder="Hindi" />
      </label>
      <label className="block text-sm font-medium text-slate-700">
        Language name in the language itself
        <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="हिन्दी" />
      </label>
      <label className="block text-sm font-medium text-slate-700">
        Language code
        <input className={inputCls} value={code} onChange={(e) => setCode(e.target.value.trim())} placeholder="hi" />
        <span className="mt-1 block text-xs font-normal text-slate-500">
          Two letters, like hi, es, ar. Add a region if needed: pt-BR.{' '}
          <a className="underline" href="https://en.wikipedia.org/wiki/List_of_ISO_639_language_codes" target="_blank" rel="noopener">
            Find your code
          </a>
        </span>
      </label>
      <label className="block text-sm font-medium text-slate-700">
        Writing direction
        <select className={inputCls} value={dir} onChange={(e) => setDir(e.target.value as 'ltr' | 'rtl')}>
          <option value="ltr">Left to right</option>
          <option value="rtl">Right to left (Arabic, Urdu, Hebrew…)</option>
        </select>
      </label>
      {taken && <p className="text-xs text-red-700 sm:col-span-2">That language already exists: pick it from the list above.</p>}
      <button type="submit" disabled={!valid || taken} className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50 sm:col-span-2 sm:justify-self-start">
        Start translating
      </button>
    </form>
  );
}

export function TranslatePage() {
  const languages = allLanguages().filter((l) => l.code !== SOURCE);
  const [code, setCode] = useState<string>('');
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [part, setPart] = useState<Part>('home');
  const [onlyMissing, setOnlyMissing] = useState(true);
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (draft) save(draft);
  }, [draft]);

  const choose = (meta: LanguageMeta) => {
    setCode(meta.code);
    setCreating(false);
    setDraft(loadDraft(meta));
    setMessage('');
  };

  const counts = useMemo(() => {
    const out = {} as Record<Part, { done: number; total: number }>;
    for (const p of ALL_PARTS) {
      const keys = Object.keys(englishOf(p));
      out[p] = { done: draft ? keys.filter((k) => draft.files[p][k]).length : 0, total: keys.length };
    }
    return out;
  }, [draft]);

  const rows = useMemo(() => {
    if (!draft) return [];
    const q = search.trim().toLowerCase();
    return Object.keys(englishOf(part)).filter((k) => {
      if (onlyMissing && draft.files[part][k] && !q) return false;
      return !q || k.toLowerCase().includes(q) || (draft.files[part][k] ?? '').toLowerCase().includes(q);
    });
  }, [draft, part, onlyMissing, search]);

  const set = (key: string, value: string) =>
    setDraft((d) => (d ? { ...d, files: { ...d.files, [part]: { ...d.files[part], [key]: value } } } : d));

  async function download() {
    if (!draft) return;
    const zip = new JSZip();
    const folder = zip.folder(draft.meta.code)!;
    for (const [name, text] of Object.entries(folderFiles(draft))) folder.file(name, text);
    saveAs(await zip.generateAsync({ type: 'blob' }), `folioblocks-${draft.meta.code}.zip`);
  }

  const total = ALL_PARTS.reduce((n, p) => n + counts[p].total, 0);
  const done = ALL_PARTS.reduce((n, p) => n + counts[p].done, 0);

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <SiteHeader current="translate" />

      <main className="mx-auto max-w-5xl space-y-8 px-4 py-10 sm:px-6">
        <section className="space-y-3">
          <h1 className="text-3xl font-bold tracking-tight">Help translate FolioBlocks</h1>
          <p className="max-w-2xl text-slate-600">
            Translate the builder and the words students' sites show into your language. No coding, no git: type here, download one
            file, and send it to us on GitHub. Your work is saved in this browser as you type, so you can stop and come back.
          </p>
          <p className="text-sm">
            <a className="text-blue-700 underline" href={`${REPO_URL}/blob/main/TRANSLATING.md`} target="_blank" rel="noopener">
              Read the translation guide
            </a>
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">1. Choose a language</h2>
          <div className="flex flex-wrap gap-2">
            {languages.map((l) => (
              <button
                key={l.code}
                type="button"
                onClick={() => choose(l)}
                aria-pressed={code === l.code}
                className={`rounded-full border px-4 py-1.5 text-sm ${code === l.code ? 'border-blue-600 bg-blue-50 text-blue-800' : 'border-slate-300 hover:bg-slate-50'}`}
              >
                <span data-no-translate lang={l.code}>{l.name}</span> <span className="text-slate-500">· {l.englishName}</span>
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                setCreating(true);
                setCode('');
                setDraft(null);
              }}
              aria-pressed={creating}
              className={`rounded-full border border-dashed px-4 py-1.5 text-sm ${creating ? 'border-blue-600 bg-blue-50 text-blue-800' : 'border-slate-400 hover:bg-slate-50'}`}
            >
              + A new language
            </button>
          </div>
          {creating && <NewLanguageForm onCreate={choose} />}
        </section>

        {draft && (
          <>
            <section className="space-y-4">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <h2 className="text-lg font-semibold">
                  2. Translate into <span data-no-translate lang={draft.meta.code}>{draft.meta.name}</span>
                </h2>
                <Progress done={done} total={total} />
              </div>

              <div className="grid gap-2 sm:grid-cols-4" role="tablist" aria-label="Files">
                {ALL_PARTS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    role="tab"
                    aria-selected={part === p}
                    onClick={() => setPart(p)}
                    className={`rounded-lg border p-3 text-left ${part === p ? 'border-blue-600 ring-2 ring-blue-600/20' : 'border-slate-200 hover:border-slate-400'}`}
                  >
                    <span className="block text-sm font-semibold">{PART_INFO[p].title}</span>
                    <span className="mt-1 block"><Progress {...counts[p]} /></span>
                  </button>
                ))}
              </div>
              <p className="text-sm text-slate-600">{PART_INFO[part].note}</p>

              <div className="flex flex-wrap items-center gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={onlyMissing} onChange={(e) => setOnlyMissing(e.target.checked)} />
                  Show only what is not translated yet
                </label>
                <input
                  type="search"
                  className={`${inputCls} mt-0 max-w-xs`}
                  placeholder="Search"
                  aria-label="Search the strings"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200">
                {rows.length === 0 && (
                  <li className="p-6 text-center text-sm text-slate-600">
                    {onlyMissing ? 'Everything in this file is translated. Well done!' : 'Nothing matches.'}
                  </li>
                )}
                {rows.map((key) => {
                  const value = draft.files[part][key] ?? '';
                  const bad = value && placeholders(value) !== placeholders(key);
                  return (
                    <li key={key} className="grid gap-3 p-4 md:grid-cols-2">
                      <p data-no-translate lang="en" className="whitespace-pre-wrap text-sm text-slate-800">
                        {key}
                      </p>
                      <div>
                        <textarea
                          className={`${inputCls} mt-0 ${bad ? 'border-red-500' : ''}`}
                          lang={draft.meta.code}
                          dir={draft.meta.dir}
                          rows={Math.min(6, Math.max(1, Math.ceil(key.length / 55)))}
                          aria-label="Translation"
                          value={value}
                          onChange={(e) => set(key, e.target.value)}
                        />
                        {bad && (
                          <p className="mt-1 text-xs text-red-700">
                            Keep {placeholders(key) || 'no placeholders'} exactly as in English: they are filled in later.
                          </p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>

            <section className="space-y-3 rounded-xl bg-slate-50 p-5">
              <h2 className="text-lg font-semibold">3. Download and send</h2>
              <p className="text-sm text-slate-700">
                You don't have to finish everything: anything not translated shows in English. Download your folder whenever you like.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <button type="button" onClick={download} className="rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800">
                  Download folioblocks-{draft.meta.code}.zip
                </button>
                <label className="cursor-pointer rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-100">
                  Continue from a file
                  <input
                    type="file"
                    accept=".zip,.json"
                    className="sr-only"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      e.target.value = '';
                      if (!file) return;
                      try {
                        setDraft(await readUpload(file, draft));
                        setMessage('Loaded. Your translations are back.');
                      } catch {
                        setMessage('That file could not be read. Choose the zip or a .json file you downloaded here.');
                      }
                    }}
                  />
                </label>
              </div>
              {message && <p role="status" className="text-sm text-slate-700">{message}</p>}
              <ol className="list-decimal space-y-1 pl-5 text-sm text-slate-700">
                <li>
                  Open the{' '}
                  <a className="text-blue-700 underline" href={`${REPO_URL}/issues/new?template=translation.yml`} target="_blank" rel="noopener">
                    New translation form
                  </a>{' '}
                  on GitHub (a free account is enough).
                </li>
                <li>Drag the zip into the form and click Submit. We add it to FolioBlocks and switch the language on when it is ready.</li>
              </ol>
            </section>
          </>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
