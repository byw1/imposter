/**
 * The shape of a game.
 *
 * A session is one night at one table: a fixed set of players, house rules,
 * and the rounds played so far. A round is one secret word: who was the
 * imposter, who the table voted for, and how it ended.
 */

/** A topic colour key. Players and topics share one list; see TOPIC_COLORS. */
export type TopicColor = 'purple' | 'teal' | 'yellow' | 'orange' | 'indigo' | 'magenta';

export const TOPIC_COLOR_KEYS: readonly TopicColor[] = ['purple', 'teal', 'yellow', 'orange', 'indigo', 'magenta'];

export type Player = {
  id: string;
  name: string;
  color: TopicColor;
};

export type Topic = {
  id: string;
  name: string;
  emoji: string;
  color: TopicColor;
  words: string[];
  /** Bundled with the app. Custom topics are the ones a person made. */
  builtIn: boolean;
};

export type Role = 'in' | 'imposter';

/**
 * How the table votes. `point`: everyone points on three and the host taps
 * whoever got the most fingers. `secret`: the phone goes round and each player
 * votes privately.
 */
export type VoteMode = 'point' | 'secret';

/** A fixed number of imposters, or a surprise nobody (the host included) knows. */
export type ImposterSetting = 1 | 2 | 3 | 'surprise';

export type GameSettings = {
  imposters: ImposterSetting;
  /** Whether imposters see the topic. Off is hard mode. */
  hint: boolean;
  /** How many times the clues go round the table. */
  clueRounds: number;
  /** Discussion length in seconds. 0 skips the timer. */
  talkSeconds: number;
  voteMode: VoteMode;
  /** Topics the round picks from. Empty means every topic. */
  topicIds: string[];
};

export const DEFAULT_SETTINGS: GameSettings = {
  imposters: 1,
  hint: true,
  clueRounds: 2,
  talkSeconds: 90,
  voteMode: 'point',
  topicIds: [],
};

export const CLUE_ROUND_CHOICES = [1, 2, 3] as const;
export const TALK_CHOICES = [0, 60, 90, 120, 180] as const;

export const MIN_PLAYERS = 3;
export const MAX_PLAYERS = 12;
export const MAX_NAME_LENGTH = 16;
/** A topic needs enough words to deal a fresh one most rounds and offer decoys. */
export const MIN_TOPIC_WORDS = 8;

/**
 * Caught: the table voted out an imposter, who then guessed wrong.
 * Escaped: the table voted out someone who was in.
 * Stolen: the table caught an imposter, who then guessed the word.
 */
export type Outcome = 'caught' | 'escaped' | 'stolen';

export type Round = {
  id: string;
  /** 1-based, in the order played. */
  number: number;
  topicId: string;
  topicName: string;
  topicEmoji: string;
  topicColor: TopicColor;
  word: string;
  imposterIds: string[];
  /** Clue order: every player once, starting from a random seat. */
  order: string[];
  /** Secret votes, voter id to suspect id. Empty in point mode. */
  votes: Record<string, string>;
  /** Who the table voted out. */
  accusedId: string | null;
  /** The caught imposter's guess at the word. */
  guess: string | null;
  outcome: Outcome | null;
  /** Points each player earned this round. */
  points: Record<string, number>;
  startedAt: string;
  endedAt: string | null;
};

export type Session = {
  id: string;
  createdAt: string;
  players: Player[];
  settings: GameSettings;
  rounds: Round[];
  /** Words already dealt tonight, so a word doesn't come back until a topic runs dry. */
  usedWords: string[];
};
