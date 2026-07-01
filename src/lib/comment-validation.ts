export type CommentValidationCode =
  | 'too_short'
  | 'inappropriate_language'
  | 'too_many_links'
  | 'emoji_only'
  | 'too_many_emojis'
  | 'repeated_chars'
  | 'shouting'
  | 'promo_spam';

export type CommentValidationResult =
  | { ok: true }
  | { ok: false; code: CommentValidationCode; message: string };

export const VALIDATION_MESSAGES: Record<CommentValidationCode, string> = {
  too_short: 'Comments need at least 3 characters.',
  inappropriate_language:
    'Please keep feedback respectful — remove inappropriate language and try again.',
  too_many_links: 'Too many links — max 3 per comment.',
  emoji_only: "Add some words — emoji-only comments aren't allowed.",
  too_many_emojis: 'Too many emojis — use text for your feedback.',
  repeated_chars: 'Ease up on repeated characters.',
  shouting: 'Most of your comment is uppercase — normal casing reads easier.',
  promo_spam: "Promotional or off-topic content isn't allowed here.",
};

/** @deprecated Use VALIDATION_MESSAGES.inappropriate_language */
export const BLOCKED_CONTENT_MESSAGE = VALIDATION_MESSAGES.inappropriate_language;

const MIN_COMMENT_LENGTH = 3;
const MAX_LINKS = 3;
const MAX_EMOJI_COUNT = 25;
const MAX_EMOJI_RATIO = 0.6;
const SHOUTING_MIN_LENGTH = 30;
const SHOUTING_UPPER_RATIO = 0.85;
const REPEATED_CHAR_THRESHOLD = 8;

const BLOCKED_TERMS = [
  'fuck',
  'shit',
  'asshole',
  'bitch',
  'cunt',
  'nigger',
  'nigga',
  'faggot',
  'fagg0t',
  'retard',
  'whore',
  'slut',
  'dick',
  'cock',
  'pussy',
  'chink',
  'spic',
  'kike',
  'tranny',
];

const PROMO_PHRASES = [
  'buy now',
  'click here',
  'free money',
  'make money',
  'work from home',
  'onlyfans',
  'crypto',
  'bitcoin',
  'nft drop',
  'follow me',
  'subscribe now',
  'check out my',
  'dm me',
  'whatsapp',
  'telegram me',
];

const LEET_SUBSTITUTIONS: Record<string, string> = {
  '0': 'o',
  '1': 'i',
  '3': 'e',
  '4': 'a',
  '5': 's',
  '7': 't',
  '@': 'a',
  $: 's',
};

const ZERO_WIDTH_RE = /[\u200B-\u200D\uFEFF\u2060\u00AD]/g;
const URL_RE = /(?:https?:\/\/|www\.)\S+/gi;
const EMOJI_RE = /\p{Extended_Pictographic}/gu;
const REPEATED_CHAR_RE = /(.)\1{7,}/;
const LETTER_RE = /[a-zA-Z]/g;

function fail(code: CommentValidationCode): CommentValidationResult {
  return { ok: false, code, message: VALIDATION_MESSAGES[code] };
}

function applyLeetSpeak(text: string): string {
  let result = '';
  for (const char of text) {
    result += LEET_SUBSTITUTIONS[char] ?? char;
  }
  return result;
}

function collapseRepeatedLetters(text: string): string {
  return text.replace(/(.)\1+/g, '$1');
}

function normalizeForCheck(text: string): string {
  return applyLeetSpeak(
    text
      .normalize('NFKC')
      .replace(ZERO_WIDTH_RE, '')
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim(),
  );
}

function containsBlockedTerm(text: string): boolean {
  const normalized = normalizeForCheck(text);
  if (!normalized) return false;

  const collapsed = collapseRepeatedLetters(normalized.replace(/\s/g, ''));
  const words = new Set(normalized.split(' '));

  return BLOCKED_TERMS.some((term) => {
    if (words.has(term)) return true;
    if (normalized.includes(term)) return true;
    if (collapsed.includes(term.replace(/\s/g, ''))) return true;
    return false;
  });
}

function countUrls(text: string): number {
  return text.match(URL_RE)?.length ?? 0;
}

function countEmojis(text: string): number {
  return text.match(EMOJI_RE)?.length ?? 0;
}

function isEmojiOnly(text: string): boolean {
  const withoutEmoji = text.replace(EMOJI_RE, '').replace(/[\s\p{P}\p{S}]/gu, '');
  return withoutEmoji.length === 0 && countEmojis(text) > 0;
}

function isShouting(text: string): boolean {
  if (text.length <= SHOUTING_MIN_LENGTH) return false;

  const letters = text.match(LETTER_RE);
  if (!letters || letters.length === 0) return false;

  const uppercase = letters.filter((char) => char === char.toUpperCase() && char !== char.toLowerCase())
    .length;
  return uppercase / letters.length > SHOUTING_UPPER_RATIO;
}

function containsPromoSpam(text: string): boolean {
  const normalized = normalizeForCheck(text);
  return PROMO_PHRASES.some((phrase) => normalized.includes(phrase));
}

export function validateComment(text: string): CommentValidationResult {
  const trimmed = text.trim();

  if (trimmed.replace(/\s/g, '').length < MIN_COMMENT_LENGTH) {
    return fail('too_short');
  }

  if (containsBlockedTerm(trimmed)) {
    return fail('inappropriate_language');
  }

  if (REPEATED_CHAR_RE.test(trimmed)) {
    return fail('repeated_chars');
  }

  if (countUrls(trimmed) > MAX_LINKS) {
    return fail('too_many_links');
  }

  if (isEmojiOnly(trimmed)) {
    return fail('emoji_only');
  }

  const emojiCount = countEmojis(trimmed);
  if (emojiCount > MAX_EMOJI_COUNT) {
    return fail('too_many_emojis');
  }

  const meaningfulLength = trimmed.replace(/\s/g, '').length;
  if (meaningfulLength > 0 && emojiCount / meaningfulLength > MAX_EMOJI_RATIO) {
    return fail('too_many_emojis');
  }

  if (isShouting(trimmed)) {
    return fail('shouting');
  }

  if (containsPromoSpam(trimmed)) {
    return fail('promo_spam');
  }

  return { ok: true };
}

/** @deprecated Use validateComment instead */
export function containsBlockedContent(text: string): boolean {
  const result = validateComment(text);
  return !result.ok;
}
