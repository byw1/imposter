import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { color, radius } from './tokens';

/** Rows of bars, as fractions of the width: a page of words with every word blacked out. */
const ROWS = [
  [0.22, 0.34, 0.16, 0.28],
  [0.3, 0.12, 0.26, 0.2],
  [0.18, 0.28, 0.32],
  [0.26, 0.2, 0.14, 0.3],
  [0.34, 0.24, 0.22],
  [0.14, 0.3, 0.18, 0.26],
  [0.28, 0.16, 0.34],
  [0.2, 0.26, 0.12, 0.3],
] as const;

const BAR = 14;
const GAP = 20;

/**
 * The brand pattern: a redacted page. Rows of censor bars drift sideways,
 * slowly, behind a quiet screen, so even the menus feel like someone is
 * hiding something. Decoration only; still under reduced motion.
 */
export function CensorField({ width, height, tint = color.pattern }: { width: number; height: number; tint?: string }) {
  const reduced = useReducedMotion();
  const [drift] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (reduced) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(drift, { toValue: 1, duration: 9000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(drift, { toValue: 0, duration: 9000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [drift, reduced]);

  const rows = Math.ceil(height / (BAR + GAP)) + 1;

  return (
    <View style={[StyleSheet.absoluteFill, styles.clip]} pointerEvents="none">
      {Array.from({ length: rows }, (_, i) => {
        const pattern = ROWS[i % ROWS.length]!;
        const way = i % 2 === 0 ? 1 : -1;
        return (
          <Animated.View
            key={i}
            style={[
              styles.row,
              {
                top: i * (BAR + GAP) + 10,
                transform: [{ translateX: drift.interpolate({ inputRange: [0, 1], outputRange: [-24 * way, 24 * way] }) }],
              },
            ]}
          >
            {pattern.map((w, j) => (
              <View key={j} style={[styles.bar, { width: width * w, backgroundColor: tint }]} />
            ))}
          </Animated.View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  clip: { overflow: 'hidden' },
  row: { position: 'absolute', left: -20, right: -20, flexDirection: 'row', gap: 12 },
  bar: { height: BAR, borderRadius: radius.pill },
});
