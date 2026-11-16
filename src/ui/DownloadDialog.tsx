import { useEffect, useRef } from 'react';
import type { CheckItem } from '../checklist';
import { WPCOM_UPLOAD_STEPS } from '../landing/content';

/**
 * Shown when "Download" is pressed: first a short check of what a visitor
 * would notice, then, once the zip is saved, what to do with it.
 */
export function DownloadDialog(props: {
  open: boolean;
  phase: 'check' | 'done';
  items: CheckItem[];
  slug: string;
  busy: boolean;
  error: string;
  onDownload: () => void;
  onFix: (step: CheckItem['step']) => void;
  onPlayground: () => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (props.open && !d.open) d.showModal();
    if (!props.open && d.open) d.close();
  }, [props.open]);

  const fixes = props.items.filter((i) => i.level === 'fix');
  const tips = props.items.filter((i) => i.level === 'tip');

  return (
    <dialog
      ref={ref}
      onClose={props.onClose}
      aria-labelledby="download-title"
      className="m-auto w-[min(92vw,34rem)] rounded-2xl p-0 text-slate-900 shadow-2xl backdrop:bg-slate-900/50"
    >
      <div className="max-h-[85vh] overflow-y-auto p-6">
        {props.phase === 'check' ? (
          <>
            <h2 id="download-title" className="text-xl font-bold">
              {fixes.length ? 'Almost there' : 'Looks ready'}
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              {fixes.length
                ? 'A visitor would notice these. You can fix them now or download anyway.'
                : 'Nothing a visitor would trip over. You can still change everything later.'}
            </p>

            {fixes.length > 0 && (
              <ul className="mt-4 space-y-2">
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
              <ul className="mt-3 space-y-1.5 text-sm text-slate-600">
                {tips.map((i) => (
                  <li key={i.text} className="flex gap-2">
                    <span aria-hidden>💡</span>
                    {i.text}
                  </li>
                ))}
              </ul>
            )}

            {props.error && (
              <p role="alert" className="mt-3 text-sm text-red-700">
                {props.error}
              </p>
            )}
            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <button type="button" onClick={props.onClose} className="rounded-md border border-slate-300 px-4 py-2 text-sm hover:bg-slate-100">
                Keep editing
              </button>
              <button
                type="button"
                onClick={props.onDownload}
                disabled={props.busy}
                className="rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60"
              >
                {props.busy ? 'Building…' : fixes.length ? 'Download anyway' : `Download ${props.slug}.zip`}
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 id="download-title" className="text-xl font-bold">
              🎉 Your theme is downloaded
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              <span className="font-mono text-xs">{props.slug}.zip</span> is in your Downloads folder. Don't unzip it.
            </p>

            <h3 className="mt-5 text-sm font-semibold">Put it on your site</h3>
            <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-sm text-slate-700">
              {WPCOM_UPLOAD_STEPS.slice(1).map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ol>
            <p className="mt-2 text-xs text-slate-500">Students: the free WordPress.com Student plan can upload themes.</p>

            <h3 className="mt-5 text-sm font-semibold">Or go further</h3>
            <ul className="mt-2 space-y-1.5 text-sm">
              <li>
                <button type="button" onClick={props.onPlayground} className="font-medium text-blue-700 underline">
                  Try it in WordPress Playground ↗
                </button>{' '}
                <span className="text-slate-600">(a real WordPress in your browser, nothing to install)</span>
              </li>
              <li>
                <a href="#ai" className="font-medium text-blue-700 underline">
                  Customize it with an AI agent
                </a>{' '}
                <span className="text-slate-600">(your zip includes an AGENTS.md for it)</span>
              </li>
            </ul>

            <p className="mt-5 text-xs text-slate-500">
              How did it go?{' '}
              <a
                className="underline"
                href="https://github.com/huzaifaalmesbah/folioblocks/issues/new?template=beta-feedback.yml"
                target="_blank"
                rel="noopener"
              >
                Tell us in two minutes
              </a>
              .
            </p>
            <div className="mt-4 flex justify-end">
              <button type="button" onClick={props.onClose} className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700">
                Done
              </button>
            </div>
          </>
        )}
      </div>
    </dialog>
  );
}
