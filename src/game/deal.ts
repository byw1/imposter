import { shuffle, type Random } from './random';
import type { GameSettings, ImposterSetting, Player, Round, Session, Topic } from './types';

/**
 * Dealing a round: a topic, a secret word, the imposters and the clue order.
 *
 * Everything here takes its randomness as an argument, so a test can deal the
 * same round twice and the app can deal a fresh one every time.
 */

/** The most imposters a table can have and still be a fair game. */
export function maxImposters(playerCount: number): 1 | 2 | 3 {
  if (playerCount >= 8) return 3;
  if (playerCount >= 5) return 2;
  return 1;
}

/** The imposter setting, held to what this table can take. */
export function clampImposters(setting: ImposterSetting, playerCount: number): ImposterSetting {
  if (setting === 'surprise') return setting;
  return Math.min(setting, maxImposters(playerCount)) as 1 | 2 | 3;
}

/**
 * How many imposters this round actually gets. A surprise is one most of the
 * time and more only now and then, so nobody can count on a second liar.
 */
export function imposterCount(setting: ImposterSetting, playerCount: number, random: Random): number {
  const max = maxImposters(playerCount);
  if (setting !== 'surprise') return Math.min(setting, max);
  const roll = random();
  if (max >= 3 && roll > 0.85) return 3;
  if (max >= 2 && roll > 0.6) return 2;
  return 1;
}

/** The topics a round can pick from: the chosen ones, or all of them. */
export function eligibleTopics(topics: readonly Topic[], settings: Pick<GameSettings, 'topicIds'>): Topic[] {
  const chosen = topics.filter((t) => settings.topicIds.includes(t.id) && playableWords(t).length > 0);
  if (chosen.length > 0) return chosen;
  return topics.filter((t) => playableWords(t).length > 0);
}

/** A topic's words, trimmed, de-duplicated and without blanks. */
export function playableWords(topic: Pick<Topic, 'words'>): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of topic.words) {
    const word = raw.trim();
    const key = word.toLocaleLowerCase();
    if (!word || seen.has(key)) continue;
    seen.add(key);
    out.push(word);
  }
  return out;
}

export type Deal = Omit<Round, 'number' | 'id' | 'startedAt'>;

/**
 * Deals the next round.
 *
 * The word is one nobody has seen tonight, unless every word in the chosen
 * topics has been used, in which case the night starts over. The clue order
 * keeps the table's seating and starts from a random seat, so going first is
 * never a tell.
 */
export function dealRound(
  session: Pick<Session, 'players' | 'settings' | 'usedWords'>,
  topics: readonly Topic[],
  random: Random,
): Deal {
  const pool = eligibleTopics(topics, session.settings);
  if (pool.length === 0) throw new Error('No topic has any words to deal.');
  if (session.players.length < 2) throw new Error('A round needs players.');

  const used = new Set(session.usedWords.map((w) => w.toLocaleLowerCase()));
  const fresh = pool
    .map((topic) => ({ topic, words: playableWords(topic).filter((w) => !used.has(w.toLocaleLowerCase())) }))
    .filter((entry) => entry.words.length > 0);
  // Every word has been dealt: start the night's list again.
  const candidates = fresh.length > 0 ? fresh : pool.map((topic) => ({ topic, words: playableWords(topic) }));

  const entry = candidates[Math.floor(random() * candidates.length)]!;
  const word = entry.words[Math.floor(random() * entry.words.length)]!;

  const count = imposterCount(session.settings.imposters, session.players.length, random);
  const imposterIds = shuffle(session.players, random)
    .slice(0, count)
    .map((p) => p.id);

  const start = Math.floor(random() * session.players.length);
  const seats = session.players.map((p) => p.id);
  const order = [...seats.slice(start), ...seats.slice(0, start)];

  return {
    topicId: entry.topic.id,
    topicName: entry.topic.name,
    topicEmoji: entry.topic.emoji,
    topicColor: entry.topic.color,
    word,
    imposterIds,
    order,
    votes: {},
    accusedId: null,
    guess: null,
    outcome: null,
    points: {},
    endedAt: null,
  };
}

/** Whether this player is an imposter this round. */
export function isImposter(round: Pick<Round, 'imposterIds'>, playerId: string): boolean {
  return round.imposterIds.includes(playerId);
}

/**
 * The choices offered to a caught imposter: the secret word and decoys from
 * the same topic, shuffled. A pick from a list keeps the steal honest without
 * anyone having to judge a spoken guess, and decoys from the same topic keep it
 * hard: an imposter who listened will know; one who bluffed blind won't.
 */
export function guessChoices(word: string, topic: Pick<Topic, 'words'> | null, random: Random, count = 8): string[] {
  const key = word.toLocaleLowerCase();
  const others = topic ? playableWords(topic).filter((w) => w.toLocaleLowerCase() !== key) : [];
  const decoys = shuffle(others, random).slice(0, Math.max(0, count - 1));
  return shuffle([word, ...decoys], random);
}

/** Whether a guess names the secret word. Case and spacing don't count. */
export function guessMatches(guess: string, word: string): boolean {
  const norm = (s: string) => s.trim().replace(/\s+/g, ' ').toLocaleLowerCase();
  return norm(guess) === norm(word);
}

export function playerById(players: readonly Player[], id: string | null | undefined): Player | undefined {
  return id ? players.find((p) => p.id === id) : undefined;
}
