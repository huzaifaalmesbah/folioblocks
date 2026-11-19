import { useEffect, useRef, useState } from 'react';
import { setConfirmHost, type ConfirmRequest } from './confirm';

/** Mount once, inside the translated root, to show askConfirm() dialogs. */
export function ConfirmHost() {
  const [request, setRequest] = useState<ConfirmRequest | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    setConfirmHost(setRequest);
    return () => setConfirmHost(null);
  }, []);

  // showModal() focuses the first button, Cancel: the safe choice if Enter is pressed by habit.
  useEffect(() => {
    const d = dialog.current;
    if (request && d && !d.open) d.showModal();
  }, [request]);

  const close = (ok: boolean) => {
    request?.resolve(ok);
    dialog.current?.close();
    setRequest(null);
  };

  return (
    <dialog
      ref={dialog}
      aria-labelledby="confirm-title"
      aria-describedby={request?.message ? 'confirm-message' : undefined}
      // Esc closes the dialog: count it as Cancel.
      onCancel={(e) => {
        e.preventDefault();
        close(false);
      }}
      // A click on the backdrop (the dialog element itself, outside the panel) cancels.
      onClick={(e) => e.target === e.currentTarget && close(false)}
      className="m-auto w-[min(28rem,calc(100%-2rem))] rounded-xl bg-white p-0 text-slate-900 shadow-2xl backdrop:bg-slate-900/40 backdrop:backdrop-blur-[2px]"
    >
      {request && (
        <div className="p-6">
          <h2 id="confirm-title" className="text-lg font-semibold leading-snug">
            {request.title}
          </h2>
          {request.message && (
            <p id="confirm-message" className="mt-2 text-sm leading-relaxed text-slate-600">
              {request.message}
            </p>
          )}
          <div className="mt-6 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => close(false)}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => close(true)}
              className={`rounded-md px-4 py-2 text-sm font-semibold text-white ${
                request.danger ? 'bg-red-700 hover:bg-red-800' : 'bg-blue-700 hover:bg-blue-800'
              }`}
            >
              {request.confirmLabel}
            </button>
          </div>
        </div>
      )}
    </dialog>
  );
}
