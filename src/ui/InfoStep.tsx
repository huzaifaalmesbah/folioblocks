import { useState, type ReactNode } from 'react';
import { tr } from '../i18n/ui';
import { IMAGE_LIMITS, resizeImage } from '../images';
import { profileCompleteness } from '../profile';
import { storageStatus, useBuilder } from '../store';
import type { Socials } from '../types';
import { bioPrompt, FILL_PROMPT, projectPrompt, taglinePrompt } from '../ai/prompts';
import { parseProfile } from '../layout';
import { CopyButton, Field, ImageField, inputCls, Repeater } from './fields';

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

/**
 * Fill the whole form from a CV with any AI chat: copy our prompt, paste it
 * with the CV into the chat, paste the answer back. Nothing is sent anywhere
 * by FolioBlocks itself.
 */
function FillWithAi() {
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  function fill() {
    setError('');
    setDone(false);
    try {
      const { info, setInfo } = useBuilder.getState();
      const next = parseProfile(answer, info);
      if (!confirm(tr('Fill your profile as "{name}"? This replaces the text you have now. Your photos stay.', { name: next.name }))) return;
      setInfo(next);
      setAnswer('');
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <details className="group rounded-xl border border-blue-200 bg-blue-50/60 open:pb-4">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3">
        <span className="flex-1">
          <span className="block text-sm font-semibold text-slate-900">✨ Fill with AI</span>
          <span className="block text-xs text-slate-600">Have a CV or LinkedIn? Let an AI chat fill this form for you.</span>
        </span>
        <span aria-hidden className="text-slate-400 transition group-open:rotate-90">›</span>
      </summary>
      <ol className="list-decimal space-y-3 px-4 pl-9 text-sm text-slate-700">
        <li>
          <CopyButton
            text={FILL_PROMPT}
            className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700"
          >
            Copy the prompt
          </CopyButton>
        </li>
        <li>Paste it into any AI chat (Claude, ChatGPT, Gemini…), then paste your CV or notes under it and send.</li>
        <li>
          <label className="block">
            Paste the AI's answer here:
            <textarea
              className={`${inputCls} font-mono text-xs`}
              rows={4}
              placeholder='{ "name": "…", "tagline": "…" }'
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
            />
          </label>
          <button
            type="button"
            disabled={!answer.trim()}
            onClick={fill}
            className="mt-2 rounded-md bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-800 disabled:opacity-50"
          >
            Fill my profile
          </button>
        </li>
      </ol>
      {error && (
        <p role="alert" className="mt-2 px-4 text-xs text-red-700">
          {error}
        </p>
      )}
      {done && (
        <p role="status" className="mt-2 px-4 text-xs text-green-700">
          Done. Read it through and fix anything the AI got wrong.
        </p>
      )}
      <p className="mt-3 px-4 text-xs text-slate-500">
        Your CV goes only to the AI chat you choose, not to FolioBlocks. Leave out anything private, such as your phone number or address.
      </p>
    </details>
  );
}

export function InfoStep() {
  const info = useBuilder((s) => s.info);
  const setInfo = useBuilder((s) => s.setInfo);

  return (
    <div className="space-y-4">
      <Meter />
      <FillWithAi />

      <Tier title="The basics" note="Five things, about two minutes. Enough for a finished site." open>
        <Field label="Full name" value={info.name} onChange={(name) => setInfo({ name })} />
        <Field
          label="Tagline"
          placeholder="CSE Student & WordPress Contributor"
          value={info.tagline}
          onChange={(tagline) => setInfo({ tagline })}
        />
        <CopyButton text={() => taglinePrompt(useBuilder.getState().info)}>✨ Copy a prompt to write taglines with AI</CopyButton>
        <Field
          label="Short bio"
          textarea
          placeholder="Who you are, what you study, and what you like to build. Two or three lines."
          value={info.bio}
          onChange={(bio) => setInfo({ bio })}
        />
        <CopyButton text={() => bioPrompt(useBuilder.getState().info)}>✨ Copy a prompt to write your bio with AI</CopyButton>
        <ImageField
          label="Profile photo"
          value={info.avatar}
          hint="A clear photo of you. Resized and kept in your browser. Use a photo you have the right to use."
          onPick={async (f) => setInfo({ avatar: await resizeImage(f, IMAGE_LIMITS.avatar.maxWidth, IMAGE_LIMITS.avatar.maxHeight) })}
          onRemove={() => setInfo({ avatar: '' })}
        />
        {storageStatus.full && (
          <p role="alert" className="text-xs text-red-700">
            Your browser is out of space to save the draft: remove a photo or use smaller ones.
          </p>
        )}
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
            <CopyButton text={() => projectPrompt(item)}>✨ Copy a prompt to describe this project with AI</CopyButton>
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
