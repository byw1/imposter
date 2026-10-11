import { dealRound, guessMatches, isImposter } from './deal';
import type { Random } from './random';
import { outcomeOfVote, roundPoints } from './scoring';
import type { GameSettings, Outcome, Player, Round, Session, Topic } from './types';

/**
 * A night of play as pure transitions: start a session, deal a round, record
 * the vote and the guess, and close the round with its points. Each returns a
 * new session; nothing is mutated, so the store can save every step and a
 * resumed game picks up exactly where it was.
 */

export function startSession(players: readonly Player[], settings: GameSettings, id: string, now: string): Session {
  return { id, createdAt: now, players: [...players], settings: { ...settings }, rounds: [], usedWords: [] };
}

/** The round being played, if one is open. */
export function currentRound(session: Pick<Session, 'rounds'>): Round | null {
  const last = session.rounds[session.rounds.length - 1];
  return last && last.outcome === null ? last : null;
}

/** The latest round, open or finished. */
export function latestRound(session: Pick<Session, 'rounds'>): Round | null {
  return session.rounds[session.rounds.length - 1] ?? null;
}

/** Deals the next round and opens it. Any open round is replaced. */
export function beginRound(session: Session, topics: readonly Topic[], random: Random, id: string, now: string): Session {
  const finished = session.rounds.filter((r) => r.outcome !== null);
  const deal = dealRound(session, topics, random);
  const round: Round = { ...deal, id, number: finished.length + 1, startedAt: now };
  return { ...session, rounds: [...finished, round], usedWords: [...session.usedWords, deal.word] };
}

function updateOpen(session: Session, change: (round: Round) => Round): Session {
  const open = currentRound(session);
  if (!open) return session;
  return { ...session, rounds: session.rounds.map((r) => (r.id === open.id ? change(r) : r)) };
}

export function castVote(session: Session, voterId: string, suspectId: string): Session {
  return updateOpen(session, (r) => ({ ...r, votes: { ...r.votes, [voterId]: suspectId } }));
}

/** Clears secret votes, for a revote. */
export function clearVotes(session: Session): Session {
  return updateOpen(session, (r) => ({ ...r, votes: {} }));
}

export function accuse(session: Session, accusedId: string | null): Session {
  return updateOpen(session, (r) => ({ ...r, accusedId }));
}

/** Whether the accused player is an imposter: the round goes on to their guess. */
export function needsGuess(session: Session): boolean {
  const open = currentRound(session);
  return Boolean(open && open.accusedId && isImposter(open, open.accusedId));
}

/** Closes the open round with an outcome, and scores it. */
export function finishRound(session: Session, outcome: Outcome, guess: string | null, now: string): Session {
  return updateOpen(session, (r) => ({
    ...r,
    outcome,
    guess,
    endedAt: now,
    points: roundPoints(r, session.players, outcome),
  }));
}

/** Ends the round straight from the vote when nobody guessed: an innocent voted out, or a deadlock. */
export function finishFromVote(session: Session, now: string): Session {
  const open = currentRound(session);
  if (!open) return session;
  return finishRound(session, outcomeOfVote(open, open.accusedId), null, now);
}

/** Closes the round with the caught imposter's guess: right steals it, wrong is caught. */
export function finishWithGuess(session: Session, guess: string, now: string): Session {
  const open = currentRound(session);
  if (!open) return session;
  return finishRound(session, guessMatches(guess, open.word) ? 'stolen' : 'caught', guess, now);
}
