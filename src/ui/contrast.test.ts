import { contrastRatio, textOn } from './contrast';
import { inkOn, palette, themes, topicColors } from './tokens';

/**
 * The design system's contrast promises, checked against the real tokens so a
 * colour tweak can't quietly break one.
 */
describe('contrast', () => {
  it.each(Object.entries(topicColors))('text on %s reads at 4.5:1 and matches inkOn', (key, fill) => {
    const ink = inkOn(key as keyof typeof topicColors);
    expect(contrastRatio(fill, ink)).toBeGreaterThanOrEqual(4.5);
    expect(textOn(fill)).toBe(ink);
  });

  it.each(['dark', 'light'] as const)('%s theme: text and muted text read on every surface', (name) => {
    const t = themes[name];
    for (const ground of [t.background, t.surface, t.surfaceRaised]) {
      expect(contrastRatio(t.text, ground)).toBeGreaterThanOrEqual(7);
      expect(contrastRatio(t.textMuted, ground)).toBeGreaterThanOrEqual(4.5);
    }
    expect(contrastRatio(t.brandText, t.background)).toBeGreaterThanOrEqual(4.5);
  });

  it('verdict fills and the lime button carry ink', () => {
    const { ink } = themes.dark;
    expect(contrastRatio(palette.lime, ink)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(palette.blue, ink)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(palette.red, ink)).toBeGreaterThanOrEqual(4.5);
  });

  it('never makes a verdict colour a topic colour', () => {
    const topics = Object.values(topicColors);
    expect(topics).not.toContain(palette.red);
    expect(topics).not.toContain(palette.blue);
  });
});
