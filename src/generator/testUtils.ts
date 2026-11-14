const BLOCK_RE = /<!--\s+(\/)?wp:([a-z][a-z0-9-]*(?:\/[a-z0-9-]+)?)\s+(\{[\s\S]*?\}\s+)?(\/)?-->/g;

/** Check every block comment is balanced and its JSON attributes parse. */
export function checkBlockMarkup(markup: string): string[] {
  const errors: string[] = [];
  const stack: string[] = [];
  for (const m of markup.matchAll(BLOCK_RE)) {
    const [, closing, name, attrs, selfClosing] = m;
    if (attrs && !attrs.includes('<?php')) {
      try {
        JSON.parse(attrs);
      } catch {
        errors.push(`bad JSON in ${name}: ${attrs}`);
      }
    }
    if (selfClosing) continue;
    if (closing) {
      const open = stack.pop();
      if (open !== name) errors.push(`closing ${name} but open was ${open}`);
    } else stack.push(name);
  }
  if (stack.length) errors.push(`unclosed: ${stack.join(', ')}`);
  return errors;
}

