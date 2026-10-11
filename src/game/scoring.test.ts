import { outcomeOfVote, POINTS, roundPoints, standings } from './scoring';
import type { Player, Round } from './types';

const players: Player[] = ['a', 'b', 'c', 'd'].map((id) => ({ id, name: id.toUpperCase(), color: 'teal' }));

const round = (over: Partial<Round> = {}): Round => ({
  id: 'r1',
  number: 1,
  topicId: 'food',
  topicName: 'Food',
  topicEmoji: '🍕',
  topicColor: 'orange',
  word: 'Pizza',
  imposterIds: ['d'],
  order: ['a', 'b', 'c', 'd'],
  votes: {},
  accusedId: null,
  guess: null,
  outcome: null,
  points: {},
  startedAt: '2026-10-10T20:00:00Z',
  endedAt: null,
  ...over,
});

describe('outcomeOfVote', () => {
  it('is caught when the accused is an imposter, escaped otherwise', () => {
    expect(outcomeOfVote(round(), 'd')).toBe('caught');
    expect(outcomeOfVote(round(), 'a')).toBe('escaped');
    expect(outcomeOfVote(round(), null)).toBe('escaped');
  });
});

describe('roundPoints', () => {
  it('caught: everyone in scores, the imposter does not', () => {
    expect(roundPoints(round({ accusedId: 'd' }), players, 'caught')).toEqual({ a: 1, b: 1, c: 1, d: 0 });
  });

  it('caught with secret votes: a detective bonus for votes on an imposter', () => {
    const r = round({ accusedId: 'd', votes: { a: 'd', b: 'd', c: 'a', d: 'a' } });
    expect(roundPoints(r, players, 'caught')).toEqual({ a: 1 + POINTS.detective, b: 1 + POINTS.detective, c: 1, d: 0 });
  });

  it('escaped: every imposter scores', () => {
    const r = round({ imposterIds: ['c', 'd'], accusedId: 'a' });
    expect(roundPoints(r, players, 'escaped')).toEqual({ a: 0, b: 0, c: POINTS.escaped, d: POINTS.escaped });
  });

  it('stolen: imposters score, and the one who guessed gets the steal bonus', () => {
    const r = round({ imposterIds: ['c', 'd'], accusedId: 'd' });
    expect(roundPoints(r, players, 'stolen')).toEqual({ a: 0, b: 0, c: POINTS.stolen, d: POINTS.stolen + POINTS.steal });
  });
});

describe('standings', () => {
  it('adds up finished rounds only, ranks ties together, keeps seat order', () => {
    const table = standings({
      players,
      rounds: [
        round({ outcome: 'caught', points: { a: 1, b: 1, c: 1, d: 0 } }),
        round({ id: 'r2', outcome: 'escaped', points: { a: 0, b: 0, c: 0, d: 2 } }),
        round({ id: 'r3', outcome: null, points: { a: 9 } }),
      ],
    });
    expect(table.map((s) => [s.player.id, s.score, s.rank])).toEqual([
      ['d', 2, 1],
      ['a', 1, 2],
      ['b', 1, 2],
      ['c', 1, 2],
    ]);
  });
});
