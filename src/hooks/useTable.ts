import { create } from 'zustand';
import { clampImposters } from '@/game/deal';
import { makePlayerId } from '@/game/ids';
import { addPlayer, movePlayer, removePlayer, renamePlayer } from '@/game/players';
import { DEFAULT_SETTINGS, type GameSettings, type Player } from '@/game/types';
import { parsePlayers, parseSettings } from '@/game/validate';
import { loadJSON, saveJSON } from '@/storage/kv';

/**
 * The table: who usually plays, in seating order, and the house rules. Saved,
 * so the same friends can start a game with one tap next time.
 */

const STORAGE_KEY = 'table.v1';

type Table = { players: Player[]; settings: GameSettings };

type TableStore = Table & {
  add(name: string): void;
  rename(id: string, name: string): void;
  remove(id: string): void;
  move(id: string, by: -1 | 1): void;
  setRule<K extends keyof GameSettings>(key: K, value: GameSettings[K]): void;
  toggleTopic(id: string): void;
  setTopics(ids: string[]): void;
};

function parse(raw: unknown): Table | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const v = raw as Record<string, unknown>;
  return { players: parsePlayers(v.players), settings: parseSettings(v.settings) };
}

/** Keeps the imposter count within what the table can take as players come and go. */
function fit(table: Table): Table {
  const imposters = clampImposters(table.settings.imposters, Math.max(3, table.players.length));
  return imposters === table.settings.imposters ? table : { ...table, settings: { ...table.settings, imposters } };
}

export const useTableStore = create<TableStore>((set, get) => {
  const commit = (next: Table) => {
    const fitted = fit(next);
    set(fitted);
    saveJSON(STORAGE_KEY, { players: fitted.players, settings: fitted.settings });
  };
  const table = (): Table => ({ players: get().players, settings: get().settings });

  return {
    ...loadJSON(STORAGE_KEY, parse, { players: [], settings: { ...DEFAULT_SETTINGS } }),

    add(name) {
      commit({ ...table(), players: addPlayer(get().players, name, makePlayerId()) });
    },
    rename(id, name) {
      commit({ ...table(), players: renamePlayer(get().players, id, name) });
    },
    remove(id) {
      commit({ ...table(), players: removePlayer(get().players, id) });
    },
    move(id, by) {
      commit({ ...table(), players: movePlayer(get().players, id, by) });
    },
    setRule(key, value) {
      commit({ ...table(), settings: { ...get().settings, [key]: value } });
    },
    toggleTopic(id) {
      const ids = get().settings.topicIds;
      const next = ids.includes(id) ? ids.filter((t) => t !== id) : [...ids, id];
      commit({ ...table(), settings: { ...get().settings, topicIds: next } });
    },
    setTopics(ids) {
      commit({ ...table(), settings: { ...get().settings, topicIds: ids } });
    },
  };
});
