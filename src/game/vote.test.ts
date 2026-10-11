import { ballotFor, leaders, resolveVotes, tally } from './vote';

const all = ['a', 'b', 'c', 'd'];

describe('votes', () => {
  it('counts votes, most first, keeping seat order on a draw', () => {
    expect(tally({ a: 'b', c: 'b', d: 'a' }, all)).toEqual([
      { playerId: 'b', votes: 2 },
      { playerId: 'a', votes: 1 },
      { playerId: 'c', votes: 0 },
      { playerId: 'd', votes: 0 },
    ]);
  });

  it('ignores votes for someone who is not a candidate', () => {
    expect(leaders({ a: 'b', b: 'z' }, all)).toEqual(['b']);
  });

  it('accuses a clear winner', () => {
    expect(resolveVotes({ a: 'b', c: 'b', b: 'a' }, all, false)).toEqual({ kind: 'accused', playerId: 'b' });
  });

  it('sends a tie to a revote, and a tied revote to deadlock', () => {
    expect(resolveVotes({ a: 'b', b: 'a' }, all, false)).toEqual({ kind: 'tie', playerIds: ['a', 'b'] });
    expect(resolveVotes({ a: 'b', b: 'a' }, ['a', 'b'], true)).toEqual({ kind: 'deadlock' });
  });

  it('calls no votes a deadlock', () => {
    expect(resolveVotes({}, all, false)).toEqual({ kind: 'deadlock' });
  });

  it('never lets a player vote for themselves', () => {
    expect(ballotFor('b', all)).toEqual(['a', 'c', 'd']);
  });
});
