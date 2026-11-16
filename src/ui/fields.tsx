import { useId, useState, type ReactNode } from 'react';

export const inputCls =
  'mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/30';

export function Field(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  textarea?: boolean;
  type?: string;
  hint?: string;
  placeholder?: string;
}) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      {props.label}
      {props.textarea ? (
        <textarea
          className={inputCls}
          rows={3}
          value={props.value}
          placeholder={props.placeholder}
          onChange={(e) => props.onChange(e.target.value)}
        />
      ) : (
        <input
          className={inputCls}
          type={props.type ?? 'text'}
          value={props.value}
          placeholder={props.placeholder}
          onChange={(e) => props.onChange(e.target.value)}
        />
      )}
      {props.hint && <span className="mt-1 block text-xs font-normal text-slate-500">{props.hint}</span>}
    </label>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">{children}</h2>;
}

export function Select<T extends string>(props: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      {props.label}
      <select className={inputCls} value={props.value} onChange={(e) => props.onChange(e.target.value as T)}>
        {props.options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

/**
 * Edit a list of objects (projects, contributions) with add / remove.
 */
export function Repeater<T extends Record<string, string | undefined>>(props: {
  label: string;
  items: T[];
  fields: { key: keyof T & string; label: string; textarea?: boolean; placeholder?: string }[];
  empty: T;
  addLabel: string;
  onChange: (items: T[]) => void;
  /** Extra controls under each item, e.g. an image picker. */
  renderExtra?: (item: T, index: number) => ReactNode;
}) {
  const update = (i: number, key: keyof T, value: string) =>
    props.onChange(props.items.map((it, j) => (j === i ? { ...it, [key]: value } : it)));

  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-medium text-slate-700">{props.label}</legend>
      {props.items.map((item, i) => (
        <div key={i} className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
          {props.fields.map((f) => (
            <Field
              key={f.key}
              label={f.label}
              textarea={f.textarea}
              placeholder={f.placeholder}
              value={item[f.key] ?? ''}
              onChange={(v) => update(i, f.key, v)}
            />
          ))}
          {props.renderExtra?.(item, i)}
          <button
            type="button"
            onClick={() => props.onChange(props.items.filter((_, j) => j !== i))}
            className="text-xs font-medium text-red-700 hover:underline"
          >
            Remove
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => props.onChange([...props.items, { ...props.empty }])}
        className="w-full rounded-md border border-dashed border-slate-400 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
      >
        + {props.addLabel}
      </button>
    </fieldset>
  );
}

/**
 * Pick a photo, resize it in the browser, and show a thumbnail. Without
 * one, the theme uses a placeholder.
 */
export function ImageField(props: {
  label: string;
  value: string | undefined;
  hint?: string;
  aspect?: 'square' | 'wide';
  onPick: (file: File) => Promise<void>;
  onRemove: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const id = useId();

  async function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true);
    setError('');
    try {
      await props.onPick(file);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  const box = props.aspect === 'wide' ? 'h-14 w-24' : 'h-14 w-14';
  return (
    <div className="text-sm font-medium text-slate-700">
      {props.label}
      <div className="mt-1 flex items-center gap-3">
        <div className={`${box} shrink-0 overflow-hidden rounded-md border border-slate-200 bg-slate-100`}>
          {props.value ? (
            <img src={props.value} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full items-center justify-center text-[10px] font-normal text-slate-400">Placeholder</span>
          )}
        </div>
        <label
          htmlFor={id}
          className="cursor-pointer rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-800 hover:bg-slate-100 focus-within:ring-2 focus-within:ring-blue-600/30"
        >
          {busy ? 'Resizing…' : props.value ? 'Change' : 'Upload'}
          <input id={id} type="file" accept="image/*" className="sr-only" onChange={pick} disabled={busy} />
        </label>
        {props.value && (
          <button type="button" onClick={props.onRemove} className="text-xs font-medium text-red-700 hover:underline">
            Remove
          </button>
        )}
      </div>
      {props.hint && <span className="mt-1 block text-xs font-normal text-slate-500">{props.hint}</span>}
      {error && (
        <span role="alert" className="mt-1 block text-xs font-normal text-red-700">
          {error}
        </span>
      )}
    </div>
  );
}

/** Copies text and says so. `children` is the button's label. */
export function CopyButton(props: { text: string | (() => string); children: ReactNode; className?: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    const text = typeof props.text === 'function' ? props.text() : props.text;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Older browsers, or no clipboard permission: copy through a hidden textarea.
      const t = document.createElement('textarea');
      t.value = text;
      document.body.appendChild(t);
      t.select();
      document.execCommand('copy');
      t.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }
  return (
    <button
      type="button"
      onClick={copy}
      className={props.className ?? 'text-xs font-medium text-blue-700 underline hover:text-blue-900'}
    >
      <span aria-live="polite">{copied ? 'Copied ✓ now paste it in your AI chat' : props.children}</span>
    </button>
  );
}
