# Interview questions

Ask in this order, a few at a time, in the person's language. Each answer maps to a field in `state.info` (see [project-file.md](project-file.md)). Anything skipped stays empty, and the theme leaves that part out.

## Round 1: the basics (enough for a finished site)

1. **Your name**, as it should appear on the site. → `name`
2. **Where you study or work, and the city.** → `university` (school or workplace, as they write it), `location`
3. **Two or three lines about you**: what you do, what you like to build, what you're looking for. Offer a draft from their answers; use it only after they say yes. → `bio`
4. **One line about you**, e.g. "CSE student and WordPress contributor" or "Product designer at Ranga Pay". Now you know enough to offer two or three suggestions from their bio if they're stuck. → `tagline`
5. **An email for the site** (it will be public; a separate one is fine), or skip. → `email`
6. **A photo of you** (a file path), or "later". → `avatar`

## Round 2: the design

Ask: **"Which fits you best: developer, designer, student, or someone with a job (or changing jobs)?"**

Run `folioblocks templates`, pick three templates whose `tracks` include their answer, and present them as a short list: name, `bestFor`, and that template's `preview` link. Ask them to pick one (they can change later). Run `folioblocks init --template <key>`, then write Round 1's answers into the file.

## Round 3: what makes it convincing

7. **Skills**: a short list, e.g. "PHP, JavaScript, Figma". → `skills` (array)
8. **Projects**, one at a time, as many as they like (two or three is great):
   - name → `title`
   - one line: what it does and what they did → `description`
   - a link, or skip → `url`
   - a screenshot (file path), or skip → `image` (without one, the site shows a sample picture: say so)
9. **Education**: degree or course, school, years. → `education[]` (`degree`, `school`, `period`)
10. **Links**: GitHub, LinkedIn, WordPress.org profile, X. → `socials.github`, `socials.linkedin`, `socials.wordpress`, `socials.x` (full https:// addresses). If they give a `profiles.wordpress.org` link anywhere (e.g. for a contribution), also use it for `socials.wordpress`.

## Round 4: optional (ask once: "Want to add any of these?")

- **Work experience**: role, organisation, period, one line about what they did. → `experience[]` (`role`, `org`, `period`, `description`)
- **WordPress contributions**: team (e.g. Polyglots, Core), what they did, when, a link. → `contributions[]` (`team`, `description`, `date`, `url`)
- **Awards and certificates**: title, who gave it, year, link. → `achievements[]` (`title`, `issuer`, `year`, `url`)
- **Services** (if they take client work): name and one line. → `services[]` (`title`, `description`)
- **Kind words**: only real quotes, from people who said yes to sharing them: the quote, name, role. → `testimonials[]` (`quote`, `name`, `role`)
- **A CV link** (PDF, Google Doc, LinkedIn). → `cvUrl`

## Good habits

- Repeat back numbers and links before saving them.
- Dates and periods: keep their words. For something still going on, write it as "2025 – now" in the site's language.
- Keep their words. Fix spelling only if they agree.
- If they give a lot at once (a CV), fill everything, then show a compact summary by section and ask "Anything to change or leave out?"
- Don't ask for phone numbers or home addresses; the site doesn't need them.
