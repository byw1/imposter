import { Text as RNText, type TextProps as RNTextProps, StyleSheet } from 'react-native';
import { color, type } from './tokens';

type Variant = keyof typeof type;
export type Tone = 'default' | 'muted' | 'faint' | 'inverse' | 'brand' | 'focus';

export type TextProps = RNTextProps & {
  variant?: Variant;
  tone?: Tone;
  align?: 'left' | 'center' | 'right';
};

const tones: Record<Tone, string> = {
  default: color.text,
  muted: color.textMuted,
  faint: color.textFaint,
  inverse: color.ink,
  brand: color.brandText,
  focus: color.focus,
};

/** Big type is already big: it barely scales, or it would push everything else off screen. */
const DISPLAY = new Set<Variant>(['hero', 'display', 'title', 'stat']);

/**
 * UI text. The secret word on a RoleCard is its own component, since it fits
 * the card rather than following the type scale.
 *
 * Dynamic Type stays on, capped so the largest accessibility sizes still fit a
 * pill button and a phone screen rather than breaking out of them.
 */
export function Text({ variant = 'body', tone = 'default', align, style, ...rest }: TextProps) {
  return (
    <RNText
      style={StyleSheet.compose([type[variant], { color: tones[tone] }, align ? { textAlign: align } : null], style)}
      maxFontSizeMultiplier={DISPLAY.has(variant) ? 1.2 : 1.4}
      {...rest}
    />
  );
}
