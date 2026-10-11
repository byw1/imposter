import { seededRandom } from './random';
import { accuse, beginRound, castVote, clearVotes, currentRound, finishFromVote, finishWithGuess, latestRound, needsGuess, startSession } from './session';
import { DEFAULT_SETTINGS, type Player, type Topic } from './types';

const players: Player[] = ['Maya', 'Jordan', 'Sam', 'Ari'].map((name, i) => ({ id: `p${i}`, name, color: 'yellow' }));
const topics: Topic[] = [{ id: 'food', name: 'Food', emoji: '🍕', color: 'orange', builtIn: true, words: ['Pizza', 'Sushi', 'Tacos'] }];
const NOW = '2026-10-10T20:00:00.000Z';

function opened(seed = 1) {
  const s = startSession(players, DEFAULT_SETTINGS, 'ses_1', NOW);
  return beginRound(s, topics, seededRandom(seed), 'rnd_1', NOW);
}

describe('a round, start to finish', () => {
  it('starts empty, then opens a numbered round and remembers its word', () => {
    const s = opened();
    const round = currentRound(s)!;
    expect(round.number).toBe(1);
    expect(s.usedWords).toEqual([round.word]);
  });

  it('caught, then a wrong guess: caught, scored and closed', () => {
    let s = opened();
    const imposter = currentRound(s)!.imposterIds[0]!;
    s = accuse(s, imposter);
    expect(needsGuess(s)).toBe(true);
    s = finishWithGuess(s, 'Definitely not it', NOW);
    const round = latestRound(s)!;
    expect(round.outcome).toBe('caught');
    expect(round.points[imposter]).toBe(0);
    expect(currentRound(s)).toBeNull();
  });

  it('caught, then the right guess: stolen', () => {
    let s = opened();
    const round = currentRound(s)!;
    s = accuse(s, round.imposterIds[0]!);
    s = finishWithGuess(s, round.word.toUpperCase(), NOW);
    expect(latestRound(s)!.outcome).toBe('stolen');
  });

  it('voting out someone who was in: escaped, no guess', () => {
    let s = opened();
    const round = currentRound(s)!;
    const innocent = players.find((p) => !round.imposterIds.includes(p.id))!.id;
    s = accuse(s, innocent);
    expect(needsGuess(s)).toBe(false);
    s = finishFromVote(s, NOW);
    expect(latestRound(s)!.outcome).toBe('escaped');
  });

  it('a deadlock: escaped', () => {
    const s = finishFromVote(accuse(opened(), null), NOW);
    expect(latestRound(s)!.outcome).toBe('escaped');
  });

  it('records and clears secret votes', () => {
    let s = castVote(opened(), 'p0', 'p1');
    s = castVote(s, 'p1', 'p0');
    expect(currentRound(s)!.votes).toEqual({ p0: 'p1', p1: 'p0' });
    expect(currentRound(clearVotes(s))!.votes).toEqual({});
  });

  it('numbers the next round, and replaces a round left open', () => {
    let s = finishFromVote(accuse(opened(), null), NOW);
    s = beginRound(s, topics, seededRandom(2), 'rnd_2', NOW);
    expect(currentRound(s)!.number).toBe(2);
    s = beginRound(s, topics, seededRandom(3), 'rnd_3', NOW);
    expect(s.rounds.map((r) => r.id)).toEqual(['rnd_1', 'rnd_3']);
  });

  it('changes nothing once the round is closed', () => {
    const closed = finishFromVote(accuse(opened(), null), NOW);
    expect(castVote(closed, 'p0', 'p1')).toBe(closed);
    expect(finishWithGuess(closed, 'Pizza', NOW)).toBe(closed);
  });
});
