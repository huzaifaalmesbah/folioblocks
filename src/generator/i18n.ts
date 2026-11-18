import type { Language } from '../types';

/**
 * The theme's own words in Bengali, keyed by the English source. Only
 * these fixed strings are translated; whatever the student types is used
 * exactly as written. Strings still go through __() in the theme, so
 * translators can change them later.
 */
const BN: Record<string, string> = {
  'View my work': 'আমার কাজ দেখুন',
  'Contact me': 'যোগাযোগ করুন',
  'Download CV': 'সিভি ডাউনলোড',
  "Hello, I'm": 'হ্যালো, আমি',
  'About me': 'আমার সম্পর্কে',
  Skills: 'দক্ষতা',
  'My WordPress journey': 'আমার ওয়ার্ডপ্রেস যাত্রা',
  Experience: 'অভিজ্ঞতা',
  Education: 'শিক্ষা',
  Achievements: 'অর্জন',
  Projects: 'প্রজেক্ট',
  Contributions: 'কন্ট্রিবিউশন',
  'Selected work': 'নির্বাচিত কাজ',
  'Latest posts': 'সাম্প্রতিক লেখা',
  "Let's work together": 'চলুন একসাথে কাজ করি',
  'Have a question or an idea? Get in touch.': 'কোনো প্রশ্ন বা আইডিয়া আছে? যোগাযোগ করুন।',
  'Email me': 'ইমেইল করুন',
  Contact: 'যোগাযোগ',
  'The best way to reach me is by email.': 'আমার সাথে যোগাযোগের সবচেয়ে ভালো উপায় ইমেইল।',
  Blog: 'ব্লগ',
  'Notes on what I am learning and building.': 'আমি যা শিখছি ও তৈরি করছি, তা নিয়ে লেখা।',
  'Nothing found. Try a different search.': 'কিছু পাওয়া যায়নি। অন্য কিছু খুঁজে দেখুন।',
  'Written by': 'লিখেছেন',
  'Page not found': 'পাতাটি পাওয়া যায়নি',
  'The page you are looking for does not exist. Try searching instead.': 'আপনি যে পাতাটি খুঁজছেন তা নেই। সার্চ করে দেখুন।',
  Search: 'খুঁজুন',
  'Previous post': 'আগের লেখা',
  'Next post': 'পরের লেখা',
  'This page is empty for now. Add blocks to it in the Site Editor.': 'পাতাটি এখন খালি। সাইট এডিটরে ব্লক যোগ করুন।',
  Services: 'সেবা',
  'Kind words': 'অন্যরা যা বলেন',
  Home: 'হোম',
  'Based in': 'যেখানে থাকি',
  'Find me online': 'অনলাইনে আমি',
  'View project': 'প্রজেক্ট দেখুন',
  whoami: 'whoami',
  About: 'পরিচিতি',
};

export function tr(lang: Language | undefined, text: string): string {
  return lang === 'bn' ? (BN[text] ?? text) : text;
}

/** Strings with a name in them. */
export function portraitAlt(lang: Language | undefined, name: string): string {
  return lang === 'bn' ? `${name}-এর ছবি` : `Portrait of ${name}`;
}

export function screenshotAlt(lang: Language | undefined, title: string): string {
  return lang === 'bn' ? `${title}-এর ছবি` : `Screenshot of ${title}`;
}

export function footerCredit(lang: Language | undefined, toolUrl: string): string {
  return lang === 'bn'
    ? `<a href="https://wordpress.org">ওয়ার্ডপ্রেস</a> দিয়ে তৈরি · থিম বানানো হয়েছে <a href="${toolUrl}">FolioBlocks</a> দিয়ে`
    : `Built with <a href="https://wordpress.org">WordPress</a> · Theme made with <a href="${toolUrl}">FolioBlocks</a>`;
}
