function tryExtract(str: string, quote: string): string | null {
  const escaped = quote === '"' ? '\\"' : "'";
  const pattern = new RegExp(
    `^\\s*\\[\\s*\\{?['"]type['"]\\s*:\\s*['"]text['"]\\s*,\\s*['"]text['"]\\s*:\\s*${quote}((?:[^${escaped}\\\\]|\\\\.)*)${quote}\\s*\\}?\\s*\\]\\s*$`,
    'gm'
  );
  const matches = [...str.matchAll(pattern)];
  if (matches.length === 0) return null;
  return matches.map((m) => m[1]).join('\n\n').trim();
}

export function extractTextFromContent(str: string): string {
  if (!str) return str;
  return tryExtract(str, '"') || tryExtract(str, "'") || str;
}
