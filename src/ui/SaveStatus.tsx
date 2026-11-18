import { useEffect, useState } from 'react';
import { useSaveStatus } from '../saveStatus';
import { useBuilder } from '../store';

function ago(at: number, now: number): string {
  const s = Math.round((now - at) / 1000);
  if (!at || s < 10) return 'just now';
  if (s < 60) return 'a few seconds ago';
  const m = Math.round(s / 60);
  return m === 1 ? '1 minute ago' : `${m} minutes ago`;
}

/**
 * Says where the work is and whether it is safe: saved in this browser,
 * not saved (storage full), not kept at all (storage blocked), or changed
 * in another tab. The problems offer what to do about them.
 */
export function SaveStatus({ onBackup }: { onBackup: () => void }) {
  const { state, at, otherTab } = useSaveStatus();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  const backup = (
    <button type="button" onClick={onBackup} className="font-semibold underline">
      Save a backup file
    </button>
  );

  if (otherTab) {
    return (
      <p role="status" className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-950">
        You changed this draft in another tab.{' '}
        <button
          type="button"
          className="font-semibold underline"
          onClick={() => {
            void useBuilder.persist.rehydrate();
            useSaveStatus.setState({ otherTab: false });
          }}
        >
          Load the newer version
        </button>
      </p>
    );
  }
  if (state === 'full') {
    return (
      <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-800">
        ⚠ Not saved: this browser is out of space. Remove a photo or use smaller ones, and {backup}.
      </p>
    );
  }
  if (state === 'blocked') {
    return (
      <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-800">
        ⚠ This browser isn't keeping your work (a private window, or storage is switched off). {backup} before you close it.
      </p>
    );
  }
  return (
    <p
      className="text-xs text-slate-500"
      title="Your work stays in this browser on this computer. Clearing browser data removes it, so save a backup file now and then."
    >
      <span aria-hidden className="text-green-600">✓</span> Saved in this browser · {ago(at, now)}
    </p>
  );
}
