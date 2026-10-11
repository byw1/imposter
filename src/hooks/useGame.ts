import { create } from 'zustand';
import { makeRoundId, makeSessionId } from '@/game/ids';
import {
  accuse,
  beginRound,
  castVote,
  clearVotes,
  finishFromVote,
  finishWithGuess,
  latestRound,
  needsGuess,
  startSession,
} from '@/game/session';
import { recordRound } from '@/game/stats';
import type { GameSettings, Player, Round, Session } from '@/game/types';
import { parseSession } from '@/game/validate';
import { loadJSON, removeKey, saveJSON } from '@/storage/kv';
import { useHistoryStore } from './useHistory';
import { allTopics } from './useTopics';

/**
 * The game in progress.
 *
 * The round moves through phases, one screen each:
 *   deal → vote → reveal → guess → verdict → recap
 * Clues and talking happen out loud at the end of the deal, on one screen,
 * with nothing to tap; reveal and guess only happen when someone was voted
 * out. The phase and its progress are saved with the session at every step,
 * so a phone that dies mid-round, or an app swiped away, picks up on the same
 * screen.
 */

export type Phase = 'deal' | 'vote' | 'reveal' | 'guess' | 'verdict' | 'recap';

const PHASES: readonly Phase[] = ['deal', 'vote', 'reveal', 'guess', 'verdict', 'recap'];

/** Phases from before clues and talk folded into the deal. A game saved in one resumes at the clues. */
const OLD_PHASES = ['clues', 'talk'];

export type Progress = {
  phase: Phase;
  /** Deal: whose turn it is to peek, by seat. Past the last seat, everyone has seen theirs. */
  dealIndex: number;
  /** Secret vote: whose turn it is to vote, by seat. */
  voterIndex: number;
  /** Secret vote: who can be voted for. All players, or the tied ones on a revote. */
  candidates: string[] | null;
  revote: boolean;
};

const START: Progress = {
  phase: 'deal',
  dealIndex: 0,
  voterIndex: 0,
  candidates: null,
  revote: false,
};

type GameStore = Progress & {
  session: Session | null;

  /** Starts a new night with these players and rules, and deals the first round. */
  start(players: readonly Player[], settings: GameSettings): void;
  /** Deals the next round with the same table. */
  nextRound(): void;
  /** Ends the night. Finished rounds are already in the history. */
  end(): void;

  go(phase: Phase): void;
  /** The next player peeks. */
  advanceDeal(): void;
  /** Jumps the phone to a player, for a second look. */
  setDealIndex(index: number): void;

  vote(voterId: string, suspectId: string): void;
  nextVoter(): void;
  revoteBetween(ids: string[]): void;
  /** The table's decision. Null is a deadlock. */
  accuse(playerId: string | null): void;
  /** After the reveal: the imposter guesses, or the round is over. */
  afterReveal(): void;
  guess(word: string): void;
};

const STORAGE_KEY = 'game.v1';

type Saved = Progress & { session: Session };

function parse(raw: unknown): Saved | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const v = raw as Record<string, unknown>;
  const session = parseSession(v.session);
  if (!session) return null;
  const num = (x: unknown) => (typeof x === 'number' && Number.isFinite(x) && x >= 0 ? Math.floor(x) : 0);
  const old = OLD_PHASES.includes(v.phase as string);
  return {
    session,
    phase: PHASES.includes(v.phase as Phase) ? (v.phase as Phase) : 'deal',
    dealIndex: old ? session.players.length : num(v.dealIndex),
    voterIndex: num(v.voterIndex),
    candidates: Array.isArray(v.candidates) ? v.candidates.filter((c): c is string => typeof c === 'string') : null,
    revote: v.revote === true,
  };
}

const now = () => new Date().toISOString();

export const useGameStore = create<GameStore>((set, get) => {
  const saved = loadJSON<Saved | null>(STORAGE_KEY, parse, null);

  const persist = () => {
    const { session, phase, dealIndex, voterIndex, candidates, revote } = get();
    if (!session) {
      removeKey(STORAGE_KEY);
      return;
    }
    saveJSON(STORAGE_KEY, { session, phase, dealIndex, voterIndex, candidates, revote });
  };

  const commit = (patch: Partial<GameStore>) => {
    set(patch);
    persist();
  };

  /** Records a round that just finished into the history. */
  const archive = (session: Session) => {
    const last = latestRound(session);
    if (!last || !last.outcome) return;
    const record = recordRound(last, session);
    if (record) useHistoryStore.getState().add(record);
  };

  return {
    ...START,
    session: null,
    ...(saved ?? {}),

    start(players, settings) {
      const fresh = startSession(players, settings, makeSessionId(), now());
      const session = beginRound(fresh, allTopics(), Math.random, makeRoundId(), now());
      commit({ ...START, session });
    },

    nextRound() {
      const session = get().session;
      if (!session) return;
      commit({ ...START, session: beginRound(session, allTopics(), Math.random, makeRoundId(), now()) });
    },

    end() {
      set({ ...START, session: null });
      persist();
    },

    go(phase) {
      commit({ phase });
    },

    advanceDeal() {
      commit({ dealIndex: get().dealIndex + 1 });
    },

    setDealIndex(index) {
      commit({ dealIndex: Math.max(0, index) });
    },

    vote(voterId, suspectId) {
      const session = get().session;
      if (!session) return;
      commit({ session: castVote(session, voterId, suspectId) });
    },

    nextVoter() {
      commit({ voterIndex: get().voterIndex + 1 });
    },

    revoteBetween(ids) {
      const session = get().session;
      if (!session) return;
      commit({ session: clearVotes(session), candidates: ids, revote: true, voterIndex: 0 });
    },

    accuse(playerId) {
      const session = get().session;
      if (!session) return;
      const accused = accuse(session, playerId);
      if (playerId === null) {
        // Nobody agreed: the imposters slip away.
        const done = finishFromVote(accused, now());
        archive(done);
        commit({ session: done, phase: 'verdict' });
        return;
      }
      commit({ session: accused, phase: 'reveal' });
    },

    afterReveal() {
      const session = get().session;
      if (!session) return;
      if (needsGuess(session)) {
        commit({ phase: 'guess' });
        return;
      }
      const done = finishFromVote(session, now());
      archive(done);
      commit({ session: done, phase: 'verdict' });
    },

    guess(word) {
      const session = get().session;
      if (!session) return;
      const done = finishWithGuess(session, word, now());
      archive(done);
      commit({ session: done, phase: 'verdict' });
    },
  };
});

/** The round on screen: the open one, or the one that just finished. */
export function useRound(): Round | null {
  return useGameStore((s) => (s.session ? latestRound(s.session) : null));
}

/** The route for each phase. */
export const PHASE_ROUTES: Record<Phase, '/round/deal' | '/round/vote' | '/round/reveal' | '/round/guess' | '/round/verdict' | '/round/recap'> = {
  deal: '/round/deal',
  vote: '/round/vote',
  reveal: '/round/reveal',
  guess: '/round/guess',
  verdict: '/round/verdict',
  recap: '/round/recap',
};
