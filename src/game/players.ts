import { MAX_NAME_LENGTH, MAX_PLAYERS, TOPIC_COLOR_KEYS, type Player, type TopicColor } from './types';

/**
 * The roster: who is at the table, in seating order.
 *
 * Names are trimmed and must be unique (ignoring case), because a name is
 * how the table tells players apart on the hand-off and in the vote. Colours
 * are dealt in join order from the topic colours, never red or blue, which
 * belong to the verdict.
 */

export function cleanName(raw: string): string {
  return raw.replace(/\s+/g, ' ').trim().slice(0, MAX_NAME_LENGTH);
}

export type NameProblem = 'empty' | 'taken' | 'full';

/** Why a name can't join, or null if it can. `except` lets a player keep their own name on rename. */
export function nameProblem(raw: string, players: readonly Player[], except?: string): NameProblem | null {
  const name = cleanName(raw);
  if (!name) return 'empty';
  const key = name.toLocaleLowerCase();
  if (players.some((p) => p.id !== except && p.name.toLocaleLowerCase() === key)) return 'taken';
  if (except === undefined && players.length >= MAX_PLAYERS) return 'full';
  return null;
}

/** The colour the next player gets: the least used, earliest in the list. */
export function nextColor(players: readonly Pick<Player, 'color'>[]): TopicColor {
  const counts = new Map<TopicColor, number>(TOPIC_COLOR_KEYS.map((c) => [c, 0]));
  for (const p of players) counts.set(p.color, (counts.get(p.color) ?? 0) + 1);
  let best: TopicColor = TOPIC_COLOR_KEYS[0]!;
  for (const c of TOPIC_COLOR_KEYS) if ((counts.get(c) ?? 0) < (counts.get(best) ?? 0)) best = c;
  return best;
}

export function addPlayer(players: readonly Player[], raw: string, id: string): Player[] {
  if (nameProblem(raw, players) !== null) return [...players];
  return [...players, { id, name: cleanName(raw), color: nextColor(players) }];
}

export function renamePlayer(players: readonly Player[], id: string, raw: string): Player[] {
  if (nameProblem(raw, players, id) !== null) return [...players];
  return players.map((p) => (p.id === id ? { ...p, name: cleanName(raw) } : p));
}

export function removePlayer(players: readonly Player[], id: string): Player[] {
  return players.filter((p) => p.id !== id);
}

/** Moves a player one seat earlier (-1) or later (+1). */
export function movePlayer(players: readonly Player[], id: string, by: -1 | 1): Player[] {
  const from = players.findIndex((p) => p.id === id);
  const to = from + by;
  if (from < 0 || to < 0 || to >= players.length) return [...players];
  const next = [...players];
  [next[from], next[to]] = [next[to]!, next[from]!];
  return next;
}

/** The first letter of a name, for the sticker disc. */
export function initial(name: string): string {
  // A quick-start player wears their number: "Player 3" is 3, not P.
  const numbered = QUICK_NAME.exec(name.trim());
  if (numbered) return numbered[1]!;
  return [...name.trim()][0]?.toLocaleUpperCase() ?? '?';
}

/** The names a quick start gives: Player 1, Player 2… */
const QUICK_NAME = /^Player (\d{1,2})$/;

/**
 * A table of `count` numbered players, for starting without typing a name.
 * They can be renamed any time; the numbers just keep the hand-off clear.
 */
export function quickTable(count: number, makeId: () => string): Player[] {
  let players: Player[] = [];
  for (let n = 1; n <= count; n++) players = addPlayer(players, `Player ${n}`, makeId());
  return players;
}

/** A tilt between -10 and 10 degrees, fixed per player so a sticker never jumps. */
export function tiltFor(id: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < id.length; i += 1) {
    hash ^= id.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return ((hash >>> 0) % 21) - 10;
}
