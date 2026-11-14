/**
 * Resize a photo in the browser before it goes into the theme: smaller files
 * load faster on the student's site, fit in localStorage, and keep the
 * Playground link short (images travel inside it).
 */
export async function resizeImage(file: File, maxWidth: number, maxHeight: number, quality = 0.78): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('Please choose an image file (JPG, PNG or WebP).');
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxWidth / bitmap.width, maxHeight / bitmap.height);
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();
  return canvas.toDataURL('image/webp', quality);
}

/** Sizes per kind of image. */
export const IMAGE_LIMITS = {
  avatar: { maxWidth: 800, maxHeight: 1000 },
  project: { maxWidth: 1200, maxHeight: 900 },
} as const;
