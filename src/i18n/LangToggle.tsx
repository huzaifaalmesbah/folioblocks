import { enabledLanguages } from './languages';
import { useUi } from './ui';

/**
 * The app's interface language: every enabled language, each in its own
 * name. Hidden while English is the only one.
 */
export function LangToggle({ className = '' }: { className?: string }) {
  const lang = useUi((s) => s.lang);
  const setLang = useUi((s) => s.setLang);
  const languages = enabledLanguages();
  if (languages.length < 2) return null;
  return (
    <select
      data-no-translate
      aria-label="Language"
      value={lang}
      onChange={(e) => setLang(e.target.value)}
      className={`rounded-md border border-slate-300 bg-white px-2 py-1 text-sm font-medium text-slate-700 hover:bg-slate-100 ${className}`}
    >
      {languages.map((l) => (
        <option key={l.code} value={l.code} lang={l.code}>
          {l.name}
        </option>
      ))}
    </select>
  );
}
