const CUSTOM_EMOJI_PATTERN = /<a?:\w+:\d+>/g;
const UNICODE_EMOJI_PATTERN =
  /[\p{Extended_Pictographic}\p{Emoji_Component}\p{Emoji_Modifier}\p{Emoji_Modifier_Base}\p{Emoji_Presentation}]/gu;
const URL_PATTERN = /(?:https?:\/\/|www\.)\S+/i;
const VOWEL_PATTERN = /[aeiouy]/i;

export function stripEmojiMarkup(content: string): string {
  return content
    .replace(CUSTOM_EMOJI_PATTERN, "")
    .replace(UNICODE_EMOJI_PATTERN, "")
    .replace(/\s+/g, " ")
    .trim();
}

function hasVowel(text: string): boolean {
  return VOWEL_PATTERN.test(text);
}

function isRepeatedCharRun(text: string): boolean {
  return /(.)\1{3,}/.test(text);
}

function uniqueCharRatio(text: string): number {
  if (text.length === 0) return 0;
  return new Set(text.toLowerCase()).size / text.length;
}

function isLikelyKeyboardMash(word: string): boolean {
  if (word.length >= 5 && !hasVowel(word)) return true;
  if (isRepeatedCharRun(word)) return true;
  if (word.length >= 8 && uniqueCharRatio(word) < 0.45) return true;
  return false;
}

function isValidSingleToken(token: string): boolean {
  if (token.length < 4) return false;
  if (!hasVowel(token)) return false;
  return !isLikelyKeyboardMash(token);
}

/** Heuristic check that message text looks like a real DSM update (not gibberish/noise). */
export function isValidDsmCheckIn(content: string): boolean {
  const text = stripEmojiMarkup(content);
  if (!text) return false;

  if (URL_PATTERN.test(text)) return true;

  const tokens = text.split(/\s+/).filter(Boolean);
  if (tokens.length >= 2 && text.length >= 8) return true;

  if (tokens.length === 1) {
    return isValidSingleToken(tokens[0]!);
  }

  return false;
}

/** Exported examples for manual / future automated verification. */
export const DSM_VALIDATION_CASES: { input: string; expected: boolean }[] = [
  { input: "jwndnwdn", expected: false },
  { input: "Finished auth PR, starting tests", expected: true },
  { input: "Blocked", expected: true },
  { input: "ok", expected: false },
  { input: "https://github.com/x/y", expected: true },
  { input: "OOO today", expected: true },
  { input: "asdfgh", expected: false },
  { input: "aaaaaaa", expected: false },
  { input: "Refactoring", expected: true },
  { input: "done for today", expected: true },
];

export function truncateCheckInPreview(content: string, maxLen = 80): string {
  const singleLine = content.replace(/\s+/g, " ").trim();
  if (singleLine.length <= maxLen) return singleLine;
  return singleLine.slice(0, maxLen - 1) + "…";
}
