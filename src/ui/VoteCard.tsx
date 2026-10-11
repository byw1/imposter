import { useEffect, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import type { Player } from '@/game/types';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { Avatar } from './Avatar';
import { Tap } from './Tap';
import { Text } from './Text';
import { color, font, radius, ringWidth, size } from './tokens';

export type VoteCardProps = {
  player: Pick<Player, 'id' | 'name' | 'color'>;
  picked: boolean;
  onPress?: () => void;
  /** Votes to show as dots. Undefined hides the tally. */
  votes?: number;
  /** The one the table voted out, after the count. */
  winner?: boolean;
  /** Greyed and not tappable: e.g. the voter themselves. */
  disabled?: boolean;
  width?: number;
};

/**
 * One suspect in the vote: a big sticker, the name, and the votes against them
 * as dots. Picked draws an inset lime ring. Never shows a role.
 */
export function VoteCard({ player, picked, onPress, votes, winner = false, disabled = false, width }: VoteCardProps) {
  const reduced = useReducedMotion();
  const [bump] = useState(() => new Animated.Value(0));

  // A picked card hops, like a sticker pressed down.
  useEffect(() => {
    if (!picked || reduced) return;
    bump.setValue(0);
    const animation = Animated.spring(bump, { toValue: 1, friction: 4, tension: 240, useNativeDriver: true });
    animation.start();
    return () => animation.stop();
  }, [bump, picked, reduced]);

  return (
    <Tap
      onPress={onPress}
      disabled={disabled || !onPress}
      squish={0.93}
      accessibilityRole="radio"
      accessibilityState={{ selected: picked, disabled }}
      accessibilityLabel={`${player.name}${votes !== undefined ? `, ${votes} ${votes === 1 ? 'vote' : 'votes'}` : ''}`}
      style={width ? { width } : undefined}
      contentStyle={[styles.card, picked && styles.picked, winner && styles.winner, disabled && styles.disabled]}
    >
      <Animated.View
        style={{
          transform: [
            { scale: bump.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.15, 1] }) },
            { rotate: bump.interpolate({ inputRange: [0, 0.5, 1], outputRange: ['0deg', '-6deg', '0deg'] }) },
          ],
        }}
      >
        <Avatar player={player} size={size.avatarLg} />
      </Animated.View>
      <Text style={styles.name} numberOfLines={1}>
        {player.name}
      </Text>
      {votes !== undefined ? (
        <>
          <View style={styles.tally}>
            {Array.from({ length: votes }, (_, i) => (
              <Dot key={i} />
            ))}
          </View>
          <Text variant="caption" tone="muted">
            {votes} {votes === 1 ? 'vote' : 'votes'}
          </Text>
        </>
      ) : null}
    </Tap>
  );
}

/** A tally dot that pops in. */
function Dot() {
  const reduced = useReducedMotion();
  const [pop] = useState(() => new Animated.Value(reduced ? 1 : 0));
  useEffect(() => {
    if (reduced) return;
    Animated.spring(pop, { toValue: 1, friction: 4, tension: 260, useNativeDriver: true }).start();
  }, [pop, reduced]);
  return <Animated.View style={[styles.dot, { transform: [{ scale: pop }] }]} />;
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    gap: 6,
    paddingTop: 14,
    paddingBottom: 12,
    paddingHorizontal: 10,
    minWidth: 104,
    borderRadius: radius.md,
    backgroundColor: color.surface,
    borderWidth: ringWidth,
    borderColor: color.surface,
  },
  picked: { borderColor: color.brandText },
  winner: { borderColor: color.brandText, backgroundColor: color.surfaceRaised },
  disabled: { opacity: 0.35 },
  name: { fontFamily: font.heavy, fontSize: 15, lineHeight: 20, color: color.text },
  tally: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 4, minHeight: 10 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: color.text },
});
