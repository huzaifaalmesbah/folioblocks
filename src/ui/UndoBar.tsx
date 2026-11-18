import { useEffect } from 'react';

export type Undo = { message: string; restore: () => void };

/** A short-lived "Done. Undo" bar for changes that replace the student's work. */
export function UndoBar({ undo, onDone }: { undo: Undo | null; onDone: () => void }) {
  useEffect(() => {
    if (!undo) return;
    const id = setTimeout(onDone, 12_000);
    return () => clearTimeout(id);
  }, [undo, onDone]);

  if (!undo) return null;
  return (
    <div role="status" className="flex items-center gap-3 border-t border-slate-200 bg-slate-900 px-4 py-2 text-sm text-white">
      <span className="flex-1">{undo.message}</span>
      <button
        type="button"
        onClick={() => {
          undo.restore();
          onDone();
        }}
        className="rounded-md bg-white px-3 py-1 font-semibold text-slate-900 hover:bg-slate-100"
      >
        Undo
      </button>
    </div>
  );
}
