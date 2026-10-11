import { listNames, verdictLine } from './lines';
import type { Player, Round } from './types';

const players: Player[] = ['Maya', 'Jordan', 'Sam'].map((name, i) => ({ id: `p${i}`, name, color: 'teal' }));
const base: Round = {
  id: 'r',
  number: 1,
  topicId: 'food',
  topicName: 'Food',
  topicEmoji: '🍕',
  topicColor: 'orange',
  word: 'Pizza',
  imposterIds: ['p1'],
  order: [],
  votes: {},
  accusedId: 'p1',
  guess: null,
  outcome: 'caught',
  points: {},
  startedAt: '',
  endedAt: '',
};

describe('lines', () => {
  it('lists names like a person would', () => {
    expect(listNames([])).toBe('');
    expect(listNames(['A'])).toBe('A');
    expect(listNames(['A', 'B'])).toBe('A and B');
    expect(listNames(['A', 'B', 'C'])).toBe('A, B and C');
  });

  it('says who it was, every way a round can end', () => {
    expect(verdictLine(base, players)).toBe('It was Jordan.');
    expect(verdictLine({ ...base, outcome: 'stolen' }, players)).toBe('Jordan guessed “Pizza”.');
    expect(verdictLine({ ...base, outcome: 'escaped', accusedId: 'p0' }, players)).toBe('Maya was in. It was Jordan.');
    expect(verdictLine({ ...base, outcome: 'escaped', accusedId: null }, players)).toBe('Nobody agreed. It was Jordan.');
    expect(verdictLine({ ...base, imposterIds: ['p1', 'p2'] }, players)).toBe('It was Jordan. And Sam.');
  });
});
