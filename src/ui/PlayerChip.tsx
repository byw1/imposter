import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import type { Player } from '@/game/types';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { Avatar } from './Avatar';
import { Tap } from './Tap';
import { Text } from './Text';
import { color, font, minTapTarget, radius, ringWidth, space } from './tokens';

export type PlayerChipState = 'idle' | 'speaking' | 'done' | 'out';

export type PlayerChipProps = {
  player: Pick<Player, 'id' | 'name' | 'color'>;
  state?: PlayerChipState;
  /** A small trailing note: the clue they gave, "voted out", a score. */
  tag?: string;
  onPress?: () => void;
};

/**
 * A player as a sticker and a name on a surface pill. Used in setup, the clue
 * round and the recap. A player's role is never shown on their chip until the
 * verdict.
 */
export function PlayerChip({ player, state = 'idle', tag, onPress }: PlayerChipProps) {
  const reduced = useReducedMotion();
  const [pulse] = useState(() => new Animated.Value(0));
  const speaking = state === 'speaking';

  // The speaker's ring breathes, so the eye finds them across the table.
  useEffect(() => {
    if (!speaking || reduced) {
      pulse.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 650, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 650, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse, reduced, speaking]);

  const body = (
    <Animated.View
      style={[
        styles.chip,
        speaking && styles.speaking,
        speaking && { transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.05] }) }] },
      ]}
    >
      <Avatar player={player} dim={state === 'done' || state === 'out'} />
      <Text
        style={[
          styles.name,
          state === 'done' && { color: color.textMuted },
          state === 'out' && styles.out,
        ]}
        numberOfLines={1}
      >
        {player.name}
      </Text>
      {tag ? (
        <Text variant="caption" tone="muted" numberOfLines={1}>
          {tag}
        </Text>
      ) : null}
    </Animated.View>
  );

  if (!onPress) return <View accessible accessibilityLabel={`${player.name}${tag ? `, ${tag}` : ''}`}>{body}</View>;
  return (
    <Tap onPress={onPress} accessibilityLabel={player.name} squish={0.95}>
      {body}
    </Tap>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: space.sm,
    minHeight: minTapTarget,
    paddingLeft: 4,
    paddingRight: 14,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: color.surface,
  },
  speaking: { borderWidth: ringWidth, borderColor: color.brandText, paddingLeft: 1, paddingRight: 11, paddingVertical: 1 },
  name: { fontFamily: font.heavy, fontSize: 15, lineHeight: 20, color: color.text, maxWidth: 160 },
  out: { color: color.textFaint, textDecorationLine: 'line-through' },
});
