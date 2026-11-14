# FolioBlocks

**Build your WordPress portfolio theme, no code needed.**

**Live:** https://huzaifaalmesbah.github.io/folioblocks/

FolioBlocks is a browser-only theme builder for students in the WordPress Credits and WP Campus Connect programs. A student fills in their info and picks colours, and FolioBlocks generates a valid WordPress **block theme** that they download as a `.zip` and install with **Appearance → Themes → Add New Theme → Upload Theme**.

Nothing is sent to a server. Everything stays in the browser.

## Status

| Week | Scope | Status |
|---|---|---|
| 1 | Project setup, BuilderState, theme generator core, zip download | ✅ done |
| 2 | Section library + 4 layout presets, Info / Style / Layout wizard, bundled fonts | ✅ done |
| 2.5 | "Open in WordPress Playground" button (theme embedded in a Blueprint) | ✅ done |
| 3 | Quick preview that updates as you type (any browser), Open in WordPress Playground | ✅ done |
| 3.5 | Photos (profile, projects), featured images, four distinct designs | ✅ done |
| 4 | Drag-and-drop layout customizer, custom presets, JSON import/export | ⏳ next |
| 5 | Tests, accessibility, docs, GitHub Pages deploy, beta with students | |

## Development

```bash
npm install
npm run dev       # start the app
npm test          # generator unit tests
npm run validate  # check every preset's theme with Ipsum's validator
npm run build     # type-check + production build
npm run lint
```

### Try a generated theme in real WordPress

```bash
npm run try
```

This exports a sample theme (from `scripts/sample-state.json`) to `out/` and opens it in a local [WordPress Playground](https://wordpress.github.io/wordpress-playground/) with Home, About, Blog and Contact pages already set up. It only needs Node, not wp-env or Docker.

To print a playground.wordpress.net link that installs the sample theme (no local WordPress at all):

```bash
npm run link -- scripts/sample-state.json
```

To export a theme folder without starting WordPress:

```bash
npm run export -- out scripts/sample-state.json
```

## How it works

```
BuilderState (one JSON object: info, style, preset, pages)
      │
      ▼
src/generator/   pure functions → { "style.css": "...", "theme.json": "...", ... }
      │
      ├──► src/zip/      JSZip → <slug>.zip (theme folder at the zip root) + screenshot.png
      ├──► src/preview/     Quick preview: block markup rendered in the browser, theme.json turned into CSS
      └──► src/playground/  Blueprint for "Open in WordPress Playground"
```

| Path | What it does |
|---|---|
| `src/types.ts` | `BuilderState` and related types |
| `src/store.ts` | Zustand store, autosaved to localStorage |
| `src/generator/blocks.ts` | Helpers that print core block markup exactly as the editor serializes it |
| `src/generator/sections.ts` | Section variants (hero, about, skills, contributions, projects, posts, contact) |
| `src/generator/patterns.ts` | PHP pattern files. All student text goes through `esc_html__()` / `esc_url()` |
| `src/generator/templates.ts` | Block templates: index, home, front-page, single, page, about, contact, archive, search, 404 |
| `src/generator/themeJson.ts` | `theme.json` v3: palette, fluid type, layout, custom templates |
| `src/presets.ts` | Colour palettes and the 4 layout presets (Minimal, Creative, Developer, Academic) |
| `src/fonts.ts` | Font registry: system stacks plus OFL fonts bundled into the theme |
| `src/ui/` | Wizard steps: Info, Style, Layout |
| `src/zip/` | Zip builder, bundled asset fetching and canvas-rendered `screenshot.png` |
| `src/playground/` | Blueprint builder for "Open in WordPress Playground" |

### Previews

- **Preview** (default) renders the generated block markup in the browser: it evaluates the few PHP calls our patterns use, parses the blocks with `@wordpress/block-serialization-default-parser`, fills dynamic blocks (site title, navigation, query loops, post fields) with sample content, and turns `theme.json` into CSS on top of WordPress' block-library styles. It works in every browser and updates as you type; links inside it (menu, post titles) switch pages. It is a close approximation, not WordPress.
- **Open in WordPress Playground** opens the real site in a new tab. (An embedded Playground was tried and dropped: some browsers won't start Playground inside an iframe.)

### Images

Students can add a profile photo and a picture per project. They are resized to WebP in the browser (`src/images.ts`) and shipped in the theme's `assets/images/`, referenced with `get_parent_theme_file_uri()` and translated alt text, as Ipsum does. Without a photo, the theme uses a placeholder: CC0 photos from Openverse, and a drawn silhouette for the avatar (see Image credits). Only images the chosen layout uses are shipped. Sample posts get placeholder featured images in Playground and the preview.

### Image credits

The sample photos in `public/images/` come from [Openverse](https://openverse.org) and are all CC0 or public domain, so they can ship in GPL themes. `scripts/fetch-openverse.py` downloads them, checks each licence with the Openverse API, crops them and writes `src/generator/imageCredits.json`; generated themes credit every one they ship under `== Images ==` in `readme.txt`. The avatar placeholder is our own drawing (`scripts/make-placeholders.py`, CC0).

| File | Photo | Licence |
|---|---|---|
| `project-1.webp` | [Office Work](https://stocksnap.io/photo/office-work-8P6GFHP0LU) by Negative Space ([Openverse](https://openverse.org/image/4754c62f-38ec-42c9-870d-2f1b22d2930c)) | CC0 1.0 Universal |
| `project-2.webp` | [Programming Code](https://stocksnap.io/photo/programming-code-1STVFMTBJY) by One Idea LLC ([Openverse](https://openverse.org/image/f4a0cabe-4e2d-4018-8700-9bd267beaa73)) | CC0 1.0 Universal |
| `project-3.webp` | [Office Work](https://stocksnap.io/photo/office-work-Q6PIRY9O7M) by Nao Triponez ([Openverse](https://openverse.org/image/71963d42-1ca9-4229-81c1-f7ef13e9a6b6)) | CC0 1.0 Universal |
| `post-1.webp` | [Laptop Mac](https://stocksnap.io/photo/laptop-mac-OR7D4PANCK) by Matthew Henry ([Openverse](https://openverse.org/image/b90b48bd-5f3a-4adb-a018-45afa6c4db8b)) | CC0 1.0 Universal |
| `post-2.webp` | [Journal Notepad](https://stocksnap.io/photo/journal-notepad-DPKNIIN5X3) by Cathryn Lavery ([Openverse](https://openverse.org/image/6d55483a-ac31-4291-bf17-5e4d52b6e34c)) | CC0 1.0 Universal |
| `post-3.webp` | [Computer Office](https://stocksnap.io/photo/computer-office-XGXORJWZIX) by Lukas ([Openverse](https://openverse.org/image/6231a349-7ccd-4c98-bbca-13adc7562f0c)) | CC0 1.0 Universal |

### Fonts

Bundled fonts are OFL variable fonts from [Fontsource](https://fontsource.org), copied into `public/fonts/` with `npm run fonts`. The theme ships them in `assets/fonts/` and registers them with `fontFace` in `theme.json`, so it never loads fonts from a CDN. In Playground they are downloaded from the published FolioBlocks site (`src/config.ts`).

### Adding a section variant

1. Write a renderer in `src/generator/sections.ts` that returns block markup built with the helpers in `blocks.ts`.
2. Register it in `SECTIONS`.
3. Run `npm test`. The tests check that every variant produces balanced block markup with valid attributes.

## Generated theme rules

Generated themes follow the conventions of [Ipsum](https://github.com/WordPress/ipsum), WordPress' default theme in the making (see its AGENTS.md and DESIGN.md):

- **The pattern is the source of truth.** Every `templates/*.html` and `parts/*.html` is a one-line delegate to a pattern. Template patterns are `hidden-*`, with `Inserter: no` and `Template Types`, so every string in a template is translatable.
- **Pattern headers:** every pattern has a Title and a Description. Full page layouts take the `page-` prefix with `Post Types: page` and `Block Types: core/post-content`; header and footer patterns take `Block Types: core/template-part/<area>`.
- **Block names** (`metadata.name`) are set and translated, so the List View shows what each block is.
- **theme.json** points `$schema` at trunk, uses Twenty Twenty-Five's colour slugs (`base`, `contrast`, `accent-1`, `accent-3`, `accent-5`, `accent-6`), Ipsum's spacing scale, and `settings.custom.controlScheme`.
- **Colour style variations** in `styles/colors/`, one per other FolioBlocks palette.
- **Fonts** live in one folder per family and are credited under `== Fonts ==` in `readme.txt`.
- No editor leftovers (`queryId`, `theme`, `area`, `patternName`), and block markup in the serializer's format.
- Core blocks only: no plugins, no custom JS, no external requests. GPLv2 or later.
- The theme folder sits at the root of the zip, so "Upload Theme" works the first time.

`npm run validate` exports a theme for every preset and checks it with Ipsum's own validator (`scripts/validate-theme.mjs`, adapted): theme.json and variations against the schema for "Requires at least", pattern headers, block markup, editor leftovers and untranslated text. CI runs it before every deploy.

## License

GPL-2.0-or-later
