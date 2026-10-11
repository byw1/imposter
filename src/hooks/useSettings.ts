import { reloadAppAsync } from 'expo';
import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { loadJSON, saveJSON, saveJSONSync } from '@/storage/kv';
import type { ThemeChoice } from '@/ui/tokens';

/**
 * App preferences: about the phone and the people holding it, as opposed to
 * the house rules for a game, which live with the table (useTable).
 */
export type Settings = {
  haptics: boolean;
  sound: boolean;
  theme: ThemeChoice;
  /** Whether the first-launch how-to-play has been seen. */
  onboarded: boolean;
};

export const defaultAppSettings: Settings = {
  haptics: true,
  sound: true,
  theme: 'dark',
  onboarded: false,
};

const STORAGE_KEY = 'settings.v1';
const KEYS = Object.keys(defaultAppSettings) as (keyof Settings)[];
const THEMES: readonly ThemeChoice[] = ['dark', 'light', 'system'];

function parse(raw: unknown): Settings | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const stored = raw as Partial<Record<keyof Settings, unknown>>;
  const out: Record<string, unknown> = { ...defaultAppSettings };
  for (const key of KEYS) {
    if (typeof stored[key] === typeof defaultAppSettings[key]) out[key] = stored[key];
  }
  const settings = out as Settings;
  if (!THEMES.includes(settings.theme)) settings.theme = defaultAppSettings.theme;
  return settings;
}

function pick(settings: Settings): Settings {
  const out: Record<string, unknown> = {};
  for (const key of KEYS) out[key] = settings[key];
  return out as Settings;
}

type SettingsStore = Settings & {
  set<K extends keyof Settings>(key: K, value: Settings[K]): void;
  /** Styles are built for one theme at load, so a new theme saves and reloads the app. */
  setTheme(theme: ThemeChoice): void;
  resetAll(): void;
};

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  ...loadJSON(STORAGE_KEY, parse, defaultAppSettings),

  set(key, value) {
    set({ [key]: value } as Pick<Settings, typeof key>);
    saveJSON(STORAGE_KEY, pick(get()));
  },

  setTheme(theme) {
    set({ theme });
    saveJSONSync(STORAGE_KEY, pick(get()));
    void reloadAppAsync('Theme changed').catch(() => undefined);
  },

  resetAll() {
    const next = { ...defaultAppSettings, onboarded: get().onboarded, theme: get().theme };
    set(next);
    saveJSON(STORAGE_KEY, pick(next));
  },
}));

export function useSettings(): Settings {
  return useSettingsStore(useShallow(pick));
}
