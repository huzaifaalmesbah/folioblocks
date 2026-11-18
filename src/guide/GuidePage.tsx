import { DEV_DOCS, USER_DOCS, type GuideLink } from '../landing/content';
import { PublishGuide } from '../ui/PublishGuide';
import { SiteFooter, SiteHeader } from '../ui/SiteChrome';

function LinkList({ links }: { links: GuideLink[] }) {
  return (
    <ul className="grid gap-2 sm:grid-cols-2">
      {links.map((l) => (
        <li key={l.url}>
          <a href={l.url} target="_blank" rel="noopener" className="block rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-blue-800 hover:border-slate-400">
            {l.label} ↗
          </a>
        </li>
      ))}
    </ul>
  );
}

/**
 * The guide: from the downloaded zip to a published site, then where to
 * learn more (courses, WordPress's help, the Theme Handbook).
 */
export function GuidePage() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <SiteHeader current="guide" />

      <main className="mx-auto max-w-3xl space-y-10 px-4 py-10 sm:px-6">
        <section className="space-y-3">
          <h1 className="text-3xl font-bold tracking-tight">Publish your site</h1>
          <p className="text-slate-600">
            You have downloaded your theme from FolioBlocks. Here is how to put it on a WordPress site, make it yours, and add pages and posts. Every step
            links to WordPress's own help.
          </p>
        </section>

        <PublishGuide full />

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">WordPress help</h2>
          <p className="text-sm text-slate-600">The official guides for using a block theme like yours.</p>
          <LinkList links={USER_DOCS} />
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Change the theme's code</h2>
          <p className="text-sm text-slate-600">
            Your theme is a standard block theme. The Theme Handbook explains each part; your zip's AGENTS.md lists its rules for AI coding agents.
          </p>
          <LinkList links={DEV_DOCS} />
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
