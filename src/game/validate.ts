import {
  DEFAULT_SETTINGS,
  MAX_PLAYERS,
  TOPIC_COLOR_KEYS,
  type GameSettings,
  type Player,
  type Round,
  type Session,
  type Topic,
  type TopicColor,
} from './types';
import type { RoundRecord } from './stats';

/**
 * Checks for anything read back from the phone's storage. A value written by
 * an older build, or damaged, is repaired where it can be and dropped where it
 * can't, so a bad save never crashes the app at launch.
 */

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const isString = (v: unknown): v is string => typeof v === 'string';
const isColor = (v: unknown): v is TopicColor => TOPIC_COLOR_KEYS.includes(v as TopicColor);

export function parsePlayer(v: unknown): Player | null {
  if (!isObject(v) || !isString(v.id) || !isString(v.name) || !v.name.trim()) return null;
  return { id: v.id, name: v.name, color: isColor(v.color) ? v.color : 'purple' };
}

export function parsePlayers(v: unknown): Player[] {
  if (!Array.isArray(v)) return [];
  const seen = new Set<string>();
  const out: Player[] = [];
  for (const item of v) {
    const p = parsePlayer(item);
    if (!p || seen.has(p.id)) continue;
    seen.add(p.id);
    out.push(p);
    if (out.length >= MAX_PLAYERS) break;
  }
  return out;
}

export function parseSettings(v: unknown): GameSettings {
  if (!isObject(v)) return { ...DEFAULT_SETTINGS };
  const imposters = v.imposters === 'surprise' || v.imposters === 1 || v.imposters === 2 || v.imposters === 3 ? v.imposters : 1;
  const clueRounds = typeof v.clueRounds === 'number' && v.clueRounds >= 1 && v.clueRounds <= 3 ? Math.round(v.clueRounds) : 2;
  const talkSeconds = typeof v.talkSeconds === 'number' && v.talkSeconds >= 0 && v.talkSeconds <= 600 ? Math.round(v.talkSeconds) : 90;
  return {
    imposters,
    hint: typeof v.hint === 'boolean' ? v.hint : true,
    clueRounds,
    talkSeconds,
    voteMode: v.voteMode === 'secret' ? 'secret' : 'point',
    topicIds: Array.isArray(v.topicIds) ? v.topicIds.filter(isString) : [],
  };
}

export function parseTopic(v: unknown): Topic | null {
  if (!isObject(v) || !isString(v.id) || !isString(v.name) || !Array.isArray(v.words)) return null;
  return {
    id: v.id,
    name: v.name,
    emoji: isString(v.emoji) && v.emoji ? v.emoji : '🎲',
    color: isColor(v.color) ? v.color : 'purple',
    words: v.words.filter(isString),
    builtIn: false,
  };
}

export function parseTopics(v: unknown): Topic[] {
  if (!Array.isArray(v)) return [];
  return v.flatMap((t) => parseTopic(t) ?? []);
}

function parseRound(v: unknown): Round | null {
  if (!isObject(v) || !isString(v.id) || !isString(v.word) || !Array.isArray(v.imposterIds) || !Array.isArray(v.order)) {
    return null;
  }
  const outcome = v.outcome === 'caught' || v.outcome === 'escaped' || v.outcome === 'stolen' ? v.outcome : null;
  const record = (x: unknown): Record<string, string> =>
    isObject(x) ? Object.fromEntries(Object.entries(x).filter((e): e is [string, string] => isString(e[1]))) : {};
  const points = isObject(v.points)
    ? Object.fromEntries(Object.entries(v.points).filter((e): e is [string, number] => typeof e[1] === 'number'))
    : {};
  return {
    id: v.id,
    number: typeof v.number === 'number' ? v.number : 1,
    topicId: isString(v.topicId) ? v.topicId : '',
    topicName: isString(v.topicName) ? v.topicName : '',
    topicEmoji: isString(v.topicEmoji) ? v.topicEmoji : '🎲',
    topicColor: isColor(v.topicColor) ? v.topicColor : 'purple',
    word: v.word,
    imposterIds: v.imposterIds.filter(isString),
    order: v.order.filter(isString),
    votes: record(v.votes),
    accusedId: isString(v.accusedId) ? v.accusedId : null,
    guess: isString(v.guess) ? v.guess : null,
    outcome,
    points,
    startedAt: isString(v.startedAt) ? v.startedAt : new Date(0).toISOString(),
    endedAt: isString(v.endedAt) ? v.endedAt : null,
  };
}

export function parseSession(v: unknown): Session | null {
  if (!isObject(v) || !isString(v.id)) return null;
  const players = parsePlayers(v.players);
  if (players.length < 3) return null;
  const rounds = Array.isArray(v.rounds) ? v.rounds.flatMap((r) => parseRound(r) ?? []) : [];
  return {
    id: v.id,
    createdAt: isString(v.createdAt) ? v.createdAt : new Date(0).toISOString(),
    players,
    settings: parseSettings(v.settings),
    rounds,
    usedWords: Array.isArray(v.usedWords) ? v.usedWords.filter(isString) : [],
  };
}

export function parseRecords(v: unknown): RoundRecord[] {
  if (!Array.isArray(v)) return [];
  return v.flatMap((r) => {
    if (!isObject(r) || !isString(r.at) || !Array.isArray(r.players) || !Array.isArray(r.imposters)) return [];
    if (r.outcome !== 'caught' && r.outcome !== 'escaped' && r.outcome !== 'stolen') return [];
    return [
      {
        at: r.at,
        word: isString(r.word) ? r.word : '',
        topic: isString(r.topic) ? r.topic : '',
        outcome: r.outcome,
        players: r.players.filter(isString),
        imposters: r.imposters.filter(isString),
        accused: isString(r.accused) ? r.accused : null,
        votes: isObject(r.votes)
          ? Object.fromEntries(Object.entries(r.votes).filter((e): e is [string, string] => isString(e[1])))
          : {},
      },
    ];
  });
}
