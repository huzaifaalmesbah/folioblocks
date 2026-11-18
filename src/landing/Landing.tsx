import { useEffect, useState, type ReactNode } from 'react';
import { PRESETS } from '../presets';
import { DesignMock } from '../ui/DesignMock';
import { PublishGuide } from '../ui/PublishGuide';
import { themeSlug } from '../generator/utils';
import { REPO_URL } from '../config';
import { LangToggle } from '../i18n/LangToggle';
import { tr } from '../i18n/ui';
import { useBuilder } from '../store';
import {
  AGENT_STEPS,
  INSTALL_SKILLS,
  SAMPLE_CHAT,
  PROMPTS,
  SKILLS,
  SKILLS_REPO,
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
            <a href="#ai" className="hover:text-slate-900">AI agent</a>
            <a href="#/guide" className="hover:text-slate-900">Guide</a>
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
                  title: 'Or chat with an AI agent',
                  text: 'Answer a few questions in Claude Code, Codex, Cursor or Copilot. The FolioBlocks skill builds the same theme from your answers.',
                  link: { href: '#ai', label: 'See how' },
                },
                {
                  n: '3',
                  title: 'Publish it',
                  text: 'Upload the zip to any WordPress site or WordPress.com. Step by step below.',
                  link: { href: '#publish', label: 'Publishing guide' },
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
            <ol className="mx-auto mt-16 grid max-w-5xl gap-4 sm:grid-cols-5">
              {['Pick a template', 'Add your info and photos', 'Choose colours and fonts', 'Arrange your pages', 'Download and publish'].map((t, i) => (
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
            <SectionHeading id="ai" eyebrow="AI agent" title="Or answer a few questions, and let an AI agent build it">
              Prefer to chat? The FolioBlocks skill teaches your AI agent to ask you about yourself and build your theme with FolioBlocks. Nothing
              to write by hand, and nothing made up: it uses only your answers.
            </SectionHeading>

            <div className="mt-12 grid gap-6 lg:grid-cols-2">
              <ol className="space-y-4">
                {AGENT_STEPS.map((s, i) => (
                  <li key={s.title} className="rounded-xl border border-slate-200 bg-white p-5">
                    <h3 className="font-semibold">
                      <span className="mr-2 text-blue-700">{i + 1}.</span>
                      {s.title}
                    </h3>
                    <p className="mt-1.5 text-sm text-slate-600">{s.text}</p>
                    {s.code && (
                      <div className="mt-3">
                        <Code>{s.code}</Code>
                      </div>
                    )}
                    {s.link && (
                      <a className="mt-2 inline-block text-sm font-medium text-blue-700 underline" href={s.link.url}>
                        {s.link.label} ↗
                      </a>
                    )}
                  </li>
                ))}
              </ol>

              <figure className="rounded-xl border border-slate-200 bg-white p-5">
                <figcaption className="text-xs font-semibold tracking-wide text-slate-500 uppercase">What it feels like</figcaption>
                <ul className="mt-3 space-y-2.5">
                  {SAMPLE_CHAT.map((m) => (
                    <li key={m.text} className={`flex ${m.who === 'you' ? 'justify-end' : ''}`}>
                      <span
                        className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm ${
                          m.who === 'you' ? 'rounded-br-sm bg-blue-700 text-white' : 'rounded-bl-sm bg-slate-100 text-slate-800'
                        }`}
                      >
                        {m.text}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-xs text-slate-500">
                  The theme is the same as the builder makes. Open it in the builder any time to change it by hand.
                </p>
              </figure>
            </div>

            <details className="group mt-10 rounded-xl border border-slate-200 bg-white">
              <summary className="flex cursor-pointer list-none items-center gap-3 px-6 py-4">
                <span className="flex-1">
                  <span className="block font-semibold">Go further: change the theme's code with WordPress skills</span>
                  <span className="block text-sm text-slate-500">For new pages, sections or style variations beyond what the builder offers.</span>
                </span>
                <span aria-hidden className="text-slate-400 transition group-open:rotate-90">›</span>
              </summary>
              <div className="space-y-6 px-6 pb-6">
                <p className="text-sm text-slate-600">
                  Unzip your theme into an empty folder, open it in your agent, and add WordPress' own skills so it follows WordPress best
                  practice. Your zip's AGENTS.md tells the agent this theme's rules. After you change the theme's files by hand, don't rebuild it
                  from FolioBlocks: that would replace your changes.
                </p>
                <Code>{INSTALL_SKILLS}</Code>
                <div className="space-y-3">
                  {PROMPTS.map((p) => (
                    <details key={p.title} className="group/p rounded-lg border border-slate-200">
                      <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3">
                        <span className="flex-1 text-sm font-semibold">{p.title}</span>
                        <span className="hidden gap-1 sm:flex">
                          {p.skills.map((s) => (
                            <span key={s} className="rounded bg-blue-50 px-1.5 py-0.5 font-mono text-[11px] text-blue-800">
                              {s}
                            </span>
                          ))}
                        </span>
                        <span aria-hidden className="text-slate-400 transition group-open/p:rotate-90">›</span>
                      </summary>
                      <div className="px-4 pb-4">
                        <p className="mb-2 text-xs text-slate-500">
                          Replace the [brackets].{named && ` Your theme folder (${themeSlug(info.name)}) and name are already filled in.`}
                        </p>
                        <Code>{personalise(p.text)}</Code>
                      </div>
                    </details>
                  ))}
                </div>
                <details className="rounded-lg border border-slate-200">
                  <summary className="cursor-pointer px-4 py-3 text-sm font-semibold">The WordPress skills, and what each is for</summary>
                  <div className="overflow-x-auto px-4 pb-4">
                    <table className="w-full text-left text-sm">
                      <tbody className="divide-y divide-slate-100">
                        {SKILLS.map((s) => (
                          <tr key={s.name}>
                            <td className="py-2 pr-4 font-mono text-[13px] whitespace-nowrap text-slate-900">{s.name}</td>
                            <td className="py-2 text-slate-600">{s.use}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <p className="mt-2 text-xs text-slate-500">
                      From <a className="text-blue-700 underline" href={SKILLS_REPO}>WordPress/agent-skills</a>.
                    </p>
                  </div>
                </details>
              </div>
            </details>

            <p className="mt-6 text-sm text-slate-500">
              Tip: review what an agent changes before keeping it. Use only photos and fonts you have the right to use.
            </p>
          </div>
        </section>

        {/* Publish */}
        <section className="py-20">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            {/* Older links point at #wordpress-com. */}
            <span id="wordpress-com" />
            <SectionHeading id="publish" eyebrow="Publish" title="From zip to a live site">
              Install your theme on any WordPress site, make it yours in the Site Editor, and add pages and posts.
            </SectionHeading>
            <div className="mt-10">
              <PublishGuide />
            </div>
            <p className="mt-6 text-center">
              <a href="#/guide" className="inline-block rounded-lg border border-slate-300 px-5 py-2.5 font-semibold text-slate-800 hover:bg-slate-50">
                Read the full guide →
              </a>
            </p>
          </div>
        </section>

        {/* Final call */}
        <section className="bg-slate-900 px-4 py-16 text-center text-white">
          <h2 className="text-3xl font-bold">Ready when you are</h2>
          <p className="mx-auto mt-3 max-w-xl text-slate-300">It takes about ten minutes. Everything stays in your browser until you download it.</p>
          <a href="#/build" className="mt-8 inline-block rounded-lg bg-white px-6 py-3 font-semibold text-slate-900 hover:bg-slate-100">
            {hasDraft ? 'Continue your theme →' : 'Start building →'}
          </a>
        </section>
      </main>

      <footer className="border-t border-slate-200 py-8 text-sm text-slate-500">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 sm:px-6">
          <span>FolioBlocks · GPL-2.0-or-later</span>
          <nav aria-label="Footer" className="flex gap-5 sm:ml-auto">
            <a className="hover:text-slate-700" href="#/guide">Guide</a>
            <a className="hover:text-slate-700" href="#/translate">Help translate</a>
            <a className="hover:text-slate-700" href={REPO}>GitHub</a>
          </nav>
        </div>
      </footer>
    </div>
  );
}

