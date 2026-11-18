---
name: folioblocks
description: "Use when someone wants a personal portfolio website or WordPress portfolio theme (students, job seekers, developers, designers): interview them with short questions, then build a valid WordPress block theme with the FolioBlocks command line from their answers. Never write the theme by hand."
compatibility: "Needs Node.js 20+ and npx. Builds a WordPress 6.8+ block theme (core blocks only). Preview needs no WordPress install (Playground CLI)."
---

# FolioBlocks: a portfolio theme from a conversation

The person answers questions; you turn the answers into a project file and let the FolioBlocks command line build the theme. The command line uses the same generator as the FolioBlocks website and checks its output, so the theme is always valid. **Do not write or edit theme files (theme.json, templates, patterns) yourself.** Everything goes through `folioblocks.json`.

## When to use

- "Make my portfolio", "build my WordPress theme", "I need a CV website", "make a site for my projects".
- Changing a portfolio made this way: "make it blue", "add a project", "use a different design".

Not for: changing an existing theme that FolioBlocks didn't make (use `wp-block-themes`), or building a whole custom theme from scratch.

## The command line

Run it with npx, no install needed (the first run takes a few seconds):

```bash
npx -y github:huzaifaalmesbah/folioblocks <command>
```

Below, `folioblocks` means that whole command.

| Command | What it does |
|---|---|
| `folioblocks templates` | Templates (key, name, who they suit, a preview link each), sections, palettes, font pairs, section styles and site languages, as JSON |
| `folioblocks init --template <key>` | Creates `folioblocks.json` from a template, with an empty profile |
| `folioblocks template <key>` | Switches the template; the info stays |
| `folioblocks check` | Lists what a visitor would notice: `FIX` lines must be fixed, `TIP` lines are suggestions. Exit code 2 if there is a FIX |
| `folioblocks build` | Writes `theme/<slug>/` and `theme/<slug>.zip`, and prints the check |
| `folioblocks link` | Opens the FolioBlocks website builder with this project loaded (photos not included): prints the link and writes `theme/open-in-builder.html` |
| `folioblocks preview` | Runs the site in a local WordPress (WordPress Playground) with pages and sample posts, and prints its address. `--url` instead writes `theme/open-preview.html`, which opens it on playground.wordpress.net (never paste that link: it is huge) |

## Procedure

Work in an empty folder: if the current one has other files, create `my-portfolio/` and run every command there.

### 1. Say hello and set expectations

One short message: you'll ask a few questions in small groups, about ten minutes in all, they can say "skip" to anything, and nothing is made up. In the same message ask:

- which language to **talk** in (use it for every question), and
- which language the **site** should be in. Their answers go onto the site exactly as they give them, so ask for (or offer to translate into) the site's language. The theme's own words (menu, "About me", buttons) are in one of the `languages` that `folioblocks templates` lists, English otherwise; set `state.language` to it. If the site is in a script that needs its own font (e.g. Bengali), set both `state.style.fonts.heading` and `.body` to the matching `scriptFonts` value.

If they have a CV, LinkedIn text or an old website, ask them to share it first: read it, fill in what you can, then **show a short summary and ask them to confirm or correct it** instead of asking those questions again.

### 2. Interview

Follow [references/questions.md](references/questions.md): the basics, then the template, then what makes the site convincing, then optional extras. Rules:

- **At most three questions per message**, about one topic. Wait for the answer.
- **Never invent** facts: no made-up projects, numbers, dates, employers, quotes or links. If something is missing, leave it empty; the theme leaves empty sections out.
- You may **suggest wording** (a tagline, a bio) from what they told you, but show it and ask before using it.
- Accept "skip", "later" and "I don't know" without pushing.
- Before the template question, run `folioblocks templates` and suggest **three** templates whose `tracks` match them, each with one line and its own `preview` link. Then run `folioblocks init --template <their choice>`.
- Repeat back links, emails and numbers before you save them.

### 3. Write the answers into the project file

Edit `state.info` in `folioblocks.json` (format: [references/project-file.md](references/project-file.md)). Photos: put the file path (relative to `folioblocks.json`), e.g. `"avatar": "photo.jpg"`; `.jpg`, `.png` or `.webp`, under 2 MB. Leave design fields alone unless they ask.

### 4. Check, then build

1. Run `folioblocks check`. For each `FIX`, ask them the one question that fixes it (don't fix it by guessing). `TIP` lines: mention the useful ones once.
2. Run `folioblocks build`. Tell them where the zip is.

### 5. Let them see it

Offer, in this order:

1. `folioblocks preview`: their real site in a local WordPress, with Home, About, Blog and Contact. Give them the address it prints. Stop it with Ctrl+C when they are done. If it can't run, `folioblocks preview --url` and tell them to double-click `theme/open-preview.html`.
2. `folioblocks link`: opens the FolioBlocks website builder with everything filled in, to look around, change things by hand, add photos and download. Give them the link, or `theme/open-in-builder.html` to double-click. Photos must be added again there.

### 6. Change things they ask for

Edit `folioblocks.json`, run `folioblocks build` again, and say what changed. Common requests:

- Another design: `folioblocks template <key>` (info stays).
- Colours: copy the closest palette from `folioblocks templates` into `state.style.palette`. Say which one you chose and name one or two alternatives (e.g. for "green": Forest, Sage, Shapla; Night Green is dark). Keep text readable: the check warns otherwise.
- Fonts: a pair from `fontPairs` into `state.style.fonts`.
- Section look: `state.style.look` (one of `sectionStyles`).
- Sections: reorder, remove, or change the variant in `state.pages.home|about|contact`; types and variants are listed by `folioblocks templates`.

### 7. Publish

Ask where their site is (their own hosting, WordPress.com, or not yet), then follow [references/publish.md](references/publish.md) for that case: upload the zip, set up the pages, and where to go next. Link the full guide: https://huzaifaalmesbah.github.io/folioblocks/#/guide

## Verification

- `folioblocks check` shows no `FIX` lines (or they chose to keep them).
- `folioblocks build` printed a zip path and the zip exists.
- You did not edit anything inside `theme/` by hand.

## Failure modes

- **"photo not found" / "over 2 MB"**: ask for the right path, or a smaller photo; or leave the photo out and add it later in the builder.
- **"not valid JSON"**: you broke the file; fix the syntax (a missing comma or quote).
- **npx can't reach GitHub**: they can still make the site in the browser: https://huzaifaalmesbah.github.io/folioblocks/#/build
- **`preview` fails** (no network, port busy): try `folioblocks preview --port 9500`, or `folioblocks preview --url`, or `folioblocks link`.
- **A project without a screenshot** shows a sample picture on the site. Tell them, and suggest adding a screenshot (a file path in `image`).
