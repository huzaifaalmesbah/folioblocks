import type { ReactNode } from 'react';
import { fontDef } from '../fonts';
import type { PresetDef } from '../presets';

const img = (name: string) => `${import.meta.env.BASE_URL}images/${name}`;

/** A tiny drawing of each design, in its own colours and fonts. */
export function DesignMock({ p }: { p: PresetDef }) {
  const { palette, fonts } = p.style;
  const heading = fontDef(fonts.heading).stack;
  const body = fontDef(fonts.body).stack;
  const radius = { none: '0', sm: '3px', md: '6px', lg: '12px' }[p.style.radius];
  const name = <div style={{ fontFamily: heading, color: palette.contrast }} className="text-[15px] leading-tight font-bold">Your Name</div>;
  const button = (
    <span className="inline-block px-2 py-1 text-[8px] font-semibold" style={{ background: palette.primary, color: palette.base, borderRadius: radius }}>
      View my work
    </span>
  );
  const tag = <div style={{ fontFamily: body, color: palette.contrast, opacity: 0.75 }} className="text-[8px]">Student & WordPress Contributor</div>;
  const photo = (cls: string, src = img('avatar.webp')) => <img src={src} alt="" className={`object-cover ${cls}`} style={{ borderRadius: radius }} />;

  let hero: ReactNode;
  const hero0 = p.pages.home[0]?.variant;
  if (hero0 === 'avatar') {
    hero = (
      <div className="flex flex-col items-center gap-1.5 py-2 text-center">
        <img src={img('avatar.webp')} alt="" className="h-9 w-9 rounded-full object-cover" />
        {name}
        {tag}
        {button}
      </div>
    );
  } else if (hero0 === 'band') {
    hero = (
      <div className="-mx-3 flex flex-col items-center gap-1.5 px-3 py-4 text-center" style={{ background: palette.secondary }}>
        <div style={{ fontFamily: heading, color: palette.base }} className="text-[15px] leading-tight font-bold">
          Your Name
        </div>
        <div style={{ fontFamily: body, color: palette.base, opacity: 0.8 }} className="text-[8px]">
          Student &amp; WordPress Contributor
        </div>
        {button}
      </div>
    );
  } else if (hero0 === 'centered') {
    hero = (
      <div className="flex flex-col items-center gap-1.5 py-4 text-center">
        {name}
        {tag}
        {button}
      </div>
    );
  } else if (hero0 === 'profile') {
    hero = (
      <div className="flex items-center gap-3 py-1">
        {photo('h-20 w-16')}
        <div className="space-y-1">
          {name}
          {tag}
          <div className="h-1 w-24 rounded" style={{ background: palette.accent }} />
          <div className="h-1 w-20 rounded" style={{ background: palette.accent }} />
          {button}
        </div>
      </div>
    );
  } else {
    hero = (
      <div className="flex items-center gap-3 py-1">
        <div className="flex-1 space-y-1.5">
          {hero0 === 'big' && <div style={{ color: palette.contrast }} className="text-[7px]">Hello, I'm</div>}
          {name}
          {tag}
          {button}
        </div>
        {photo(hero0 === 'big' ? 'h-20 w-16' : 'h-16 w-16')}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 shadow-sm" style={{ background: palette.base }} aria-hidden>
      <div className="flex items-center gap-1 border-b px-2 py-1" style={{ borderColor: `${palette.contrast}22` }}>
        {['#ff5f57', '#febc2e', '#28c840'].map((c) => (
          <span key={c} className="h-1.5 w-1.5 rounded-full" style={{ background: c }} />
        ))}
      </div>
      <div className="space-y-2 p-3">
        <div className={`flex items-center text-[7px] ${p.header === 'centered' ? 'flex-col gap-0.5' : 'justify-between'}`} style={{ color: palette.contrast, fontFamily: body }}>
          <span className="font-bold">Your Name</span>
          <span className="opacity-70">About · Blog · Contact</span>
        </div>
        {hero}
        <div className="grid grid-cols-3 gap-1.5 rounded p-1.5" style={{ background: palette.accent }}>
          {['project-1.webp', 'project-2.webp', 'project-3.webp'].map((f) => (
            <img key={f} src={img(f)} alt="" className="aspect-[3/2] w-full object-cover" style={{ borderRadius: radius }} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------- Page ---------- */

