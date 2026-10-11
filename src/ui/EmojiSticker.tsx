import { StyleSheet, Text, View } from 'react-native';

export type EmojiStickerProps = {
  emoji: string;
  /** Diameter of the white disc. */
  size?: number;
  /** Degrees. Stickers are never stuck on straight. */
  tilt?: number;
};

/**
 * A topic's emoji as a sticker: a white disc slapped on at an angle. The same
 * sticker shows on the topic's tile, the setup screen and the recap, so a
 * topic is recognisable wherever it appears.
 */
export function EmojiSticker({ emoji, size = 54, tilt = 10 }: EmojiStickerProps) {
  return (
    <View
      accessible={false}
      style={[
        styles.disc,
        { width: size, height: size, borderRadius: size / 2, borderWidth: Math.max(2, size / 18), transform: [{ rotate: `${tilt}deg` }] },
      ]}
    >
      <Text style={{ fontSize: size * 0.55, lineHeight: size * 0.7 }} allowFontScaling={false}>
        {emoji}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  disc: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(0,0,0,0.12)',
  },
});
