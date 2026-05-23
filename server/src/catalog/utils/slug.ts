/**
 * Slug utilities for catalog entities.
 * Handles Latin, Cyrillic (uz/ru), and common Uzbek diacritics.
 */

const CHAR_MAP: Record<string, string> = {
  // Cyrillic (uz + ru)
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo', ж: 'j', з: 'z',
  и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r',
  с: 's', т: 't', у: 'u', ф: 'f', х: 'x', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch',
  ъ: '', ы: 'i', ь: '', э: 'e', ю: 'yu', я: 'ya',
  қ: 'q', ў: 'o', ғ: 'g', ҳ: 'h',
  // Uzbek Latin punctuation that should be dropped
  ʻ: '', ʼ: '', '`': '',
};

export function slugify(input: string): string {
  if (!input) return '';
  const lower = input.toLowerCase().trim();
  let out = '';
  for (const ch of lower) {
    if (CHAR_MAP[ch] !== undefined) {
      out += CHAR_MAP[ch];
    } else if (/[a-z0-9]/.test(ch)) {
      out += ch;
    } else if (/[\s\-_/]/.test(ch)) {
      out += '-';
    }
    // everything else is dropped
  }
  return out
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

/**
 * Make a slug unique by appending -2, -3, ... if `exists` returns true.
 * Caller provides the existence check (typically a Prisma findUnique).
 */
export async function uniqueSlug(
  base: string,
  exists: (slug: string) => Promise<boolean>,
): Promise<string> {
  let candidate = slugify(base) || 'item';
  if (!(await exists(candidate))) return candidate;
  for (let i = 2; i < 1000; i++) {
    const next = `${candidate}-${i}`;
    if (!(await exists(next))) return next;
  }
  // pathological case — fall back to random suffix
  return `${candidate}-${Date.now().toString(36)}`;
}
