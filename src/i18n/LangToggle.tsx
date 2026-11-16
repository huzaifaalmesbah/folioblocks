import { useUi } from './ui';

/** Switches the app's own interface between English and Bengali. */
export function LangToggle({ className = '' }: { className?: string }) {
  const lang = useUi((s) => s.lang);
  const setLang = useUi((s) => s.setLang);
  return (
    <button
      type="button"
      data-no-translate
      lang={lang === 'en' ? 'bn' : 'en'}
      onClick={() => setLang(lang === 'en' ? 'bn' : 'en')}
      className={`rounded-md border border-slate-300 px-2.5 py-1 text-sm font-medium text-slate-700 hover:bg-slate-100 ${className}`}
    >
      {lang === 'en' ? 'বাংলা' : 'English'}
    </button>
  );
}
