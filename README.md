# FolioBlocks

**Build your WordPress portfolio theme, no code needed.**

FolioBlocks is a browser-only theme builder for students in the WordPress Credits and WP Campus Connect programs. A student fills in their info and picks colours, and FolioBlocks generates a valid WordPress **block theme** that they download as a `.zip` and install with **Appearance → Themes → Add New Theme → Upload Theme**.

Nothing is sent to a server. Everything stays in the browser.

## Status

| Week | Scope | Status |
|---|---|---|
| 1 | Project setup, BuilderState, theme generator core, zip download | ✅ done |
| 2 | Section library + 4 layout presets, Info and Style wizard steps | ⏳ next |
| 3 | Live WordPress Playground preview, seed content, device toggle | |
| 4 | Drag-and-drop layout customizer, custom presets, JSON import/export | |
| 5 | Tests, accessibility, docs, GitHub Pages deploy, beta with students | |

## Development

```bash
npm install
npm run dev       # start the app
npm test          # generator unit tests
npm run build     # type-check + production build
npm run lint
```

### Try a generated theme in real WordPress

```bash
npm run try
```

This exports a sample theme (from `scripts/sample-state.json`) to `out/` and opens it in a local [WordPress Playground](https://wordpress.github.io/wordpress-playground/) with Home, About, Blog and Contact pages already set up. It only needs Node, not wp-env or Docker.

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
      └──► preview       WordPress Playground (week 3)
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
| `src/zip/` | Zip builder and canvas-rendered `screenshot.png` |

### Adding a section variant

1. Write a renderer in `src/generator/sections.ts` that returns block markup built with the helpers in `blocks.ts`.
2. Register it in `SECTIONS`.
3. Run `npm test`. The tests check that every variant produces balanced block markup with valid attributes.

## Generated theme rules

- Core blocks only: no plugins, no custom JS, no external requests
- `theme.json` version 3, GPLv2-or-later, every string escaped and translatable
- The theme folder sits at the root of the zip, so "Upload Theme" works the first time

## License

GPL-2.0-or-later
