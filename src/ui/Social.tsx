import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { textOn } from './contrast';
import { Text } from './Text';
import { color, font, radius, space } from './tokens';

/** A full-width translucent bar of centred white text, laid over a picture. */
export function Caption({ children, size = 'md' }: { children: string; size?: 'md' | 'lg' }) {
  return (
    <View style={styles.caption}>
      <Text style={[styles.captionText, size === 'lg' && styles.captionLarge]} align="center" maxFontSizeMultiplier={1.25}>
        {children}
      </Text>
    </View>
  );
}

/** A small tilted label, like a sticker slapped on the screen. */
export function Sticker({
  children,
  tint = color.bone,
  tilt = -6,
  style,
}: {
  children: string;
  tint?: string;
  tilt?: number;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.sticker, { backgroundColor: tint, transform: [{ rotate: `${tilt}deg` }] }, style]}>
      {/* Decoration, so it keeps its size: a scaled-up sticker overflows the art it sits on. */}
      <Text style={[styles.stickerText, { color: textOn(tint) }]} numberOfLines={1} allowFontScaling={false}>
        {children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  caption: {
    alignSelf: 'stretch',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingVertical: space.sm,
    paddingHorizontal: space.md,
  },
  captionText: { fontFamily: font.bold, fontSize: 18, lineHeight: 24, color: color.bone },
  captionLarge: { fontFamily: font.heavy, fontSize: 24, lineHeight: 31 },
  sticker: {
    alignSelf: 'flex-start',
    paddingHorizontal: space.md - 4,
    paddingVertical: 6,
    borderRadius: radius.sm,
  },
  stickerText: { fontFamily: font.display, fontSize: 18, lineHeight: 24 },
});
