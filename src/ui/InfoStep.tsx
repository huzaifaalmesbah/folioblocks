import { useBuilder } from '../store';
import type { Socials } from '../types';
import { Field, Repeater, SectionTitle } from './fields';

const SOCIAL_FIELDS: { key: keyof Socials; label: string; placeholder: string }[] = [
  { key: 'github', label: 'GitHub', placeholder: 'https://github.com/username' },
  { key: 'wordpress', label: 'WordPress.org profile', placeholder: 'https://profiles.wordpress.org/username' },
  { key: 'linkedin', label: 'LinkedIn', placeholder: 'https://www.linkedin.com/in/username' },
  { key: 'x', label: 'X (Twitter)', placeholder: 'https://x.com/username' },
];

export function InfoStep() {
  const info = useBuilder((s) => s.info);
  const setInfo = useBuilder((s) => s.setInfo);

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <SectionTitle>About you</SectionTitle>
        <Field label="Full name" value={info.name} onChange={(name) => setInfo({ name })} />
        <Field label="Tagline" value={info.tagline} onChange={(tagline) => setInfo({ tagline })} />
        <Field label="University / department" value={info.university} onChange={(university) => setInfo({ university })} />
        <Field label="Location" value={info.location} onChange={(location) => setInfo({ location })} />
        <Field label="Short bio" textarea value={info.bio} onChange={(bio) => setInfo({ bio })} />
        <Field
          label="Skills"
          hint="Separate with commas"
          value={info.skills.join(', ')}
          onChange={(v) => setInfo({ skills: v.split(',').map((s) => s.trim()).filter(Boolean) })}
        />
      </section>

      <section className="space-y-3">
        <SectionTitle>WordPress journey</SectionTitle>
        <Repeater
          label="Contributions"
          items={info.contributions}
          empty={{ team: '', description: '' }}
          addLabel="Add a contribution"
          fields={[
            { key: 'team', label: 'Team or event', placeholder: 'Polyglots, Test, WordCamp Dhaka…' },
            { key: 'description', label: 'What you did', textarea: true },
          ]}
          onChange={(contributions) => setInfo({ contributions })}
        />
      </section>

      <section className="space-y-3">
        <SectionTitle>Projects</SectionTitle>
        <Repeater
          label="Projects"
          items={info.projects}
          empty={{ title: '', description: '', url: '' }}
          addLabel="Add a project"
          fields={[
            { key: 'title', label: 'Title' },
            { key: 'description', label: 'One-line description', textarea: true },
            { key: 'url', label: 'Link (optional)', placeholder: 'https://' },
          ]}
          onChange={(projects) => setInfo({ projects })}
        />
      </section>

      <section className="space-y-3">
        <SectionTitle>Contact</SectionTitle>
        <Field label="Email" type="email" value={info.email} onChange={(email) => setInfo({ email })} />
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
      </section>
    </div>
  );
}
