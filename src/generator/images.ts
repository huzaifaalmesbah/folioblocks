import type { ThemeAsset } from '../fonts';
import type { Info } from '../types';

/**
 * Theme images live in assets/images/, as Ipsum's do. Each one is either the
 * student's upload (a data URL) or one of our placeholders (public/images/).
 * The theme only ships the images its patterns use.
 */

export const AVATAR = 'assets/images/avatar.webp';
export const projectImage = (i: number) => `assets/images/project-${i + 1}.webp`;

/**
 * The file extension for an uploaded photo. The website stores WebP; the
 * command line keeps a student's JPEG or PNG as it is, so name it truly.
 */
function ext(dataUrl: string | undefined): string {
  const m = /^data:image\/(webp|jpeg|png);/.exec(dataUrl ?? '');
  return m ? (m[1] === 'jpeg' ? 'jpg' : m[1]) : 'webp';
}

/** Where the profile photo goes in the theme. */
export const avatarPath = (info: Info) => AVATAR.replace(/\.webp$/, `.${ext(info.avatar)}`);
/** Where a project's picture goes in the theme. */
export const projectImagePath = (info: Info, i: number) => projectImage(i).replace(/\.webp$/, `.${ext(info.projects[i]?.image)}`);

/** The three sample post thumbnails used in previews (not part of the theme). */
export const SAMPLE_POST_IMAGES = ['images/post-1.webp', 'images/post-2.webp', 'images/post-3.webp'];

const PLACEHOLDER_PROJECTS = 3;

/** Every image a theme could reference, with where its bytes come from. */
function allImages(info: Info): ThemeAsset[] {
  const out: ThemeAsset[] = [
    info.avatar ? { path: avatarPath(info), data: info.avatar } : { path: AVATAR, src: 'images/avatar.webp' },
  ];
  const count = Math.max(info.projects.length, PLACEHOLDER_PROJECTS);
  for (let i = 0; i < count; i++) {
    const own = info.projects[i]?.image;
    out.push(own ? { path: projectImagePath(info, i), data: own } : { path: projectImage(i), src: `images/project-${(i % PLACEHOLDER_PROJECTS) + 1}.webp` });
  }
  return out;
}

/** The images the generated files actually use. */
export function imageAssets(info: Info, files: Record<string, string>): ThemeAsset[] {
  const used = new Set<string>();
  for (const content of Object.values(files)) {
    for (const m of content.matchAll(/assets\/images\/[a-z0-9-]+\.(?:webp|jpg|png)/g)) used.add(m[0]);
  }
  return allImages(info).filter((a) => used.has(a.path));
}

/** Whether the student added any of their own images (credited differently in readme.txt). */
export function hasOwnImages(info: Info): boolean {
  return Boolean(info.avatar || info.projects.some((p) => p.image));
}
