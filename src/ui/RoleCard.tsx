import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, Text as RNText, View, type StyleProp, type ViewStyle } from 'react-native';
import type { Role, TopicColor } from '@/game/types';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { Icon } from './Icon';
import { Censored, Redact } from './Redact';
import { color, font, inkOn, radius, space, topicColors } from './tokens';

export type RoleCardProps = {
  topic: { name: string; emoji: string; color: TopicColor };
  role: Role;
  /** The secret word, shown to players who are in. */
  word: string;
  /** True only while the player holds. */
  revealed: boolean;
  /** Whether imposters see the topic. */
  hint: boolean;
  /** Who should be looking, for the face-down strip. */
  playerName?: string;
  style?: StyleProp<ViewStyle>;
};

/**
 * The secret: what one player sees while they hold the phone.
 *
 * Everyone in the round gets the same card in the same topic colour; only the
 * word and one line differ, so nobody can read a role from across the table.
 * No red for the imposter, no lime for in, no different motion. Face up, the
 * card flips in and the censor bar slides off the word; on release it goes
 * face down at once, with no animation to linger on.
 */
export function RoleCard({ topic, role, word, revealed, hint, playerName, style }: RoleCardProps) {
  const reduced = useReducedMotion();
  const [flip] = useState(() => new Animated.Value(revealed ? 1 : 0));

  useEffect(() => {
    if (!revealed || reduced) {
      flip.setValue(revealed ? 1 : 0);
      return;
    }
    flip.setValue(0);
    const animation = Animated.timing(flip, { toValue: 1, duration: 180, easing: Easing.out(Easing.cubic), useNativeDriver: true });
    animation.start();
    return () => animation.stop();
  }, [flip, reduced, revealed]);

  if (!revealed) {
    return (
      <View style={[styles.card, styles.down, style]} accessible accessibilityLabel="Secret card, face down. Hold to peek.">
        <View style={styles.topicRow}>
          <Icon name="lock" size={18} color={color.textMuted} />
          <RNText style={[styles.topic, { color: color.textMuted }]} allowFontScaling={false}>
            SECRET
          </RNText>
        </View>
        <View style={styles.redactions}>
          <Redact width={180} height={44} />
          <Redact width={120} height={22} style={styles.redactSmall} />
        </View>
        <View style={[styles.strip, styles.stripDown]}>
          <RNText style={[styles.stripLabel, { color: color.textMuted }]}>HOLD TO PEEK</RNText>
          <RNText style={[styles.stripText, { color: color.textMuted }]}>
            {playerName ? `Only ${playerName} looks.` : 'Nobody else looks.'}
          </RNText>
        </View>
      </View>
    );
  }

  const fill = topicColors[topic.color];
  const ink = inkOn(topic.color);
  const imposter = role === 'imposter';
  const topicLine = imposter && !hint ? 'No hint' : topic.name;

  return (
    <Animated.View
      style={[
        styles.card,
        { backgroundColor: fill },
        style,
        {
          transform: [
            { perspective: 900 },
            { rotateY: flip.interpolate({ inputRange: [0, 1], outputRange: ['80deg', '0deg'] }) },
            { scale: flip.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] }) },
          ],
        },
      ]}
      accessible
      accessibilityLiveRegion="polite"
      accessibilityLabel={
        imposter
          ? `You're the imposter. ${hint ? `The topic is ${topic.name}.` : 'No hint.'} Blend in.`
          : `You're in. The word is ${word}. Topic: ${topic.name}.`
      }
    >
      <View style={[styles.blob, styles.blobOne]} pointerEvents="none" />
      <View style={[styles.blob, styles.blobTwo]} pointerEvents="none" />

      <View style={styles.topicRow}>
        {imposter && !hint ? null : (
          <RNText style={styles.topicEmoji} allowFontScaling={false}>
            {topic.emoji}
          </RNText>
        )}
        <RNText style={[styles.topic, { color: ink }]} allowFontScaling={false}>
          {topicLine.toUpperCase()}
        </RNText>
      </View>

      <Censored open delay={reduced ? 0 : 120} style={styles.wordWrap}>
        <RNText
          style={[styles.word, { color: ink }]}
          numberOfLines={2}
          adjustsFontSizeToFit
          minimumFontScale={40 / 64}
          allowFontScaling={false}
        >
          {imposter ? 'Imposter' : word}
        </RNText>
      </Censored>

      <View style={styles.strip}>
        <RNText style={styles.stripLabel}>{imposter ? "YOU'RE THE IMPOSTER" : "YOU'RE IN"}</RNText>
        <RNText style={styles.stripText}>
          {imposter ? "You don't know the word. Blend in." : 'One word about it. Not too obvious.'}
        </RNText>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
    borderRadius: radius.lg,
    paddingTop: space.lg,
    paddingHorizontal: space.md,
    paddingBottom: space.md,
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.md,
  },
  down: { backgroundColor: color.surfaceRaised },
  blob: { position: 'absolute', borderRadius: 999, backgroundColor: color.cardBlob },
  blobOne: { width: 360, height: 360, top: -170, left: -120 },
  blobTwo: { width: 280, height: 280, bottom: -150, right: -90 },
  topicRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  topicEmoji: { fontSize: 18, lineHeight: 22 },
  topic: { fontFamily: font.heavy, fontSize: 13, lineHeight: 16, letterSpacing: 0.8 },
  redactions: { alignItems: 'center', gap: 12 },
  redactSmall: { opacity: 0.6 },
  wordWrap: { alignSelf: 'stretch', paddingHorizontal: space.xs },
  word: {
    fontFamily: font.display,
    fontSize: 64,
    lineHeight: 72,
    letterSpacing: -1.8,
    textAlign: 'center',
  },
  strip: {
    alignSelf: 'stretch',
    gap: 4,
    paddingTop: 10,
    paddingBottom: 12,
    paddingHorizontal: 14,
    borderRadius: radius.lg,
    backgroundColor: color.hintStrip,
  },
  stripDown: { backgroundColor: color.glass },
  stripLabel: { fontFamily: font.heavy, fontSize: 12, lineHeight: 16, letterSpacing: 0.8, color: color.hintLabel },
  stripText: { fontFamily: font.bold, fontSize: 15, lineHeight: 20, color: color.bone },
});
