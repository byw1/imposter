/**
 * Counting votes.
 *
 * In secret mode every player votes once, never for themselves. The player
 * with the most votes is voted out. A tie goes to a quick revote between the
 * tied players only; a second tie means the table couldn't agree, and the
 * imposters slip away in the confusion.
 */

export type Tally = { playerId: string; votes: number }[];

/** Votes per candidate, most first, candidates with no votes included. */
export function tally(votes: Record<string, string>, candidates: readonly string[]): Tally {
  const counts = new Map<string, number>(candidates.map((id) => [id, 0]));
  for (const suspect of Object.values(votes)) {
    if (counts.has(suspect)) counts.set(suspect, (counts.get(suspect) ?? 0) + 1);
  }
  // Stable: candidates keep their seat order within the same count.
  return candidates
    .map((playerId, seat) => ({ playerId, votes: counts.get(playerId) ?? 0, seat }))
    .sort((a, b) => b.votes - a.votes || a.seat - b.seat)
    .map(({ playerId, votes: v }) => ({ playerId, votes: v }));
}

/** Everyone sharing the top count. Empty when no votes were cast. */
export function leaders(votes: Record<string, string>, candidates: readonly string[]): string[] {
  const counts = tally(votes, candidates);
  const top = counts[0]?.votes ?? 0;
  if (top === 0) return [];
  return counts.filter((c) => c.votes === top).map((c) => c.playerId);
}

export type VoteResult =
  | { kind: 'accused'; playerId: string }
  | { kind: 'tie'; playerIds: string[] }
  | { kind: 'deadlock' };

/**
 * What a finished secret vote means. `revote` says whether this was already
 * the revote, in which case a tie is a deadlock rather than another revote.
 */
export function resolveVotes(votes: Record<string, string>, candidates: readonly string[], revote: boolean): VoteResult {
  const top = leaders(votes, candidates);
  if (top.length === 1) return { kind: 'accused', playerId: top[0]! };
  if (top.length === 0 || revote) return { kind: 'deadlock' };
  return { kind: 'tie', playerIds: top };
}

/** Who a voter may vote for: any candidate except themselves. */
export function ballotFor(voterId: string, candidates: readonly string[]): string[] {
  return candidates.filter((id) => id !== voterId);
}
