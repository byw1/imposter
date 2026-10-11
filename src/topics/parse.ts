/**
 * Turning a pasted list into topic words. One per line, or separated by
 * commas, so a list copied from a note or a chat both work. Blanks, bullets
 * and repeats are dropped; words are capped so one can't overflow a card.
 */

export const MAX_WORD_LENGTH = 40;
export const MAX_TOPIC_WORDS = 500;
export const MAX_TOPIC_NAME = 24;

export function parseWords(text: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of text.split(/[\n,;]+/)) {
    const word = raw
      .replace(/^\s*(?:[-*•·]|\d+[.)])\s*/, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, MAX_WORD_LENGTH);
    const key = word.toLocaleLowerCase();
    if (!word || seen.has(key)) continue;
    seen.add(key);
    out.push(word);
    if (out.length >= MAX_TOPIC_WORDS) break;
  }
  return out;
}

/** Emoji offered for a custom topic. */
export const TOPIC_EMOJI = ['🎲', '🏠', '🍔', '🎤', '⚽', '🎮', '📺', '🐶', '🌍', '💼', '🎓', '🎄', '👻', '🚗', '💅', '😂'] as const;
