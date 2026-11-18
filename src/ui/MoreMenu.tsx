import { useEffect, useRef, useState, type ReactNode } from 'react';

export type MoreItem =
  | { kind: 'button'; label: string; hint?: string; danger?: boolean; onClick: () => void }
  | { kind: 'file'; label: string; hint?: string; accept: string; onFile: (e: React.ChangeEvent<HTMLInputElement>) => void }
  | { kind: 'divider' };

/**
 * The "⋯ More" menu: things most people never need (backups, code,
 * blueprint, start over), out of the way but one click from anywhere.
 */
export function MoreMenu({ items, children }: { items: MoreItem[]; children?: ReactNode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const itemCls = 'block w-full rounded-md px-3 py-2 text-left text-sm hover:bg-slate-100';
  const hint = (h?: string) => h && <span className="block text-xs font-normal text-slate-500">{h}</span>;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="More options"
        title="More options"
        onClick={() => setOpen((o) => !o)}
        className="rounded-md border border-slate-300 px-2.5 py-1 text-sm font-semibold text-slate-700 hover:bg-slate-100"
      >
        ⋯
      </button>
      {open && (
        <div role="menu" className="absolute right-0 z-30 mt-1 w-72 rounded-lg border border-slate-200 bg-white p-1 shadow-lg">
          {children}
          {items.map((item, i) => {
            if (item.kind === 'divider') return <hr key={i} className="my-1 border-slate-200" />;
            if (item.kind === 'file') {
              return (
                <label key={item.label} role="menuitem" className={`${itemCls} cursor-pointer font-medium text-slate-800`}>
                  {item.label}
                  {hint(item.hint)}
                  <input
                    type="file"
                    accept={item.accept}
                    className="sr-only"
                    onChange={(e) => {
                      setOpen(false);
                      item.onFile(e);
                    }}
                  />
                </label>
              );
            }
            return (
              <button
                key={item.label}
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  item.onClick();
                }}
                className={`${itemCls} font-medium ${item.danger ? 'text-red-700 hover:bg-red-50' : 'text-slate-800'}`}
              >
                {item.label}
                {hint(item.hint)}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
