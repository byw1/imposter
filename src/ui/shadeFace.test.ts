import { eyeParts, headParts, MASCOT_MOODS, mouthParts } from './shadeFace';

describe("Shade's face", () => {
  it.each(MASCOT_MOODS)('%s has eyes and a mouth, every number finite', (mood) => {
    for (const look of [-1, 0, 1]) {
      for (const blinking of [false, true]) {
        const parts = [...headParts(), ...eyeParts(mood, look, blinking), ...mouthParts(mood)];
        expect(eyeParts(mood, look, blinking).length).toBeGreaterThan(0);
        expect(mouthParts(mood).length).toBeGreaterThan(0);
        expect(JSON.stringify(parts)).not.toMatch(/NaN|Infinity|null/);
      }
    }
  });
});
