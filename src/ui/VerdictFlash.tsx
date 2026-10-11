import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import type { Outcome } from '@/game/types';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { Confetti } from './Confetti';
import { Mascot } from './Mascot';
import { color, font } from './tokens';

export type VerdictFlashProps = {
  outcome: Outcome;
  /** The line under the word: "It was Jordan." */
  line: string;
};

export const VERDICTS: Record<Outcome, { word: string; emoji: string; tilt: number; background: string }> = {
  caught: { word: 'Caught!', emoji: '🕵️', tilt: -5, background: color.caught },
  escaped: { word: 'Got away', emoji: '🎭', tilt: 4, background: color.escaped },
  stolen: { word: 'Stole it', emoji: '🧠', tilt: 4, background: color.escaped },
};

/**
 * The end of the round, and the one loud moment: the whole screen turns the
 * winner's colour and says what happened. The word drops in from 1.8x on a
 * spring and tilts like a sticker. Blue means the table won; red is Shade's
 * colour, because when the imposter wins the screen turns into them. The word
 * is there for anyone who can't rely on colour.
 */
export function VerdictFlash({ outcome, line }: VerdictFlashProps) {
  const reduced = useReducedMotion();
  const [pop] = useState(() => new Animated.Value(reduced ? 1 : 0));
  const [rise] = useState(() => new Animated.Value(reduced ? 1 : 0));
  const verdict = VERDICTS[outcome];
  const { width } = useWindowDimensions();
  // As big as the screen allows, up to the design's 112.
  const size = Math.min(112, Math.floor((width - 48) / (verdict.word.length * 0.56)));

  useEffect(() => {
    if (reduced) return;
    const animation = Animated.parallel([
      Animated.spring(pop, { toValue: 1, friction: 5, tension: 190, useNativeDriver: true }),
      Animated.timing(rise, { toValue: 1, duration: 520, delay: 280, easing: Easing.out(Easing.back(1.6)), useNativeDriver: true }),
    ]);
    animation.start();
    return () => animation.stop();
  }, [pop, reduced, rise]);

  return (
    <View
      style={[styles.overlay, { backgroundColor: verdict.background }]}
      accessibilityLiveRegion="assertive"
      accessibilityLabel={`${verdict.word} ${line}`}
    >
      <View style={[styles.blob, styles.blobOne]} />
      <View style={[styles.blob, styles.blobTwo]} />
      <Animated.View
        style={{
          alignItems: 'center',
          opacity: pop.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0, 1, 1] }),
          transform: [{ scale: pop.interpolate({ inputRange: [0, 1], outputRange: [1.8, 1] }) }, { rotate: `${verdict.tilt}deg` }],
        }}
      >
        <Text style={styles.emoji} allowFontScaling={false}>
          {verdict.emoji}
        </Text>
        <Text style={[styles.word, { fontSize: size, lineHeight: size * 1.12 }]} allowFontScaling={false} numberOfLines={1}>
          {verdict.word}
        </Text>
        <Text style={styles.line} allowFontScaling={false} numberOfLines={2}>
          {line}
        </Text>
      </Animated.View>

      <Animated.View
        style={[
          styles.shade,
          {
            transform: [
              { translateY: rise.interpolate({ inputRange: [0, 1], outputRange: [220, 0] }) },
              { rotate: outcome === 'caught' ? '12deg' : '-10deg' },
            ],
          },
        ]}
        pointerEvents="none"
      >
        <Mascot size={140} mood={outcome === 'caught' ? 'caught' : 'excited'} />
      </Animated.View>

      {outcome === 'caught' ? <Confetti count={70} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', paddingHorizontal: 20 },
  blob: { position: 'absolute', borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.1)' },
  blobOne: { width: 420, height: 420, top: -160, left: -160 },
  blobTwo: { width: 360, height: 360, bottom: -140, right: -140 },
  emoji: { fontSize: 64, lineHeight: 76 },
  word: { fontFamily: font.display, fontSize: 112, lineHeight: 126, letterSpacing: -3, color: color.ink, textAlign: 'center' },
  line: { fontFamily: font.heavy, fontSize: 26, lineHeight: 32, color: color.ink, textAlign: 'center', marginTop: 8 },
  shade: { position: 'absolute', bottom: 24, left: 16 },
});
