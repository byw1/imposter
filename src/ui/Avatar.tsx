import { StyleSheet, Text, View } from 'react-native';
import { initial, tiltFor } from '@/game/players';
import type { Player } from '@/game/types';
import { color, font, inkOn, topicColors } from './tokens';

export type AvatarProps = {
  player: Pick<Player, 'id' | 'name' | 'color'>;
  size?: number;
  /** Greyed out: voted out, or done. */
  dim?: boolean;
  /** Override the per-player tilt, e.g. 0 for a straight row. */
  tilt?: number;
};

/**
 * A player as a sticker: a coloured disc with their initial, a bone border and
 * a tilt, like Charades' emoji stickers. The tilt is fixed per player so it
 * never jumps between screens.
 */
export function Avatar({ player, size = 36, dim = false, tilt }: AvatarProps) {
  const background = topicColors[player.color];
  const border = Math.max(3, Math.round(size / 18));
  return (
    <View
      accessible={false}
      style={[
        styles.disc,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: border,
          backgroundColor: background,
          transform: [{ rotate: `${tilt ?? tiltFor(player.id)}deg` }],
          opacity: dim ? 0.45 : 1,
        },
      ]}
    >
      <Text
        allowFontScaling={false}
        style={{ fontFamily: font.display, fontSize: size * 0.46, lineHeight: size * 0.56, color: inkOn(player.color) }}
      >
        {initial(player.name)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  disc: { alignItems: 'center', justifyContent: 'center', borderColor: color.bone },
});
