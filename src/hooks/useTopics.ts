import { useMemo } from 'react';
import { create } from 'zustand';
import type { Topic } from '@/game/types';
import { parseTopics } from '@/game/validate';
import { loadJSON, saveJSON } from '@/storage/kv';
import { BUNDLED_TOPICS } from '@/topics/bundled';

/**
 * Topics: the bundled ones, plus any the players made themselves. Custom
 * topics are saved on the phone and never leave it.
 */

const STORAGE_KEY = 'topics.v1';

type TopicsStore = {
  custom: Topic[];
  save(topic: Topic): void;
  remove(id: string): void;
};

export const useTopicsStore = create<TopicsStore>((set, get) => ({
  custom: loadJSON(STORAGE_KEY, parseTopics, []),

  save(topic) {
    const custom = get().custom;
    const exists = custom.some((t) => t.id === topic.id);
    const next = exists ? custom.map((t) => (t.id === topic.id ? { ...topic, builtIn: false } : t)) : [...custom, { ...topic, builtIn: false }];
    set({ custom: next });
    saveJSON(STORAGE_KEY, next);
  },

  remove(id) {
    const next = get().custom.filter((t) => t.id !== id);
    set({ custom: next });
    saveJSON(STORAGE_KEY, next);
  },
}));

/** Every topic, bundled first, then custom ones in the order they were made. */
export function useAllTopics(): Topic[] {
  const custom = useTopicsStore((s) => s.custom);
  return useMemo(() => [...BUNDLED_TOPICS, ...custom], [custom]);
}

export function allTopics(): Topic[] {
  return [...BUNDLED_TOPICS, ...useTopicsStore.getState().custom];
}
