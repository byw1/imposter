import type { Outcome, Round, Session } from './types';

/**
 * Stats across every night, for the You page.
 *
 * A finished round is kept as a small record by player name rather than id,
 * because the same friends come back on a new night with new ids. Names are
 * matched ignoring case.
 */

export type RoundRecord = {
  at: string;
  word: string;
  topic: string;
  outcome: Outcome;
  players: string[];
  imposters: string[];
  accused: string | null;
  /** Secret votes by name, voter to suspect. Empty in point mode. */
  votes: Record<string, string>;
};

/** Turns a finished round into its record. Returns null for a round still in play. */
export function recordRound(round: Round, session: Pick<Session, 'players'>): RoundRecord | null {
  if (!round.outcome) return null;
  const name = (id: string | null) => session.players.find((p) => p.id === id)?.name ?? null;
  const votes: Record<string, string> = {};
  for (const [voter, suspect] of Object.entries(round.votes)) {
    const a = name(voter);
    const b = name(suspect);
    if (a && b) votes[a] = b;
  }
  return {
    at: round.endedAt ?? round.startedAt,
    word: round.word,
    topic: round.topicName,
    outcome: round.outcome,
    players: session.players.map((p) => p.name),
    imposters: round.imposterIds.flatMap((id) => name(id) ?? []),
    accused: name(round.accusedId),
    votes,
  };
}

export type PlayerStats = {
  name: string;
  rounds: number;
  /** Rounds dealt as an imposter. */
  imposter: number;
  /** As an imposter: the table voted out someone else. */
  gotAway: number;
  /** As an imposter: caught, then guessed the word. */
  stole: number;
  /** As an imposter: caught and guessed wrong. */
  busted: number;
  /** As someone in: the table caught the imposter. */
  caught: number;
  /** A secret vote cast for an imposter. */
  sleuthed: number;
};

export type Totals = {
  rounds: number;
  caught: number;
  gotAway: number;
  stolen: number;
  nights: number;
};

const key = (name: string) => name.trim().toLocaleLowerCase();

export function playerStats(records: readonly RoundRecord[]): PlayerStats[] {
  const byKey = new Map<string, PlayerStats>();
  const get = (name: string) => {
    const k = key(name);
    let stats = byKey.get(k);
    if (!stats) {
      stats = { name, rounds: 0, imposter: 0, gotAway: 0, stole: 0, busted: 0, caught: 0, sleuthed: 0 };
      byKey.set(k, stats);
    }
    return stats;
  };

  for (const record of records) {
    const imposters = new Set(record.imposters.map(key));
    for (const name of record.players) {
      const stats = get(name);
      stats.rounds += 1;
      if (imposters.has(key(name))) {
        stats.imposter += 1;
        if (record.outcome === 'escaped') stats.gotAway += 1;
        else if (record.outcome === 'stolen' && record.accused && key(record.accused) === key(name)) stats.stole += 1;
        else if (record.outcome === 'stolen') stats.gotAway += 1;
        else stats.busted += 1;
      } else if (record.outcome === 'caught') {
        stats.caught += 1;
      }
      const vote = record.votes[name];
      if (vote && imposters.has(key(vote))) stats.sleuthed += 1;
    }
  }

  return [...byKey.values()];
}

export function totals(records: readonly RoundRecord[]): Totals {
  const days = new Set(records.map((r) => r.at.slice(0, 10)));
  return {
    rounds: records.length,
    caught: records.filter((r) => r.outcome === 'caught').length,
    gotAway: records.filter((r) => r.outcome === 'escaped').length,
    stolen: records.filter((r) => r.outcome === 'stolen').length,
    nights: days.size,
  };
}

export type Award = { title: string; emoji: string; name: string; detail: string };

/**
 * The bragging rights: the best liar (most times getting away or stealing, as
 * a share of their imposter rounds) and the best detective (most catches).
 * Needs a little history before it means anything.
 */
export function awards(stats: readonly PlayerStats[]): Award[] {
  const out: Award[] = [];

  const liars = stats
    .filter((s) => s.imposter >= 2)
    .map((s) => ({ s, wins: s.gotAway + s.stole, rate: (s.gotAway + s.stole) / s.imposter }))
    .filter((x) => x.wins > 0)
    .sort((a, b) => b.rate - a.rate || b.wins - a.wins);
  const liar = liars[0];
  if (liar) {
    out.push({
      title: 'Best liar',
      emoji: '🎭',
      name: liar.s.name,
      detail: `Got away ${liar.wins} of ${liar.s.imposter}`,
    });
  }

  const sleuths = stats
    .map((s) => ({ s, score: s.caught + s.sleuthed }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || b.s.sleuthed - a.s.sleuthed);
  const sleuth = sleuths[0];
  if (sleuth) {
    out.push({
      title: 'Best detective',
      emoji: '🕵️',
      name: sleuth.s.name,
      detail: `${sleuth.s.caught} ${sleuth.s.caught === 1 ? 'catch' : 'catches'}`,
    });
  }

  const thieves = stats.filter((s) => s.stole > 0).sort((a, b) => b.stole - a.stole);
  const thief = thieves[0];
  if (thief) {
    out.push({
      title: 'Word thief',
      emoji: '🧠',
      name: thief.name,
      detail: `Stole ${thief.stole} ${thief.stole === 1 ? 'word' : 'words'}`,
    });
  }

  return out;
}
