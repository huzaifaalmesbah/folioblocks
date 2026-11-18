# Translating FolioBlocks

FolioBlocks is written in English. Anyone can add a language, or finish one that someone started, and **you don't need to know git or code**. [বাংলায় পড়ুন ↓](#বাংলা)

There are two things to translate:

- **The app**: the home page and the builder students use.
- **The site's own words**: the headings, buttons and menu that a student's WordPress site shows ("About me", "Projects", "Contact me"). With these, a student can make a site whose theme speaks their language.

## The easy way: in your browser

1. Open the **[Help translate page](https://huzaifaalmesbah.github.io/folioblocks/#/translate)**.
2. Pick your language, or click **+ A new language** and fill in its name and code (like `hi` for Hindi).
3. Translate. English is on the left, you type on the right. There are four parts: *Home page*, *Builder*, *Template names* and *The site's own words*. Start with whichever you like; *The site's own words* is the shortest and helps students the most.
4. Your work is saved in your browser as you type. You can close the page and come back later on the same computer.
5. Click **Download folioblocks-xx.zip**.
6. Open the **[New translation form](https://github.com/huzaifaalmesbah/folioblocks/issues/new?template=translation.yml)** on GitHub (a free account is enough), drag the zip into it and click **Submit**.

That's all. We add it to FolioBlocks, and a check makes sure nothing is broken. You don't have to finish everything; anything not translated yet shows in English. To add more later, open the page again (or use **Continue from a file** with your zip) and send a new zip.

### Rules for a good translation

- **Keep `{placeholders}` exactly as they are.** `{name}`, `{file}` and `{url}` are filled in later. Move them where your grammar needs them, but don't translate or change them. The page warns you if one is missing.
- **Keep links and HTML as they are**, e.g. `<a href="https://wordpress.org">WordPress</a>`. Translate only the words between the tags.
- **Don't translate names**: FolioBlocks, WordPress, GitHub, Playground, font names, and commands like `whoami`.
- **Be short and friendly.** Many readers are students using a phone. Use the words people really use, not the most formal ones.
- **Machine translation is a start, not the end.** Read every line and fix what sounds wrong.

## If you know git

Each language is a folder in [`src/i18n/locales/`](src/i18n/locales) with the same small files:

| File | What is in it |
|---|---|
| `language.json` | The language's name, writing direction (`ltr` or `rtl`), an optional font, and `enabled` |
| `home.json` | The home page |
| `builder.json` | The builder |
| `templates.json` | Names and descriptions of templates, sections, looks and colours |
| `theme.json` | The words the generated WordPress theme shows |

Each file maps the English text (left) to your translation (right). A line left in English counts as not translated.

```bash
npm install
npm run i18n:new -- hi "हिन्दी" "Hindi"     # copy en/ to a new folder (add rtl for right-to-left)
npm run i18n:check                          # check your files and see how much is translated
```

Translate the right-hand sides, run `npm run i18n:check`, and open a pull request. You can also upload a language folder through GitHub's **Add file → Upload files** on [`src/i18n/locales`](src/i18n/locales).

**Never edit `en/`.** It is generated from the code by `npm run i18n:extract`.

## For developers

- Write interface text in English, in the code, as usual. For text built in code, use `tr('Hello {name}', { name })` with the whole sentence, never pieces joined together, so it can be translated as one.
- `npm run i18n:extract` regenerates `en/` from the code and brings every other language in step: new English strings are added (as English), strings the code no longer uses are removed, and translations are kept. On `main`, the **Translations** workflow does this and commits the result, so nobody has to remember.
- Pull requests run `npm run i18n:check` and the tests.

## For maintainers

1. When a translation arrives in an issue, download the zip, unzip it into `src/i18n/locales/` (so you get `src/i18n/locales/<code>/…`), run `npm run i18n:check` and commit. Credit the translator in the commit message.
2. **Switching a language on:** set `"enabled": true` in its `language.json` once it is about 90% translated (`npm run i18n:check` shows the percentage) and someone has read it through. It then shows in the app's language menu and in the builder's **Site language** list.
3. If a language needs a font that has its letters (Bengali, Devanagari and so on), add the font to `src/fonts.ts` and set `"font"` in `language.json`. The builder switches to it when a student picks that site language.

---

## বাংলা

FolioBlocks ইংরেজিতে লেখা। যে কেউ নতুন ভাষা যোগ করতে পারেন, বা কেউ শুরু করে রেখেছেন এমন ভাষা শেষ করতে পারেন। **git বা কোড জানার দরকার নেই।**

অনুবাদ করার জিনিস দুই রকম:

- **অ্যাপ**: হোম পেজ আর বিল্ডার, যা শিক্ষার্থীরা ব্যবহার করেন।
- **সাইটের নিজের শব্দ**: শিক্ষার্থীর ওয়ার্ডপ্রেস সাইটে যে শিরোনাম, বাটন আর মেনু দেখায় ("About me", "Projects", "Contact me")।

### সহজ উপায়: ব্রাউজারেই

1. **[Help translate পাতা](https://huzaifaalmesbah.github.io/folioblocks/#/translate)** খুলুন।
2. আপনার ভাষা বেছে নিন, অথবা **+ A new language** চেপে ভাষার নাম আর কোড দিন (যেমন হিন্দির জন্য `hi`)।
3. অনুবাদ করুন। বামে ইংরেজি, ডানে আপনি লিখবেন। চারটি অংশ আছে: *Home page*, *Builder*, *Template names* আর *The site's own words*। যেকোনোটা দিয়ে শুরু করতে পারেন; *The site's own words* সবচেয়ে ছোট আর শিক্ষার্থীদের সবচেয়ে কাজে লাগে।
4. লেখার সাথে সাথে আপনার কাজ ব্রাউজারে সেভ হয়। পাতা বন্ধ করে পরে একই কম্পিউটারে আবার চালিয়ে যেতে পারবেন।
5. **Download folioblocks-xx.zip** চাপুন।
6. GitHub-এ **[New translation ফর্ম](https://github.com/huzaifaalmesbah/folioblocks/issues/new?template=translation.yml)** খুলুন (একটা ফ্রি অ্যাকাউন্টই যথেষ্ট), zip ফাইলটা টেনে ছেড়ে দিয়ে **Submit** চাপুন।

ব্যস! আমরা এটা FolioBlocks-এ যোগ করব। সব শেষ না করলেও চলবে: যা অনুবাদ হয়নি তা ইংরেজিতে দেখাবে।

### ভালো অনুবাদের নিয়ম

- **`{name}`, `{file}`, `{url}`-এর মতো `{placeholder}` হুবহু রাখুন।** এগুলো পরে বসানো হয়। ব্যাকরণ অনুযায়ী জায়গা বদলাতে পারেন, কিন্তু অনুবাদ বা পরিবর্তন করবেন না। কোনোটা বাদ পড়লে পাতাটা আপনাকে সতর্ক করবে।
- **লিংক আর HTML যেমন আছে তেমন রাখুন**, যেমন `<a href="https://wordpress.org">WordPress</a>`। শুধু ট্যাগের মাঝের শব্দ অনুবাদ করুন।
- **নাম অনুবাদ করবেন না**: FolioBlocks, WordPress, GitHub, Playground, ফন্টের নাম, আর `whoami`-এর মতো কমান্ড।
- **ছোট আর সহজ রাখুন।** অনেকেই ফোনে পড়েন। মানুষ আসলে যে শব্দ বলে, সেটা ব্যবহার করুন।
- **মেশিন ট্রান্সলেশন শুরু হিসেবে ঠিক আছে, শেষ হিসেবে নয়।** প্রতিটি লাইন পড়ে যা ভুল শোনায় তা ঠিক করুন।

git জানলে উপরের ["If you know git"](#if-you-know-git) অংশ দেখুন।
