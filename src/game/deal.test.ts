import { clampImposters, dealRound, eligibleTopics, guessChoices, guessMatches, imposterCount, maxImposters, playableWords } from './deal';
import { seededRandom } from './random';
import { DEFAULT_SETTINGS, type Player, type Topic } from './types';

const players: Player[] = ['Maya', 'Jordan', 'Sam', 'Ari', 'Kai', 'Lee'].map((name, i) => ({
  id: `p${i}`,
  name,
  color: 'purple',
}));

const food: Topic = { id: 'food', name: 'Food', emoji: '🍕', color: 'orange', builtIn: true, words: ['Pizza', 'Sushi', 'Tacos', 'Ramen'] };
const pets: Topic = { id: 'pets', name: 'Pets', emoji: '🐶', color: 'teal', builtIn: true, words: ['Dog', 'Cat'] };
const empty: Topic = { id: 'empty', name: 'Empty', emoji: '🫥', color: 'teal', builtIn: false, words: ['  ', ''] };

const session = (over: Partial<typeof DEFAULT_SETTINGS> = {}, usedWords: string[] = []) => ({
  players,
  settings: { ...DEFAULT_SETTINGS, ...over },
  usedWords,
});

describe('imposter limits', () => {
  it('scales with the table', () => {
    expect([3, 4, 5, 7, 8, 12].map(maxImposters)).toEqual([1, 1, 2, 2, 3, 3]);
  });

  it('clamps a setting to what the table can take, leaving surprise alone', () => {
    expect(clampImposters(3, 4)).toBe(1);
    expect(clampImposters(2, 6)).toBe(2);
    expect(clampImposters('surprise', 3)).toBe('surprise');
  });

  it('a surprise is always at least one and never more than the table allows', () => {
    const random = seededRandom(7);
    for (let i = 0; i < 200; i += 1) {
      const n = imposterCount('surprise', 4, random);
      expect(n).toBe(1);
      const m = imposterCount('surprise', 9, random);
      expect(m).toBeGreaterThanOrEqual(1);
      expect(m).toBeLessThanOrEqual(3);
    }
  });
});

describe('dealRound', () => {
  it('deals a word from the chosen topics, the right number of imposters, and everyone in the order', () => {
    const deal = dealRound(session({ imposters: 2, topicIds: ['food'] }), [food, pets], seededRandom(1));
    expect(food.words).toContain(deal.word);
    expect(deal.topicId).toBe('food');
    expect(deal.imposterIds).toHaveLength(2);
    expect(new Set(deal.imposterIds).size).toBe(2);
    expect([...deal.order].sort()).toEqual(players.map((p) => p.id).sort());
  });

  it('keeps the seating order, starting from some seat', () => {
    const deal = dealRound(session(), [food], seededRandom(3));
    const start = players.findIndex((p) => p.id === deal.order[0]);
    const expected = [...players.slice(start), ...players.slice(0, start)].map((p) => p.id);
    expect(deal.order).toEqual(expected);
  });

  it('starts from different seats across rounds', () => {
    const random = seededRandom(11);
    const starts = new Set(Array.from({ length: 40 }, () => dealRound(session(), [food], random).order[0]));
    expect(starts.size).toBeGreaterThan(3);
  });

  it('never repeats a word until the topic runs dry, then starts over', () => {
    const random = seededRandom(5);
    const used: string[] = [];
    for (let i = 0; i < 4; i += 1) used.push(dealRound(session({ topicIds: ['food'] }, used), [food], random).word);
    expect(new Set(used).size).toBe(4);
    expect(food.words).toContain(dealRound(session({ topicIds: ['food'] }, used), [food], random).word);
  });

  it('uses every topic when none are chosen, and skips topics with no words', () => {
    expect(eligibleTopics([food, empty, pets], { topicIds: [] }).map((t) => t.id)).toEqual(['food', 'pets']);
    expect(eligibleTopics([food, empty, pets], { topicIds: ['empty'] }).map((t) => t.id)).toEqual(['food', 'pets']);
  });

  it('refuses to deal with nothing to deal', () => {
    expect(() => dealRound(session(), [empty], seededRandom(1))).toThrow();
  });

  it('picks imposters fairly over many rounds', () => {
    const random = seededRandom(99);
    const counts = new Map<string, number>();
    for (let i = 0; i < 1200; i += 1) {
      const id = dealRound(session(), [food], random).imposterIds[0]!;
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }
    for (const p of players) {
      expect(counts.get(p.id)).toBeGreaterThan(140);
      expect(counts.get(p.id)).toBeLessThan(260);
    }
  });
});

describe('words and guesses', () => {
  it('trims and de-duplicates a topic', () => {
    expect(playableWords({ words: [' Pizza ', 'pizza', '', 'Sushi'] })).toEqual(['Pizza', 'Sushi']);
  });

  it('offers the word among decoys from the same topic', () => {
    const choices = guessChoices('Pizza', food, seededRandom(2), 8);
    expect(choices).toContain('Pizza');
    expect(choices).toHaveLength(4);
    expect(new Set(choices).size).toBe(4);
    expect(choices.every((c) => food.words.includes(c))).toBe(true);
  });

  it('caps the choices', () => {
    const big = { words: Array.from({ length: 30 }, (_, i) => `W${i}`) };
    expect(guessChoices('W3', big, seededRandom(4), 8)).toHaveLength(8);
  });

  it('matches a guess ignoring case and spacing', () => {
    expect(guessMatches('  ice   CREAM ', 'Ice cream')).toBe(true);
    expect(guessMatches('Ice', 'Ice cream')).toBe(false);
  });
});
