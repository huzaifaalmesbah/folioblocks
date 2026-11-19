/**
 * The FolioBlocks mark: a page built from blocks (a header, a tall block and
 * two small ones), in WordPress Education blue. public/favicon.svg is the same
 * drawing, so keep the two in step.
 */
export function LogoMark({ className = 'h-7 w-7' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true" focusable="false">
      <rect width="32" height="32" rx="8" fill="#3858e9" />
      <rect x="7" y="7" width="18" height="5" rx="1.5" fill="#fff" />
      <rect x="7" y="14" width="8" height="11" rx="1.5" fill="#fff" />
      <rect x="17" y="14" width="8" height="4.5" rx="1.5" fill="#fff" fillOpacity=".6" />
      <rect x="17" y="20.5" width="8" height="4.5" rx="1.5" fill="#fff" />
    </svg>
  );
}

/** The mark with the name beside it, for page headers. */
export function Logo() {
  return (
    <span className="flex items-center gap-2 font-bold">
      <LogoMark />
      FolioBlocks
    </span>
  );
}
