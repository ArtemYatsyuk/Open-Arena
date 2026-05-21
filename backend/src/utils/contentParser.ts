export function extractTextFromContent(str: string): string {
  if (!str) return str;

  const blockPattern = /^\s*\[\s*\{?['"]type['"]\s*:\s*['"]text['"]\s*,\s*['"]text['"]\s*:\s*"((?:[^"\\]|\\.)*)"\s*\}?\s*\]\s*$/gm;

  const matches = [...str.matchAll(blockPattern)];
  if (matches.length === 0) return str;

  return matches.map((m) => m[1]).join('\n\n').trim() || str;
}
