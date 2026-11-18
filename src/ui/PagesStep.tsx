import { useBuilder } from '../store';
import type { FooterVariant, HeaderVariant, PageKey } from '../types';
import { SectionTitle, Select } from './fields';
import { SectionList } from './SectionList';

const PAGE_LABELS: Record<PageKey, string> = { home: 'Home page', about: 'About page', contact: 'Contact page' };

/** Step 4: the header and footer, and the sections of each page. */
export function PagesStep() {
  const header = useBuilder((s) => s.header);
  const footer = useBuilder((s) => s.footer);
  const { setHeader, setFooter } = useBuilder.getState();

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <SectionTitle>Header & footer</SectionTitle>
        <Select<HeaderVariant>
          label="Header"
          value={header}
          options={[
            { value: 'inline', label: 'Name left, menu right' },
            { value: 'centered', label: 'Centered' },
          ]}
          onChange={setHeader}
        />
        <Select<FooterVariant>
          label="Footer"
          value={footer}
          options={[
            { value: 'centered', label: 'Centered' },
            { value: 'split', label: 'Copyright left, social icons right' },
          ]}
          onChange={setFooter}
        />
      </section>

      {(Object.keys(PAGE_LABELS) as PageKey[]).map((page) => (
        <section key={page} className="space-y-3">
          <SectionTitle>{PAGE_LABELS[page]}</SectionTitle>
          <SectionList page={page} />
        </section>
      ))}
    </div>
  );
}
