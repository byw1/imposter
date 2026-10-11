import { useEffect, useState, type ReactNode } from 'react';
import { Animated, Easing, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { color, radius } from './tokens';

/**
 * The censor bar: a word hidden behind an ink pill. The signature move. Always
 * ink, in both themes.
 */
export function Redact({ width, height, style }: { width: number; height: number; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.bar, { width, height }, style]} />;
}

export type CensoredProps = {
  /** True slides the bar off; false slides it back over. */
  open: boolean;
  /** What sits under the bar. */
  children: ReactNode;
  /** Delay before the bar slides, in ms. */
  delay?: number;
  style?: StyleProp<ViewStyle>;
  /** Slides off fast and covers instantly, for a role that must never linger. */
  snapShut?: boolean;
  /** The bar's colour. Ink, except on the dark canvas, where ink would vanish. */
  tint?: string;
};

/**
 * Something under a censor bar that slides away. The bar sits over its
 * children and moves off to the right, shrinking as it goes, like a strip of
 * tape being pulled. Under reduced motion it simply appears or disappears.
 */
export function Censored({ open, children, delay = 0, style, snapShut = false, tint = color.redact }: CensoredProps) {
  const reduced = useReducedMotion();
  const [progress] = useState(() => new Animated.Value(open ? 1 : 0));
  const [width, setWidth] = useState(0);

  useEffect(() => {
    if (reduced || (!open && snapShut)) {
      progress.setValue(open ? 1 : 0);
      return;
    }
    const animation = Animated.timing(progress, {
      toValue: open ? 1 : 0,
      duration: open ? 320 : 220,
      delay,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [delay, open, progress, reduced, snapShut]);

  return (
    <View style={style} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      <Animated.View style={{ opacity: progress.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 1, 1] }) }}>
        {children}
      </Animated.View>
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          styles.cover,
          {
            transform: [
              { translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [0, width * 0.6] }) },
              { scaleX: progress.interpolate({ inputRange: [0, 1], outputRange: [1, 0.05] }) },
            ],
            opacity: progress.interpolate({ inputRange: [0, 0.85, 1], outputRange: [1, 1, 0] }),
          },
        ]}
      >
        <View style={[styles.coverBar, { backgroundColor: tint }]} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { borderRadius: radius.pill, backgroundColor: color.redact },
  cover: { justifyContent: 'center' },
  coverBar: { height: '78%', borderRadius: radius.pill, backgroundColor: color.redact },
});
