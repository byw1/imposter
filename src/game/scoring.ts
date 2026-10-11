import type { Outcome, Player, Round, Session } from './types';

/**
 * Points.
 *
 * Small numbers, so the leaderboard stays close and anyone can come back:
 *
 * - Caught: everyone who was in gets 1. In a secret vote, anyone who voted for
 *   an imposter gets a detective's bonus of 1 more.
 * - Got away: every imposter gets 2.
 * - Stole it: every imposter gets 2, and the one who guessed the word gets 1
 *   more for the steal.
 */
export const POINTS = {
  caughtIn: 1,
  detective: 1,
  escaped: 2,
  stolen: 2,
  steal: 1,
} as const;

/**
 * How a vote ends before any guess. Voting out an imposter is caught (and
 * might yet become stolen); anyone else, or a deadlock, is escaped.
 */
export function outcomeOfVote(round: Pick<Round, 'imposterIds'>, accusedId: string | null): 'caught' | 'escaped' {
  return accusedId !== null && round.imposterIds.includes(accusedId) ? 'caught' : 'escaped';
}

/** Points for every player in a round with this outcome. */
export function roundPoints(
  round: Pick<Round, 'imposterIds' | 'votes' | 'accusedId'>,
  players: readonly Pick<Player, 'id'>[],
  outcome: Outcome,
): Record<string, number> {
  const points: Record<string, number> = {};
  for (const player of players) points[player.id] = 0;
  const imposters = new Set(round.imposterIds);

  if (outcome === 'caught') {
    for (const player of players) {
      if (imposters.has(player.id)) continue;
      const vote = round.votes[player.id];
      const sleuth = vote !== undefined && imposters.has(vote);
      points[player.id] = POINTS.caughtIn + (sleuth ? POINTS.detective : 0);
    }
    return points;
  }

  for (const id of round.imposterIds) {
    if (!(id in points)) continue;
    points[id] = outcome === 'stolen' ? POINTS.stolen : POINTS.escaped;
  }
  if (outcome === 'stolen' && round.accusedId && round.accusedId in points) {
    points[round.accusedId] = (points[round.accusedId] ?? 0) + POINTS.steal;
  }
  return points;
}

export type Standing = { player: Player; score: number; rank: number };

/** Tonight's table: total points, highest first. Equal scores share a rank. */
export function standings(session: Pick<Session, 'players' | 'rounds'>): Standing[] {
  const totals = new Map<string, number>(session.players.map((p) => [p.id, 0]));
  for (const round of session.rounds) {
    if (!round.outcome) continue;
    for (const [id, pts] of Object.entries(round.points)) {
      if (totals.has(id)) totals.set(id, (totals.get(id) ?? 0) + pts);
    }
  }

  const sorted = session.players
    .map((player, seat) => ({ player, score: totals.get(player.id) ?? 0, seat }))
    .sort((a, b) => b.score - a.score || a.seat - b.seat);

  let rank = 0;
  let last: number | null = null;
  return sorted.map((entry, index) => {
    if (entry.score !== last) {
      rank = index + 1;
      last = entry.score;
    }
    return { player: entry.player, score: entry.score, rank };
  });
}

/** Rounds that have finished. */
export function finishedRounds(session: Pick<Session, 'rounds'>): Round[] {
  return session.rounds.filter((r) => r.outcome !== null);
}
