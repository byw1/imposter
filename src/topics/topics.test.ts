import { playableWords } from '@/game/deal';
import { MIN_TOPIC_WORDS, TOPIC_COLOR_KEYS } from '@/game/types';
import { BUNDLED_TOPICS } from './bundled';
import { parseWords } from './parse';

describe('bundled topics', () => {
  it('have unique ids and names', () => {
    expect(new Set(BUNDLED_TOPICS.map((t) => t.id)).size).toBe(BUNDLED_TOPICS.length);
    expect(new Set(BUNDLED_TOPICS.map((t) => t.name)).size).toBe(BUNDLED_TOPICS.length);
  });

  it.each(BUNDLED_TOPICS.map((t) => [t.name, t] as const))('%s is playable and tidy', (_, topic) => {
    expect(TOPIC_COLOR_KEYS).toContain(topic.color);
    expect(topic.builtIn).toBe(true);
    expect(playableWords(topic)).toEqual(topic.words);
    expect(topic.words.length).toBeGreaterThanOrEqual(Math.max(MIN_TOPIC_WORDS, 40));
    for (const word of topic.words) expect(word.length).toBeLessThanOrEqual(26);
  });
});

describe('parseWords', () => {
  it('takes lines or commas, drops bullets, blanks and repeats', () => {
    expect(parseWords('- Pizza\n2. Sushi, tacos\n\n• pizza; Ramen  ')).toEqual(['Pizza', 'Sushi', 'tacos', 'Ramen']);
  });

  it('caps word length', () => {
    expect(parseWords('x'.repeat(100))[0]).toHaveLength(40);
  });
});
