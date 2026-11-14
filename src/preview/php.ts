/**
 * Our patterns only ever contain a handful of PHP calls (we generate them),
 * so the quick preview can evaluate them in JavaScript instead of running PHP:
 *
 *   <?php echo esc_html__( 'Text', 'domain' ); ?>
 *   <?php echo esc_html_x( 'Text', 'context', 'domain' ); ?>
 *   <?php echo esc_attr__( 'Text', 'domain' ); ?>
 *   <?php echo esc_url( 'https://…' ); ?>
 *   <?php echo esc_html( gmdate( 'Y' ) ); ?>
 *
 * Anything else is left out of the preview rather than guessed at.
 */


export function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

/** Read a PHP single-quoted string literal starting at `i`; returns its value and the index after it. */
function readString(src: string, i: number): [string, number] | null {
  if (src[i] !== "'") return null;
  let out = '';
  for (let j = i + 1; j < src.length; j++) {
    const c = src[j];
    if (c === '\\' && (src[j + 1] === "'" || src[j + 1] === '\\')) {
      out += src[j + 1];
      j++;
    } else if (c === "'") {
      return [out, j + 1];
    } else {
      out += c;
    }
  }
  return null;
}

/** All string literal arguments of a call, in order. */
function stringArgs(src: string): string[] {
  const args: string[] = [];
  for (let i = 0; i < src.length; i++) {
    if (src[i] === "'") {
      const r = readString(src, i);
      if (!r) break;
      args.push(r[0]);
      i = r[1] - 1;
    }
  }
  return args;
}

function safeUrl(url: string): string {
  return /^(https?:|mailto:|#|\/|data:image\/|blob:)/i.test(url) ? url : '';
}

/** Maps a theme-relative path (assets/images/avatar.webp) to a URL the preview can load. */
export type FileUrl = (path: string) => string;

/** Evaluate one PHP span's code (without the tags). Returns HTML-safe output. */
export function evalPhp(code: string, fileUrl: FileUrl = () => ''): string {
  const m = /^(?:echo\s+)?([a-z_]+)\(([\s\S]*)\);?$/i.exec(code.trim());
  if (!m) return '';
  const [, fn, rest] = m;
  const args = stringArgs(rest);
  switch (fn) {
    case 'esc_html__':
    case 'esc_html_x':
    case 'esc_html_e':
    case 'esc_attr__':
    case 'esc_attr_x':
    case 'esc_attr_e':
      return escapeHtml(args[0] ?? '');
    case 'esc_url':
      if (/get_(parent_)?theme_file_uri\(/.test(rest)) return escapeHtml(safeUrl(fileUrl(args[0] ?? '')));
      return escapeHtml(safeUrl(args[0] ?? ''));
    case 'esc_html':
      return /gmdate\(\s*'Y'\s*\)/.test(rest) ? String(new Date().getFullYear()) : escapeHtml(args[0] ?? '');
    default:
      return '';
  }
}

/**
 * Replace each `<?php … ?>` span using `fn(code)`. Quote-aware, so a `?>`
 * inside a string literal (a student could type one) doesn't end the span.
 */
function replacePhpSpans(src: string, fn: (code: string) => string): string {
  let out = '';
  let i = 0;
  for (;;) {
    const start = src.indexOf('<?php', i);
    if (start === -1) return out + src.slice(i);
    out += src.slice(i, start);
    let j = start + 5;
    let end = -1;
    while (j < src.length) {
      if (src[j] === "'") {
        const r = readString(src, j);
        j = r ? r[1] : src.length;
      } else if (src.startsWith('?>', j)) {
        end = j;
        break;
      } else j++;
    }
    if (end === -1) return out; // Unclosed span: drop the rest.
    out += fn(src.slice(start + 5, end).trim());
    i = end + 2;
  }
}

/** Escape a value for inside a JSON string in a block comment. */
function jsonEscape(s: string): string {
  return JSON.stringify(s).slice(1, -1);
}

/**
 * Replace every PHP span in a pattern with its output. Spans inside block
 * comments (attributes) are JSON-escaped; the rest are already HTML-safe.
 * The PHP file header (the leading <?php … ?> docblock) is dropped.
 */
export function renderPhp(source: string, fileUrl?: FileUrl): string {
  // Drop the pattern header: everything up to the first "?>" of the opening docblock.
  const body = source.replace(/^<\?php\s*\/\*\*[\s\S]*?\*\/\s*\?>\n?/, '');
  const outputs: string[] = [];
  const tokenized = replacePhpSpans(body, (code) => `\uE000${outputs.push(evalPhp(code, fileUrl)) - 1}\uE000`);
  return tokenized
    .replace(/<!--[\s\S]*?-->/g, (comment) =>
      comment.replace(/\uE000(\d+)\uE000/g, (_m, i) => jsonEscape(outputs[Number(i)])),
    )
    .replace(/\uE000(\d+)\uE000/g, (_m, i) => outputs[Number(i)]);
}
