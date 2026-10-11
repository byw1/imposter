/**
 * Contrast helpers.
 *
 * Topic colours are the full-bleed face of every RoleCard, and players' sticker
 * discs come from the same list. Text on them is bone or ink, whichever reads
 * better: ink on every topic colour except indigo. A custom topic can only pick
 * from that list, but the maths is here so nothing has to be assumed.
 */

const BONE = '#FFFFFF';
const INK = '#0C0A10';

/** Parses #rgb or #rrggbb. Returns null on anything else. */
export function parseHexColor(hex: string): { r: number; g: number; b: number } | null {
  const match = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  if (!match) return null;

  const digits = match[1]!;
  const full =
    digits.length === 3
      ? digits
          .split('')
          .map((d) => d + d)
          .join('')
      : digits;

  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  };
}

/** WCAG 2.1 relative luminance, 0 (black) to 1 (white). */
export function relativeLuminance(hex: string): number {
  const rgb = parseHexColor(hex);
  if (!rgb) return 0;

  const channel = (value: number): number => {
    const s = value / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };

  return 0.2126 * channel(rgb.r) + 0.7152 * channel(rgb.g) + 0.0722 * channel(rgb.b);
}

/** WCAG 2.1 contrast ratio between two colours, 1 to 21. */
export function contrastRatio(a: string, b: string): number {
  const lumA = relativeLuminance(a);
  const lumB = relativeLuminance(b);
  const lighter = Math.max(lumA, lumB);
  const darker = Math.min(lumA, lumB);
  return (lighter + 0.05) / (darker + 0.05);
}

/** Bone or ink on the given colour, whichever has more contrast. */
export function textOn(background: string): string {
  return contrastRatio(background, BONE) > contrastRatio(background, INK) ? BONE : INK;
}
