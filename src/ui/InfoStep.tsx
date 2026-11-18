import type { ReactNode } from 'react';
import { tr } from '../i18n/ui';
import { IMAGE_LIMITS, resizeImage } from '../images';
import { profileCompleteness } from '../profile';
import { useBuilder } from '../store';
import type { Socials } from '../types';
import { Field, ImageField, Repeater } from './fields';

const SOCIAL_FIELDS: { key: keyof Socials; label: string; placeholder: string }[] = [
  { key: 'github', label: 'GitHub', placeholder: 'https://github.com/username' },
  { key: 'wordpress', label: 'WordPress.org profile', placeholder: 'https://profiles.wordpress.org/username' },
  { key: 'linkedin', label: 'LinkedIn', placeholder: 'https://www.linkedin.com/in/username' },
  { key: 'x', label: 'X (Twitter)', placeholder: 'https://x.com/username' },
];

/** One tier of the form: the basics stay open, the rest fold away. */
function Tier(props: { title: string; note: string; open?: boolean; children: ReactNode }) {
  return (
    <details open={props.open} className="group rounded-xl border border-slate-200 open:pb-4">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3">
        <span className="flex-1">
          <span className="block text-sm font-semibold text-slate-900">{props.title}</span>
          <span className="block text-xs text-slate-500">{props.note}</span>
        </span>
        <span aria-hidden className="text-slate-400 transition group-open:rotate-90">›</span>
      </summary>
      <div className="space-y-5 px-4">{props.children}</div>
    </details>
  );
}

function Meter() {
  const info = useBuilder((s) => s.info);
  const { percent, next } = profileCompleteness(info);
  return (
    <div className="rounded-xl bg-slate-50 p-4">
      <div className="flex items-baseline justify-between text-sm">
        <span className="font-semibold text-slate-900">Your profile</span>
        <span className="text-slate-600">{percent}% complete</span>
      </div>
      <div
        className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200"
        role="progressbar"
        aria-label="Profile completeness"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className={`h-full rounded-full ${percent === 100 ? 'bg-green-600' : 'bg-blue-600'}`} style={{ width: `${percent}%` }} />
      </div>
      <p className="mt-2 text-xs text-slate-600">
        {next.length ? <>Next: {next.slice(0, 2).map((n) => tr(n)).join(' · ')}</> : 'Everything a strong portfolio needs is here.'}
      </p>
    </div>
  );
}

export function InfoStep() {
  const info = useBuilder((s) => s.info);
  const setInfo = useBuilder((s) => s.setInfo);

  return (
    <div className="space-y-4">
      <Meter />

      <Tier title="The basics" note="Five things, about two minutes. Enough for a finished site." open>
        <Field label="Full name" value={info.name} onChange={(name) => setInfo({ name })} />
        <Field
          label="Tagline"
          placeholder="CSE Student & WordPress Contributor"
          value={info.tagline}
          onChange={(tagline) => setInfo({ tagline })}
        />
        <Field
          label="Short bio"
          textarea
          placeholder="Who you are, what you study, and what you like to build. Two or three lines."
          value={info.bio}
          onChange={(bio) => setInfo({ bio })}
        />
        <ImageField
          label="Profile photo"
          value={info.avatar}
          hint="A clear photo of you. Resized and kept in your browser. Use a photo you have the right to use."
          onPick={async (f) => setInfo({ avatar: await resizeImage(f, IMAGE_LIMITS.avatar.maxWidth, IMAGE_LIMITS.avatar.maxHeight) })}
          onRemove={() => setInfo({ avatar: '' })}
        />
        <Field label="Email" type="email" placeholder="you@example.com" value={info.email} onChange={(email) => setInfo({ email })} />
      </Tier>

      <Tier title="Recommended" note="Skills, projects, education and links make it convincing.">
        <Field
          label="Skills"
          hint="Separate with commas"
          placeholder="PHP, JavaScript, Gutenberg"
          value={info.skills.join(', ')}
          onChange={(v) => setInfo({ skills: v.split(',').map((s) => s.trim()).filter(Boolean) })}
        />
        <Repeater
          label="Projects"
          items={info.projects}
          empty={{ title: '', description: '', url: '' }}
          addLabel="Add a project"
          fields={[
            { key: 'title', label: 'Title', placeholder: 'Campus Events plugin' },
            { key: 'description', label: 'One-line description', textarea: true, placeholder: 'What it does and what you built.' },
            { key: 'url', label: 'Link (optional)', placeholder: 'https://' },
          ]}
          renderExtra={(item, i) => (
            <>
            <ImageField
              label="Image"
              aspect="wide"
              value={item.image}
              hint="A screenshot or photo of the project."
              onPick={async (f) => {
                const image = await resizeImage(f, IMAGE_LIMITS.project.maxWidth, IMAGE_LIMITS.project.maxHeight);
                setInfo({ projects: info.projects.map((p, j) => (j === i ? { ...p, image } : p)) });
              }}
              onRemove={() => setInfo({ projects: info.projects.map((p, j) => (j === i ? { ...p, image: '' } : p)) })}
            />
            </>
          )}
          onChange={(projects) => setInfo({ projects })}
        />
        <Repeater
          label="Education"
          items={info.education}
          empty={{ degree: '', school: '', period: '' }}
          addLabel="Add education"
          fields={[
            { key: 'degree', label: 'Degree or course', placeholder: 'BSc in Computer Science' },
            { key: 'school', label: 'Institution', placeholder: 'University of Dhaka' },
            { key: 'period', label: 'Years', placeholder: '2023 – 2027' },
          ]}
          onChange={(education) => setInfo({ education })}
        />
        <Field label="University / department" hint="Shown under your name in some designs." value={info.university} onChange={(university) => setInfo({ university })} />
        <Field label="Location" placeholder="Dhaka, Bangladesh" value={info.location} onChange={(location) => setInfo({ location })} />
        <fieldset className="space-y-3">
          <legend className="text-sm font-medium text-slate-700">Social links</legend>
          {SOCIAL_FIELDS.map((f) => (
            <Field
              key={f.key}
              label={f.label}
              type="url"
              placeholder={f.placeholder}
              value={info.socials[f.key] ?? ''}
              onChange={(v) => setInfo({ socials: { ...info.socials, [f.key]: v } })}
            />
          ))}
        </fieldset>
      </Tier>

      <Tier title="Optional" note="Add what you have. Empty parts are left out of your site.">
        <Repeater
          label="WordPress contributions"
          items={info.contributions}
          empty={{ team: '', description: '', date: '', url: '' }}
          addLabel="Add a contribution"
          fields={[
            { key: 'team', label: 'Team or event', placeholder: 'Polyglots, Test, WordCamp Dhaka…' },
            { key: 'description', label: 'What you did', textarea: true, placeholder: 'Translated 200 strings into Bengali.' },
            { key: 'date', label: 'When (optional)', placeholder: '2026' },
            { key: 'url', label: 'Link (optional)', placeholder: 'https://' },
          ]}
          onChange={(contributions) => setInfo({ contributions })}
        />
        <Repeater
          label="Experience"
          items={info.experience}
          empty={{ role: '', org: '', period: '', description: '' }}
          addLabel="Add experience"
          fields={[
            { key: 'role', label: 'Role', placeholder: 'Intern, volunteer, club lead…' },
            { key: 'org', label: 'Organisation', placeholder: 'Company, club or community' },
            { key: 'period', label: 'When', placeholder: 'Jan 2026 – now' },
            { key: 'description', label: 'What you did', textarea: true },
          ]}
          onChange={(experience) => setInfo({ experience })}
        />
        <Repeater
          label="Achievements and certificates"
          items={info.achievements}
          empty={{ title: '', issuer: '', year: '', url: '' }}
          addLabel="Add an achievement"
          fields={[
            { key: 'title', label: 'Title', placeholder: 'Hackathon winner, course certificate…' },
            { key: 'issuer', label: 'From', placeholder: 'Who gave it' },
            { key: 'year', label: 'Year', placeholder: '2026' },
            { key: 'url', label: 'Link (optional)', placeholder: 'https://' },
          ]}
          onChange={(achievements) => setInfo({ achievements })}
        />
        <Repeater
          label="Services (for freelancers)"
          items={info.services}
          empty={{ title: '', description: '' }}
          addLabel="Add a service"
          fields={[
            { key: 'title', label: 'Service', placeholder: 'WordPress theme setup' },
            { key: 'description', label: 'What it includes', textarea: true },
          ]}
          onChange={(services) => setInfo({ services })}
        />
        <Repeater
          label="Testimonials"
          items={info.testimonials}
          empty={{ quote: '', name: '', role: '' }}
          addLabel="Add a testimonial"
          fields={[
            { key: 'quote', label: 'What they said', textarea: true, placeholder: 'Only real words, used with their permission.' },
            { key: 'name', label: 'Their name' },
            { key: 'role', label: 'Their role', placeholder: 'Teacher, client, team lead…' },
          ]}
          onChange={(testimonials) => setInfo({ testimonials })}
        />
        <Field
          label="CV link"
          type="url"
          hint="A link to your CV (PDF, Google Doc…). Adds a “Download CV” button."
          placeholder="https://"
          value={info.cvUrl}
          onChange={(cvUrl) => setInfo({ cvUrl })}
        />
      </Tier>
    </div>
  );
}
