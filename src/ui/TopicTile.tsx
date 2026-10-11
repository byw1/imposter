import { StyleSheet, Text as RNText, View } from 'react-native';
import type { TopicColor } from '@/game/types';
import { EmojiSticker } from './EmojiSticker';
import { Icon } from './Icon';
import { Tap } from './Tap';
import { color, font, inkOn, radius, ringWidth, topicColors } from './tokens';

export type TopicTileProps = {
  name: string;
  emoji: string;
  color: TopicColor;
  count: number;
  selected: boolean;
  onPress: () => void;
  onLongPress?: () => void;
  /** Custom topics wear a small pencil. */
  custom?: boolean;
  width?: number;
  tilt?: number;
};

/**
 * A topic in the setup grid: a block of its colour with its sticker, name and
 * size. The colour it shows here is the colour every RoleCard in that round
 * will be. Selected tiles get a lime ring outside the tile.
 */
export function TopicTile({ name, emoji, color: key, count, selected, onPress, onLongPress, custom, width, tilt = 10 }: TopicTileProps) {
  const ink = inkOn(key);
  return (
    <Tap
      onPress={onPress}
      onLongPress={onLongPress}
      squish={0.95}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={`${name}, ${count} words`}
      accessibilityHint={onLongPress ? 'Long press to see the topic.' : undefined}
      style={width ? { width } : undefined}
      contentStyle={[styles.ring, selected && styles.ringOn]}
    >
      <View style={[styles.tile, { backgroundColor: topicColors[key] }]}>
        <View style={styles.blob} pointerEvents="none" />
        <View style={styles.sticker}>
          <EmojiSticker emoji={emoji} size={46} tilt={tilt} />
        </View>
        {selected ? (
          <View style={styles.check}>
            <Icon name="check" size={16} color={color.ink} weight={3.5} />
          </View>
        ) : custom ? (
          <View style={[styles.check, styles.custom]}>
            <Icon name="edit" size={14} color={color.bone} weight={3} />
          </View>
        ) : null}
        <RNText style={[styles.name, { color: ink }]} numberOfLines={2} allowFontScaling={false}>
          {name}
        </RNText>
        <RNText style={[styles.meta, { color: ink }]} allowFontScaling={false}>
          {count} words
        </RNText>
      </View>
    </Tap>
  );
}

const styles = StyleSheet.create({
  ring: { borderRadius: radius.lg + ringWidth + 2, padding: ringWidth + 2, borderWidth: 0 },
  ringOn: { backgroundColor: color.brandText },
  tile: {
    height: 168,
    overflow: 'hidden',
    borderRadius: radius.lg,
    padding: 14,
    justifyContent: 'flex-end',
    gap: 2,
  },
  blob: { position: 'absolute', width: 220, height: 220, top: -110, right: -90, borderRadius: 999, backgroundColor: color.cardBlob },
  sticker: { position: 'absolute', top: 14, left: 14 },
  check: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: color.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  custom: { backgroundColor: color.scrim },
  name: { fontFamily: font.display, fontSize: 24, lineHeight: 26, letterSpacing: -0.4 },
  meta: { fontFamily: font.bold, fontSize: 13, lineHeight: 18, opacity: 0.8 },
});
