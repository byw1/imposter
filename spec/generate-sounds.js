/**
 * Synthesises the app's sound effects into assets/sounds as small WAV files.
 *
 * Generated rather than downloaded so every sound is ours, offline and free to
 * ship: a handful of tones, envelopes and a little noise. Run with
 * `node spec/generate-sounds.js` after changing anything here.
 */
const { Buffer } = require('buffer');
const fs = require('fs');
const path = require('path');

const RATE = 22050;
const OUT = path.join(__dirname, '..', 'assets', 'sounds');

/** A buffer of `seconds` of silence to mix into. */
const silence = (seconds) => new Float32Array(Math.round(seconds * RATE));

/** Adds a note: a few harmonics under an attack/decay envelope. */
function note(buf, { at = 0, freq, dur, gain = 0.5, attack = 0.005, harmonics = [1, 0.35, 0.12], slide = 0, shape = 'sine' }) {
  const start = Math.round(at * RATE);
  const length = Math.round(dur * RATE);
  for (let i = 0; i < length && start + i < buf.length; i++) {
    const t = i / RATE;
    const f = freq + slide * (t / dur);
    const env = Math.min(1, t / attack) * Math.exp((-4.5 * t) / dur);
    let v = 0;
    harmonics.forEach((h, k) => {
      const phase = 2 * Math.PI * f * (k + 1) * t;
      v += h * (shape === 'square' ? Math.sign(Math.sin(phase)) * 0.6 : Math.sin(phase));
    });
    buf[start + i] += v * env * gain;
  }
}

/** Filtered noise with a falling cutoff: a whoosh. */
function whoosh(buf, { at = 0, dur, gain = 0.5 }) {
  const start = Math.round(at * RATE);
  const length = Math.round(dur * RATE);
  let low = 0;
  let seed = 7;
  for (let i = 0; i < length && start + i < buf.length; i++) {
    const t = i / length;
    seed = (seed * 16807) % 2147483647;
    const noise = (seed / 2147483647) * 2 - 1;
    const cutoff = 0.35 * (1 - t) + 0.02;
    low += cutoff * (noise - low);
    const env = Math.sin(Math.PI * Math.min(1, t * 1.15)) ** 2;
    buf[start + i] += low * env * gain * 3;
  }
}

function writeWav(name, buf) {
  const peak = buf.reduce((m, v) => Math.max(m, Math.abs(v)), 0) || 1;
  const scale = 0.89 / peak;
  const data = Buffer.alloc(buf.length * 2);
  buf.forEach((v, i) => data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, v * scale)) * 32767), i * 2));

  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(1, 22); // mono
  header.writeUInt32LE(RATE, 24);
  header.writeUInt32LE(RATE * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(data.length, 40);

  fs.writeFileSync(path.join(OUT, `${name}.wav`), Buffer.concat([header, data]));
  console.log(`${name}.wav`.padEnd(14), `${((44 + data.length) / 1024).toFixed(1)} KB`);
}

fs.mkdirSync(OUT, { recursive: true });

// Tick: a soft wooden knock, for the next speaker and countdown beats.
{
  const b = silence(0.16);
  note(b, { freq: 740, dur: 0.12, gain: 0.45, harmonics: [1, 0.25] });
  note(b, { freq: 1480, dur: 0.05, gain: 0.12, harmonics: [1] });
  writeWav('tick', b);
}

// Reveal: a quiet shimmer as the card turns over. The same for every role.
{
  const b = silence(0.42);
  [1318.5, 1760, 2093].forEach((f, i) => note(b, { at: i * 0.045, freq: f, dur: 0.3, gain: 0.18, harmonics: [1, 0.15] }));
  whoosh(b, { dur: 0.22, gain: 0.25 });
  writeWav('reveal', b);
}

// Deal: a card flicked across the table.
{
  const b = silence(0.24);
  whoosh(b, { dur: 0.2, gain: 0.55 });
  note(b, { at: 0.14, freq: 260, dur: 0.07, gain: 0.25, harmonics: [1, 0.4] });
  writeWav('deal', b);
}

// Point: the "go" at the end of a countdown.
{
  const b = silence(0.4);
  note(b, { freq: 1046.5, dur: 0.36, gain: 0.5, harmonics: [1, 0.3, 0.1] });
  note(b, { freq: 1568, dur: 0.3, gain: 0.25, harmonics: [1] });
  writeWav('point', b);
}

// Lock: a vote landing, low and firm.
{
  const b = silence(0.3);
  note(b, { freq: 196, dur: 0.24, gain: 0.55, harmonics: [1, 0.5, 0.2] });
  note(b, { freq: 392, dur: 0.1, gain: 0.2, harmonics: [1] });
  writeWav('lock', b);
}

// Drum: a snare roll that builds, under the suspense before a role is shown.
{
  const b = silence(1.5);
  const hits = 26;
  for (let i = 0; i < hits; i++) {
    const t = 1.35 * Math.pow(i / hits, 0.8);
    whoosh(b, { at: t, dur: 0.06, gain: 0.25 + (i / hits) * 0.45 });
    note(b, { at: t, freq: 180, dur: 0.05, gain: 0.12 + (i / hits) * 0.2, harmonics: [1, 0.6] });
  }
  writeWav('drum', b);
}

// Caught: a bright fanfare for the table.
{
  const b = silence(1.3);
  [523.25, 659.25, 783.99].forEach((f, i) => note(b, { at: i * 0.09, freq: f, dur: 0.2, gain: 0.4 }));
  [1046.5, 1318.5, 1568].forEach((f) => note(b, { at: 0.3, freq: f, dur: 0.95, gain: 0.3 }));
  writeWav('caught', b);
}

// Escaped: a sly, sliding "wah-wah-wahhh" for the imposter getting away.
{
  const b = silence(1.4);
  note(b, { freq: 392, dur: 0.28, gain: 0.45, shape: 'square', harmonics: [1, 0.4, 0.2], slide: -20 });
  note(b, { at: 0.3, freq: 370, dur: 0.28, gain: 0.45, shape: 'square', harmonics: [1, 0.4, 0.2], slide: -20 });
  note(b, { at: 0.6, freq: 349, dur: 0.75, gain: 0.45, shape: 'square', harmonics: [1, 0.4, 0.2], slide: -60 });
  writeWav('escaped', b);
}

// Steal: a sneaky sparkle that runs up the scale.
{
  const b = silence(1.1);
  [587.33, 739.99, 880, 1174.66, 1479.98].forEach((f, i) => note(b, { at: i * 0.06, freq: f, dur: 0.25, gain: 0.32 }));
  note(b, { at: 0.36, freq: 1760, dur: 0.7, gain: 0.3, harmonics: [1, 0.2] });
  whoosh(b, { at: 0.3, dur: 0.4, gain: 0.3 });
  writeWav('steal', b);
}

// Time's up: a short buzzer as the talking stops.
{
  const b = silence(0.6);
  note(b, { freq: 220, dur: 0.55, gain: 0.45, attack: 0.01, shape: 'square', harmonics: [1, 0.6, 0.4, 0.2] });
  note(b, { freq: 233, dur: 0.55, gain: 0.3, attack: 0.01, shape: 'square', harmonics: [1, 0.5] });
  writeWav('timeup', b);
}
