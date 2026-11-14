import type { ReactNode } from 'react';

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
export function Repeater<T extends Record<string, string>>(props: {
  label: string;
  items: T[];
  fields: { key: keyof T & string; label: string; textarea?: boolean; placeholder?: string }[];
  empty: T;
  addLabel: string;
  onChange: (items: T[]) => void;
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
