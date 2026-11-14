import type { ThemeAsset } from '../fonts';
import type { Info } from '../types';

/**
 * Theme images live in assets/images/, as Ipsum's do. Each one is either the
 * student's upload (a data URL) or one of our placeholders (public/images/).
 * The theme only ships the images its patterns use.
 */

export const AVATAR = 'assets/images/avatar.webp';
export const projectImage = (i: number) => `assets/images/project-${i + 1}.webp`;

/** The three sample post thumbnails used in previews (not part of the theme). */
export const SAMPLE_POST_IMAGES = ['images/post-1.webp', 'images/post-2.webp', 'images/post-3.webp'];

const PLACEHOLDER_PROJECTS = 3;

/** Every image a theme could reference, with where its bytes come from. */
function allImages(info: Info): ThemeAsset[] {
  const out: ThemeAsset[] = [
    info.avatar ? { path: AVATAR, data: info.avatar } : { path: AVATAR, src: 'images/avatar.webp' },
  ];
  const count = Math.max(info.projects.length, PLACEHOLDER_PROJECTS);
  for (let i = 0; i < count; i++) {
    const own = info.projects[i]?.image;
    out.push(own ? { path: projectImage(i), data: own } : { path: projectImage(i), src: `images/project-${(i % PLACEHOLDER_PROJECTS) + 1}.webp` });
  }
  return out;
}

/** The images the generated files actually use. */
export function imageAssets(info: Info, files: Record<string, string>): ThemeAsset[] {
  const used = new Set<string>();
  for (const content of Object.values(files)) {
    for (const m of content.matchAll(/assets\/images\/[a-z0-9-]+\.webp/g)) used.add(m[0]);
  }
  return allImages(info).filter((a) => used.has(a.path));
}

/** Whether the student added any of their own images (credited differently in readme.txt). */
export function hasOwnImages(info: Info): boolean {
  return Boolean(info.avatar || info.projects.some((p) => p.image));
}
