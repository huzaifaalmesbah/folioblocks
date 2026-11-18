# FolioBlocks HTML templates (2026)

Static HTML designs for portfolio websites. Each one is a single `.html` file
that opens straight in a browser (no build step). They are drafts to be turned
into FolioBlocks block-theme layouts later.

Open `index.html` to see all of them.

## Who they are for

Students and people with jobs: a CV and portfolio in one place, showing past
work, projects, skills and how to get in touch. Each design leans towards one
track (developer, designer, or any job).

| File | Style | Track | Sample person |
|---|---|---|---|
| `profile.html` | Profile card + feed, like a social profile | Developer, job holder | Full-stack developer, 3 years at work |
| `terminal.html` | Command-line terminal, type commands | Developer, student | CSE student, open source contributor |
| `bento.html` | Bento grid of tiles | Developer, student / junior | Frontend developer, final year |
| `resume.html` | One-page CV that prints to A4 / PDF | Any track, job holder | Project / operations professional |
| `editorial.html` | Big serif type, case studies | Designer | Product (UI/UX) designer |
| `aurora.html` | Dark, soft gradients, glass cards | Student / fresh graduate | New graduate looking for a first job |
| `brutal.html` | Neo-brutalist, thick borders, bold colour | Designer, student | Graphic / brand design student |
| `journey.html` | Career story told as a timeline | Job holder, career change | Engineer moving to a new role |

## Rules every template follows (so block conversion is easy)

1. **Sections match FolioBlocks section types**: `hero`, `about`, `skills`,
   `experience`, `education`, `projects`, `contributions`, `achievements`,
   `services`, `testimonials`, `posts`, `contact`. Each one is a
   `<section data-section="type">` so it maps to one pattern.
2. **Colours and fonts are CSS variables named like `theme.json` presets**:
   `--wp--preset--color--base | contrast | primary | secondary | accent`, and
   `--wp--preset--font-family--heading | body`. Changing those five colours and
   two fonts re-skins the page.
3. **Layout uses things blocks can make**: groups, rows, stacks, columns, grids,
   cover, image, buttons, separator, details. Fancy extras (typing effect,
   terminal input, scroll effects) are small progressive-enhancement scripts;
   the page reads fine without JavaScript.
4. **Local assets only**: fonts from `assets/fonts/`, images from
   `assets/images/` (the same files the builder bundles). No CDN.
5. **Works on phones** (from 360px), keyboard focus is visible, colours pass
   contrast, and `prefers-reduced-motion` turns animation off.
6. All names, companies and links are made up.
