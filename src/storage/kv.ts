import Storage from 'expo-sqlite/kv-store';

/**
 * Small JSON values on the phone, through expo-sqlite's key-value store.
 *
 * Reads are synchronous so the first render already has the saved state and
 * nothing flickers from a default. Writes are fire-and-forget: a failed save
 * is retried by the next one, and never breaks a round.
 */

export function loadJSON<T>(key: string, parse: (raw: unknown) => T | null, fallback: T): T {
  try {
    const raw = Storage.getItemSync(key);
    if (!raw) return fallback;
    return parse(JSON.parse(raw)) ?? fallback;
  } catch {
    return fallback;
  }
}

export function saveJSON(key: string, value: unknown): void {
  try {
    void Storage.setItem(key, JSON.stringify(value)).catch(() => undefined);
  } catch {
    // Nothing to do: the next save tries again.
  }
}

export function saveJSONSync(key: string, value: unknown): void {
  try {
    Storage.setItemSync(key, JSON.stringify(value));
  } catch {
    // As above.
  }
}

export function removeKey(key: string): void {
  try {
    void Storage.removeItem(key).catch(() => undefined);
  } catch {
    // As above.
  }
}
