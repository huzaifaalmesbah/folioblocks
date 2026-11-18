import { useEffect, useState, type ReactNode } from 'react';
import { PRESETS } from '../presets';
import { DesignMock } from '../ui/DesignMock';
import { themeSlug } from '../generator/utils';
import { REPO_URL } from '../config';
import { LangToggle } from '../i18n/LangToggle';
import { tr } from '../i18n/ui';
import { useBuilder } from '../store';
import {
  FROM_SCRATCH_PROMPT,
  LOCAL_SETUP,
  PROMPTS,
  SKILLS,
  SKILLS_REPO,
  STUDIO_STEPS,
  WPCOM_LINKS,
  WPCOM_UPLOAD_STEPS,
} from './content';

const REPO = REPO_URL;

/* ---------- Small pieces ---------- */

function CopyButton({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Older browsers: select a hidden textarea and copy.
      const t = document.createElement('textarea');
      t.value = text;
      document.body.appendChild(t);
      t.select();
      document.execCommand('copy');
      t.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }
  return (
    <button
      type="button"
      onClick={copy}
      className="shrink-0 rounded-md border border-slate-600 px-2.5 py-1 text-xs font-medium text-slate-100 hover:bg-slate-700"
    >
      <span aria-live="polite">{copied ? 'Copied ✓' : label}</span>
    </button>
  );
}

function Code({ children }: { children: string }) {
  return (
    <div className="flex items-start gap-3 rounded-lg bg-slate-900 p-3">
      <pre className="min-w-0 flex-1 overflow-x-auto text-[13px] leading-relaxed whitespace-pre-wrap text-slate-100">
        <code>{children}</code>
      </pre>
      <CopyButton text={children} />
    </div>
  );
}

function SectionHeading(props: { eyebrow: string; title: string; children?: ReactNode; id?: string }) {
  return (
    <div className="mx-auto max-w-2xl scroll-mt-24 text-center" id={props.id}>
      <p className="text-sm font-semibold tracking-wide text-blue-700 uppercase">{props.eyebrow}</p>
      <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">{props.title}</h2>
      {props.children && <p className="mt-4 text-lg text-slate-600">{props.children}</p>}
    </div>
  );
}

export function Landing() {
  const applyPreset = useBuilder((s) => s.applyPreset);
  const hasDraft = useBuilder((s) => s.info.name !== 'Your Name' || s.info.projects.length > 0 || Boolean(s.info.avatar));

  // A shared link like …/#ai arrives before React has drawn the section, so scroll once it exists.
  useEffect(() => {
    const id = window.location.hash.slice(1);
    if (id && !id.startsWith('/')) document.getElementById(id)?.scrollIntoView();
  }, []);

  // Put the student's own details into the prompts, so there is less to edit by hand.
  const info = useBuilder((s) => s.info);
  const named = info.name.trim() && info.name !== 'Your Name';
  const personalise = (text: string) =>
    named
      ? text
          .replaceAll('[theme-folder]', themeSlug(info.name))
          .replaceAll('[Your Name]', info.name)
          .replaceAll('[Your tagline]', info.tagline || '[Your tagline]')
      : text;

  function startWith(key: string) {
    const label = PRESETS.find((p) => p.key === key)?.label ?? key;
    // Switching design replaces colours, fonts and sections, so ask anyone who has started.
    if (hasDraft && !confirm(tr('Switch your theme to the {name} design? Your info and photos stay.', { name: tr(label) }))) return;
    applyPreset(key);
    // The template is chosen: go straight to the next step.
    window.location.hash = '#/build?step=info';
  }

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded focus:bg-white focus:px-3 focus:py-2">
        Skip to content
      </a>

      <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/85 backdrop-blur">
        <nav className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-3 sm:px-6" aria-label="Main">
          <a href="#/" className="flex items-center gap-2 font-bold">
            <span aria-hidden className="grid h-7 w-7 grid-cols-2 gap-0.5 rounded-md bg-blue-700 p-1">
              <span className="rounded-sm bg-white" />
              <span className="rounded-sm bg-white/60" />
              <span className="rounded-sm bg-white/60" />
              <span className="rounded-sm bg-white" />
            </span>
            FolioBlocks
          </a>
          <div className="hidden items-center gap-5 text-sm text-slate-600 md:flex">
            <a href="#designs" className="hover:text-slate-900">Templates</a>
            <a href="#ai" className="hover:text-slate-900">AI guide</a>
            <a href="#wordpress-com" className="hover:text-slate-900">WordPress.com</a>
            <a href="#/translate" className="hover:text-slate-900">Translate</a>
            <a href={REPO} className="hover:text-slate-900">GitHub</a>
          </div>
          <LangToggle className="ml-auto" />
          <a href="#/build" className="rounded-md bg-slate-900 px-3.5 py-2 text-sm font-semibold text-white hover:bg-slate-700">
            Start building
          </a>
        </nav>
      </header>

      <main id="main">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div aria-hidden className="pointer-events-none absolute inset-x-0 -top-40 h-96 bg-gradient-to-b from-blue-50 to-transparent" />
          <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-24">
            <div>
              <p className="inline-flex rounded-full border border-blue-200 bg-white px-3 py-1 text-xs font-medium text-blue-800">
                Free · Open source · No sign-up
              </p>
              <h1 className="mt-5 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
                Your WordPress portfolio theme, ready in minutes.
              </h1>
              <p className="mt-5 max-w-xl text-lg text-slate-600">
                Add your info and photos, pick a design, watch it update as you type, and download a real block theme you can
                install on any WordPress site. Made for WordPress Credits and WP Campus Connect students.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a href="#/build" className="rounded-lg bg-blue-700 px-5 py-3 font-semibold text-white shadow-sm hover:bg-blue-800">
                  {hasDraft ? 'Continue your theme →' : 'Start building →'}
                </a>
                <a href="#ai" className="rounded-lg border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-800 hover:bg-slate-50">
                  Build with an AI agent
                </a>
              </div>
              <p className="mt-6 text-sm text-slate-500">
                Follows the conventions of <a className="underline hover:text-slate-700" href="https://github.com/WordPress/ipsum">Ipsum</a>,
                WordPress' default theme in the making, and passes its checks.
              </p>
            </div>
            <div className="relative mx-auto w-full max-w-md lg:max-w-none">
              <div className="grid grid-cols-2 gap-4">
                {PRESETS.slice(0, 4).map((p, i) => (
                  <div key={p.key} className={i % 2 ? 'translate-y-6' : ''}>
                    <DesignMock p={p} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Three ways */}
        <section className="border-y border-slate-200 bg-slate-50 py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <SectionHeading eyebrow="Three ways" title="Start however suits you" />
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {[
                {
                  n: '1',
                  title: 'Build in your browser',
                  text: 'No install, no account. Fill in the steps, see a live preview, then download the zip or open it in WordPress Playground.',
                  link: { href: '#/build', label: 'Open the builder' },
                },
                {
                  n: '2',
                  title: 'Customize with an AI agent',
                  text: 'Already have wp-env, Studio or Local? Take your theme further with Claude Code, Cursor or Copilot, using WordPress’ own agent skills.',
                  link: { href: '#ai', label: 'Read the AI guide' },
                },
                {
                  n: '3',
                  title: 'Publish it',
                  text: 'Upload the zip to WordPress.com (the free Student plan works) or any WordPress host. Step by step below.',
                  link: { href: '#wordpress-com', label: 'Publishing guide' },
                },
              ].map((c) => (
                <div key={c.n} className="flex flex-col rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 font-bold text-blue-800">{c.n}</span>
                  <h3 className="mt-4 text-lg font-semibold">{c.title}</h3>
                  <p className="mt-2 flex-1 text-slate-600">{c.text}</p>
                  <a href={c.link.href} className="mt-4 text-sm font-semibold text-blue-700 hover:text-blue-900">
                    {c.link.label} →
                  </a>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Designs */}
        <section className="py-20" aria-labelledby="designs-title">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div id="designs" className="mx-auto max-w-2xl scroll-mt-24 text-center">
              <p className="text-sm font-semibold tracking-wide text-blue-700 uppercase">{PRESETS.length} templates</p>
              <h2 id="designs-title" className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Pick a starting point, then make it yours</h2>
              <p className="mt-4 text-lg text-slate-600">
                Every design can be changed: colours, fonts, corners, and each page's sections, which you can reorder, swap, add or remove.
              </p>
            </div>
            <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {PRESETS.map((p) => (
                <article key={p.key} className="flex flex-col">
                  <DesignMock p={p} />
                  <h3 className="mt-4 font-semibold">{p.label}</h3>
                  <p className="mt-1 text-xs font-medium text-blue-800">Best for: {p.bestFor}</p>
                  <p className="mt-1 flex-1 text-sm text-slate-600">{p.description}</p>
                  <button
                    type="button"
                    onClick={() => startWith(p.key)}
                    className="mt-3 self-start rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium hover:bg-slate-50"
                    aria-label={tr('Start with the {name} design', { name: tr(p.label) })}
                  >
                    Use this template
                  </button>
                </article>
              ))}
            </div>
            <ol className="mx-auto mt-16 grid max-w-4xl gap-4 sm:grid-cols-4">
              {['Add your info and photos', 'Choose colours and fonts', 'Arrange your pages', 'Download, or open in Playground'].map((t, i) => (
                <li key={t} className="rounded-lg bg-slate-50 p-4 text-sm">
                  <span className="font-bold text-blue-700">Step {i + 1}</span>
                  <span className="mt-1 block text-slate-700">{t}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* AI guide */}
        <section className="border-t border-slate-200 bg-slate-50 py-20">
          <div className="mx-auto max-w-4xl px-4 sm:px-6">
            <SectionHeading id="ai" eyebrow="AI agent guide" title="Take your site further with an AI agent">
              If you have a local WordPress (wp-env, WordPress Studio or Local) and an AI coding agent, you can customize everything:
              new pages, sections, style variations, real content. These steps keep the agent on WordPress' best practice.
            </SectionHeading>

            <ol className="mt-12 space-y-6">
              {LOCAL_SETUP.map((s, i) => (
                <li key={s.title} className="rounded-xl border border-slate-200 bg-white p-6">
                  <h3 className="font-semibold">
                    <span className="mr-2 text-blue-700">{i + 1}.</span>
                    {s.title}
                  </h3>
                  <p className="mt-2 text-slate-600">{s.text}</p>
                  {s.code && (
                    <div className="mt-3">
                      <Code>{s.code}</Code>
                    </div>
                  )}
                </li>
              ))}
            </ol>

            <h3 className="mt-14 text-xl font-semibold">Which skills, and what for</h3>
            <p className="mt-2 text-slate-600">
              All from <a className="text-blue-700 underline" href={SKILLS_REPO}>WordPress/agent-skills</a>. The install command above adds them all.
            </p>
            <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-100 text-slate-700">
                  <tr>
                    <th scope="col" className="px-4 py-2 font-semibold">Skill</th>
                    <th scope="col" className="px-4 py-2 font-semibold">Use it for</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {SKILLS.map((s) => (
                    <tr key={s.name}>
                      <td className="px-4 py-2 font-mono text-[13px] whitespace-nowrap text-slate-900">{s.name}</td>
                      <td className="px-4 py-2 text-slate-600">{s.use}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h3 className="mt-14 text-xl font-semibold">Prompts to copy</h3>
            <p className="mt-2 text-slate-600">
              One at a time, in order. Replace the [brackets] with your own details.
              {named && ` Your theme folder (${themeSlug(info.name)}) and name are already filled in.`} Your zip also includes an AGENTS.md
              file that tells the agent this theme's rules.
            </p>
            <div className="mt-4 space-y-3">
              {PROMPTS.map((p) => (
                <details key={p.title} className="group rounded-xl border border-slate-200 bg-white open:shadow-sm">
                  <summary className="flex cursor-pointer list-none items-center gap-3 px-5 py-4">
                    <span className="flex-1 font-semibold">{p.title}</span>
                    <span className="hidden gap-1 sm:flex">
                      {p.skills.map((s) => (
                        <span key={s} className="rounded bg-blue-50 px-1.5 py-0.5 font-mono text-[11px] text-blue-800">
                          {s}
                        </span>
                      ))}
                    </span>
                    <span aria-hidden className="text-slate-400 transition group-open:rotate-90">›</span>
                  </summary>
                  <div className="px-5 pb-5">
                    <Code>{personalise(p.text)}</Code>
                  </div>
                </details>
              ))}
              <details className="group rounded-xl border border-dashed border-slate-300 bg-white">
                <summary className="flex cursor-pointer list-none items-center gap-3 px-5 py-4">
                  <span className="flex-1 font-semibold">No FolioBlocks? Have the agent build the whole theme</span>
                  <span aria-hidden className="text-slate-400 transition group-open:rotate-90">›</span>
                </summary>
                <div className="px-5 pb-5">
                  <Code>{FROM_SCRATCH_PROMPT}</Code>
                </div>
              </details>
            </div>
            <p className="mt-6 text-sm text-slate-500">
              Tip: review what the agent changes before keeping it, and keep your theme in Git so you can undo. Use only photos and fonts you
              have the right to use.
            </p>
          </div>
        </section>

        {/* WordPress.com */}
        <section className="py-20">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <SectionHeading id="wordpress-com" eyebrow="Publish" title="Put your theme on WordPress.com" />

            <p className="mt-10 rounded-xl border border-blue-200 bg-blue-50 p-4 text-slate-800">
              <span aria-hidden>🎓 </span>
              <strong>Students:</strong> the free WordPress.com Student plan (first year free) can upload themes.{' '}
              <a className="text-blue-800 underline" href={WPCOM_LINKS.studentPlan}>Details</a>
            </p>

            <div className="mt-6 rounded-xl border border-slate-200 p-6 shadow-sm">
              <h3 className="text-lg font-semibold">Upload your theme</h3>
              <ol className="mt-4 list-decimal space-y-2 pl-5 text-slate-700">
                {WPCOM_UPLOAD_STEPS.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ol>
              <p className="mt-4 text-sm text-slate-600">Tip: change colours, fonts and text any time in Appearance → Editor.</p>
            </div>

            <details className="group mt-4 rounded-xl border border-slate-200">
              <summary className="flex cursor-pointer list-none items-center gap-3 px-6 py-4">
                <span className="flex-1 font-semibold">Advanced: build locally with WordPress Studio</span>
                <span aria-hidden className="text-slate-400 transition group-open:rotate-90">›</span>
              </summary>
              <div className="px-6 pb-6">
                <ol className="list-decimal space-y-2 pl-5 text-slate-700">
                  {STUDIO_STEPS.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ol>
                <p className="mt-3 text-sm text-slate-600">
                  Publish only your theme the first time: "Content and settings" replaces the live site's content.{' '}
                  <a className="text-blue-700 underline" href={WPCOM_LINKS.studioSync}>Studio Sync docs</a>
                </p>
              </div>
            </details>

            <p className="mt-6 text-sm text-slate-500">
              Not a student? Theme upload needs the Personal plan or higher; the Free plan can't upload themes.{' '}
              <a className="underline" href={WPCOM_LINKS.upload}>WordPress.com guide</a>
            </p>
          </div>
        </section>

        {/* Final call */}
        <section className="bg-slate-900 py-16 text-center text-white">
          <h2 className="text-3xl font-bold">Ready when you are</h2>
          <p className="mx-auto mt-3 max-w-xl text-slate-300">It takes about ten minutes. Everything stays in your browser until you download it.</p>
          <a href="#/build" className="mt-8 inline-block rounded-lg bg-white px-6 py-3 font-semibold text-slate-900 hover:bg-slate-100">
            {hasDraft ? 'Continue your theme →' : 'Start building →'}
          </a>
        </section>
      </main>

      <footer className="border-t border-slate-200 py-10 text-sm text-slate-500">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 sm:px-6">
          <span>FolioBlocks · GPL-2.0-or-later</span>
          <a className="hover:text-slate-700" href={REPO}>Source on GitHub</a>
          <a className="hover:text-slate-700" href={`${REPO}/issues/new?template=beta-feedback.yml`}>Give feedback</a>
          <a className="hover:text-slate-700" href="#/translate">Help translate</a>
          <a className="hover:text-slate-700" href={SKILLS_REPO}>WordPress agent skills</a>
          <a className="hover:text-slate-700" href="https://openverse.org">Sample photos from Openverse (CC0)</a>
          <span className="ml-auto">Not affiliated with WordPress.org or WordPress.com.</span>
        </div>
      </footer>
    </div>
  );
}

