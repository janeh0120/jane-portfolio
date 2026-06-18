/** Basic blocklist — extend as needed; not exhaustive moderation. */
const BLOCKED_TERMS = [
  'fuck',
  'shit',
  'asshole',
  'bitch',
  'cunt',
  'nigger',
  'nigga',
  'faggot',
  'retard',
  'whore',
  'slut',
];

function normalizeForCheck(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function containsBlockedContent(text: string): boolean {
  const normalized = normalizeForCheck(text);
  if (!normalized) return false;

  const words = new Set(normalized.split(' '));
  return BLOCKED_TERMS.some((term) => words.has(term) || normalized.includes(term));
}

export const BLOCKED_CONTENT_MESSAGE =
  'Please keep feedback respectful — remove inappropriate language and try again.';
