import { create } from 'zustand';
import type { RoundRecord } from '@/game/stats';
import { parseRecords } from '@/game/validate';
import { loadJSON, saveJSON } from '@/storage/kv';

/**
 * Every finished round, kept small, for the stats on the You page. Capped so
 * years of game nights never slow the app down.
 */

const STORAGE_KEY = 'history.v1';
const MAX_RECORDS = 2000;

type HistoryStore = {
  records: RoundRecord[];
  add(record: RoundRecord): void;
  clear(): void;
};

export const useHistoryStore = create<HistoryStore>((set, get) => ({
  records: loadJSON(STORAGE_KEY, parseRecords, []),

  add(record) {
    const next = [...get().records, record].slice(-MAX_RECORDS);
    set({ records: next });
    saveJSON(STORAGE_KEY, next);
  },

  clear() {
    set({ records: [] });
    saveJSON(STORAGE_KEY, []);
  },
}));
