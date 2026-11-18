# folioblocks.json

The project file is the FolioBlocks builder's backup format: the same file opens on the website (⋯ → Open a backup file). `folioblocks init` writes a complete one with an empty profile; you usually only edit `state.info`. Leave a field empty (`""` or `[]`) when they skip it: the theme leaves that part out. Unknown or invalid values are dropped when it is read, so keep to these fields.

```jsonc
{
  "format": "folioblocks-settings",   // keep as is
  "version": 1,                        // keep as is
  "exported": "…",                     // any date; ignored
  "state": {
    "info": {
      "name": "Nafis Rahman",
      "tagline": "CSE student and WordPress contributor",
      "university": "BUET",            // school or workplace
      "location": "Dhaka, Bangladesh",
      "bio": "Two or three lines.",
      "email": "nafis@example.com",
      "avatar": "photo.jpg",           // a local path (embedded at build) or ""
      "skills": ["PHP", "JavaScript"],
      "projects": [
        { "title": "Campus Events", "description": "One line.", "url": "https://…", "image": "shot.png" }
      ],
      "education": [{ "degree": "BSc in CSE", "school": "BUET", "period": "2022 – 2026" }],
      "experience": [{ "role": "Web Intern", "org": "Example Agency", "period": "2025", "description": "One line." }],
      "contributions": [{ "team": "Polyglots", "description": "Translated plugins.", "date": "2026", "url": "https://…" }],
      "achievements": [{ "title": "Hackathon winner", "issuer": "Campus Tech Fest", "year": "2025", "url": "" }],
      "services": [{ "title": "Theme setup", "description": "One line." }],
      "testimonials": [{ "quote": "Real words only.", "name": "A. Rahman", "role": "Club advisor" }],
      "cvUrl": "https://…",
      "socials": { "github": "https://github.com/…", "linkedin": "https://…", "wordpress": "https://profiles.wordpress.org/…", "x": "https://x.com/…" }
    },
    "language": "en",                  // the theme's own words: one of `languages` from `folioblocks templates`
    "preset": "terminal",              // the template; change it with `folioblocks template <key>`
    "style": {
      "palette": { "primary": "#…", "secondary": "#…", "base": "#…", "contrast": "#…", "accent": "#…" },
      "fonts": { "heading": "space-grotesk", "body": "inter" },
      "radius": "md",                  // none | sm | md | lg
      "look": "terminal"               // section style: see `folioblocks templates` → sectionStyles
    },
    "header": "inline",                // inline | centered
    "footer": "centered",              // centered | split
    "pages": {
      "home":    [{ "id": "s1", "type": "hero", "variant": "terminal" }],
      "about":   [{ "id": "s2", "type": "about", "variant": "photo" }],
      "contact": [{ "id": "s3", "type": "contact", "variant": "full" }]
    }
  },
  "layouts": []
}
```

## Notes

- **Links** must be full addresses starting with `https://` (the check flags others).
- **Palette roles**: `base` background, `contrast` text, `primary` links and buttons (button text is `base`, so they must contrast), `secondary` hover, `accent` cards and bands.
- **Sections**: each needs a unique `id` (any short text), a `type` and a `variant` from `folioblocks templates` → `sections`. Order in the array is order on the page. An empty section (no data for it) is left out of the theme automatically.
- **Photos** in the website builder are stored as `data:` URLs; both forms work here.
