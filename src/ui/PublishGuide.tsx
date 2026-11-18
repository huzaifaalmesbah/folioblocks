import { useState } from 'react';
import { COURSE_GROUPS, FIRST_COURSES, GUIDE_PARTS, INSTALL_PLACES, type Course, type GuideLink, type GuidePart } from '../landing/content';

function Links({ links }: { links: GuideLink[] }) {
  if (!links.length) return null;
  return (
    <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs">
      {links.map((l) => (
        <a key={l.url} href={l.url} target="_blank" rel="noopener" className="font-medium text-blue-700 underline">
          {l.label} ↗
        </a>
      ))}
    </p>
  );
}

function Steps({ part }: { part: GuidePart }) {
  return (
    <>
      {part.text && <p className="text-sm text-slate-600">{part.text}</p>}
      <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-sm text-slate-700">
        {part.steps.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ol>
      <Links links={part.links} />
    </>
  );
}

export function CourseCard({ c }: { c: Course }) {
  return (
    <a href={c.url} target="_blank" rel="noopener" className="block rounded-lg border border-slate-200 p-3 hover:border-slate-400">
      <span className="block text-sm font-semibold text-slate-900" data-no-translate>
        {c.title} ↗
      </span>
      <span className="block text-xs text-slate-600">{c.note}</span>
      <span className="mt-1 block text-xs text-slate-500">
        {c.lessons} lessons · free
      </span>
    </a>
  );
}

/**
 * What to do with the zip: install it (any WordPress, WordPress.com, or on
 * your computer), set up the pages, customize, add pages and posts, update
 * later; then courses to learn more. `full` (the Guide page) opens every part
 * and lists all courses; the Publish step folds them and shows three.
 */
export function PublishGuide({ full = false }: { full?: boolean }) {
  const [place, setPlace] = useState(INSTALL_PLACES[0].id);
  const current = INSTALL_PLACES.find((p) => p.id === place)!;
  const [group, setGroup] = useState<(typeof COURSE_GROUPS)[number]['id']>('everyone');

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-slate-200 p-4">
        <h3 className="text-base font-semibold">1. Install your theme</h3>
        <div className="mt-2 flex flex-wrap gap-1.5" role="tablist" aria-label="Where is your site?">
          {INSTALL_PLACES.map((p) => (
            <button
              key={p.id}
              type="button"
              role="tab"
              aria-selected={place === p.id}
              onClick={() => setPlace(p.id)}
              className={`rounded-full border px-3 py-1 text-xs font-medium ${
                place === p.id ? 'border-blue-600 bg-blue-50 text-blue-800' : 'border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {p.title}
            </button>
          ))}
        </div>
        <div className="mt-3" role="tabpanel">
          <Steps part={current} />
        </div>
      </section>

      {GUIDE_PARTS.map((part, i) =>
        full ? (
          <section key={part.id} id={part.id} className="rounded-xl border border-slate-200 p-4">
            <h3 className="text-base font-semibold">
              {i + 2}. {part.title}
            </h3>
            <div className="mt-2">
              <Steps part={part} />
            </div>
          </section>
        ) : (
          <details key={part.id} className="group rounded-xl border border-slate-200 open:pb-4">
            <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3">
              <span className="flex-1 text-sm font-semibold text-slate-900">
                {i + 2}. {part.title}
              </span>
              <span aria-hidden className="text-slate-400 transition group-open:rotate-90">›</span>
            </summary>
            <div className="px-4">
              <Steps part={part} />
            </div>
          </details>
        ),
      )}

      <section className="rounded-xl bg-slate-50 p-4">
        <h3 className="text-base font-semibold">Want to learn more?</h3>
        <p className="text-sm text-slate-600">Free courses on Learn WordPress, at your own pace.</p>
        {full ? (
          <>
            <div className="mt-3 flex flex-wrap gap-1.5" role="tablist" aria-label="Courses for">
              {COURSE_GROUPS.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  role="tab"
                  aria-selected={group === g.id}
                  onClick={() => setGroup(g.id)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium ${
                    group === g.id ? 'border-blue-600 bg-white text-blue-800' : 'border-slate-300 text-slate-700 hover:bg-white'
                  }`}
                >
                  {g.title}
                </button>
              ))}
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2" role="tabpanel">
              {COURSE_GROUPS.find((g) => g.id === group)!.courses.map((c) => (
                <CourseCard key={c.url} c={c} />
              ))}
            </div>
          </>
        ) : (
          <div className="mt-3 space-y-2">
            {FIRST_COURSES.map((c) => (
              <CourseCard key={c.url} c={c} />
            ))}
            <a href="#/guide" className="block text-xs font-medium text-blue-700 underline">
              All courses and the full guide →
            </a>
          </div>
        )}
      </section>
    </div>
  );
}
