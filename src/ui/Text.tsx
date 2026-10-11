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

/**
 * UI text. The secret word on a RoleCard is its own component, since it fits
 * the card rather than following the type scale.
 *
 * Dynamic Type stays on, capped so the largest accessibility sizes still fit a
 * pill button rather than breaking out of it.
 */
export function Text({ variant = 'body', tone = 'default', align, style, ...rest }: TextProps) {
  return (
    <RNText
      style={StyleSheet.compose([type[variant], { color: tones[tone] }, align ? { textAlign: align } : null], style)}
      maxFontSizeMultiplier={1.6}
      {...rest}
    />
  );
}
