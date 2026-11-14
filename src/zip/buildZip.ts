import JSZip from 'jszip';
import type { ThemeFiles } from '../types';

/**
 * Build an installable theme zip. The theme folder sits at the zip root
 * (`<slug>/style.css`), which is what WordPress' "Upload Theme" expects.
 */
export async function buildZip(
  slug: string,
  files: ThemeFiles,
  binaries: Record<string, Blob | Uint8Array> = {},
): Promise<Blob> {
  const zip = new JSZip();
  const root = zip.folder(slug)!;
  for (const [path, content] of Object.entries(files)) root.file(path, content);
  for (const [path, data] of Object.entries(binaries)) root.file(path, data);
  return zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
}
