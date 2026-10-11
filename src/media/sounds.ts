import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';

/**
 * Sound effects.
 *
 * Short sounds synthesised by spec/generate-sounds.js and bundled with the
 * app, so they play offline and instantly. Each gets one player, loaded once
 * and rewound to replay. They mix with music and respect the silent switch.
 *
 * The reveal sound is the same for every role: a different sound for the
 * imposter would tell the whole table.
 */

export type SoundName = 'tick' | 'reveal' | 'deal' | 'point' | 'lock' | 'drum' | 'caught' | 'escaped' | 'steal' | 'timeup';

const SOURCES: Record<SoundName, number> = {
  tick: require('../../assets/sounds/tick.wav') as number,
  reveal: require('../../assets/sounds/reveal.wav') as number,
  deal: require('../../assets/sounds/deal.wav') as number,
  point: require('../../assets/sounds/point.wav') as number,
  lock: require('../../assets/sounds/lock.wav') as number,
  drum: require('../../assets/sounds/drum.wav') as number,
  caught: require('../../assets/sounds/caught.wav') as number,
  escaped: require('../../assets/sounds/escaped.wav') as number,
  steal: require('../../assets/sounds/steal.wav') as number,
  timeup: require('../../assets/sounds/timeup.wav') as number,
};

const players = new Map<SoundName, AudioPlayer>();
let configured = false;

function playerFor(name: SoundName): AudioPlayer | null {
  const existing = players.get(name);
  if (existing) return existing;
  try {
    if (!configured) {
      configured = true;
      void setAudioModeAsync({ playsInSilentMode: false, interruptionMode: 'mixWithOthers' }).catch(() => undefined);
    }
    const player = createAudioPlayer(SOURCES[name]);
    player.volume = name === 'tick' || name === 'reveal' ? 0.6 : 0.9;
    players.set(name, player);
    return player;
  } catch {
    return null;
  }
}

export function preloadSounds(): void {
  for (const name of Object.keys(SOURCES) as SoundName[]) playerFor(name);
}

/** Plays a sound from the top. Fire and forget. */
export function playSound(name: SoundName): void {
  const player = playerFor(name);
  if (!player) return;
  try {
    void player
      .seekTo(0)
      .then(() => player.play())
      .catch(() => undefined);
  } catch {
    // It was only a sound.
  }
}
