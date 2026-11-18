import type { ReactNode } from 'react';
import type { CheckItem } from '../checklist';

/**
 * Step 5: check, download, then put the theme on a WordPress site.
 * The check lists what a visitor would notice, each with a link to fix it.
 */
export function PublishStep(props: {
  items: CheckItem[];
  slug: string;
  busy: boolean;
  error: string;
  downloaded: boolean;
  onDownload: () => void;
  onFix: (step: CheckItem['step']) => void;
  onPlayground: () => void;
  /** The quick guide, shown under the download. */
  guide?: ReactNode;
}) {
  const fixes = props.items.filter((i) => i.level === 'fix');
  const tips = props.items.filter((i) => i.level === 'tip');

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">{fixes.length ? 'Almost there' : 'Looks ready'}</h2>
        <p className="text-sm text-slate-600">
          {fixes.length
            ? 'A visitor would notice these. You can fix them now or download anyway.'
            : 'Nothing a visitor would trip over. You can still change everything later.'}
        </p>
        {fixes.length > 0 && (
          <ul className="space-y-2">
            {fixes.map((i) => (
              <li key={i.text} className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-950">
                <span aria-hidden>⚠️</span>
                <span className="flex-1">{i.text}</span>
                <button type="button" onClick={() => props.onFix(i.step)} className="shrink-0 font-semibold text-blue-700 underline">
                  Fix
                </button>
              </li>
            ))}
          </ul>
        )}
        {tips.length > 0 && (
          <details className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
            <summary className="cursor-pointer font-medium">Good to know ({tips.length})</summary>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {tips.map((i) => (
                <li key={i.text}>{i.text}</li>
              ))}
            </ul>
          </details>
        )}
      </section>

      <section className="space-y-3 rounded-xl border border-blue-200 bg-blue-50/60 p-4">
        <button
          type="button"
          onClick={props.onDownload}
          disabled={props.busy}
          className="w-full rounded-md bg-blue-700 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60"
        >
          {props.busy ? 'Making your theme…' : `Download ${props.slug}.zip`}
        </button>
        {props.downloaded && (
          <p role="status" className="text-sm text-green-800">
            🎉 Downloaded to your Downloads folder. Don't unzip it: WordPress takes the zip as it is.
          </p>
        )}
        {props.error && (
          <p role="alert" className="text-sm text-red-700">
            {props.error}
          </p>
        )}
        <p className="text-xs text-slate-600">
          Want to try it first?{' '}
          <button type="button" onClick={props.onPlayground} className="font-medium text-blue-700 underline">
            Open it in WordPress Playground ↗
          </button>{' '}
          (a real WordPress in your browser, nothing to install).
        </p>
      </section>

      {props.guide}
    </div>
  );
}
