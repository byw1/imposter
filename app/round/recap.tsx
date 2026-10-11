import { useKeepAwake } from 'expo-keep-awake';
import { Redirect, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Animated, Easing, ScrollView, StyleSheet, Text as RNText, View } from 'react-native';
import { playerById } from '@/game/deal';
import { listNames } from '@/game/lines';
import { standings } from '@/game/scoring';
import { latestRound } from '@/game/session';
import { PHASE_ROUTES, useGameStore } from '@/hooks/useGame';
import { useHaptics } from '@/hooks/useHaptics';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { RoundHeader } from '@/round/RoundHeader';
import { useGoHome } from '@/round/useLeave';
import { Avatar } from '@/ui/Avatar';
import { Button } from '@/ui/Button';
import { VERDICTS } from '@/ui/VerdictFlash';
import { PopIn } from '@/ui/motion';
import { Screen } from '@/ui/Screen';
import { Text } from '@/ui/Text';
import { color, font, gutter, inkOn, radius, space, topicColors } from '@/ui/tokens';

const MEDALS = ['🥇', '🥈', '🥉'] as const;

/**
 * After the verdict: the secret word, face up for everyone at last, who the
 * imposter was, who scored, and tonight's table. Then the next round, with the
 * same players and a fresh word.
 */
export default function RecapScreen() {
  useKeepAwake();
  const router = useRouter();
  const goHome = useGoHome();
  const haptics = useHaptics();
  const reduced = useReducedMotion();
  const session = useGameStore((s) => s.session);
  const nextRound = useGameStore((s) => s.nextRound);
  const end = useGameStore((s) => s.end);
  const round = session ? latestRound(session) : null;
  const [flip] = useState(() => new Animated.Value(reduced ? 1 : 0));

  useEffect(() => {
    if (reduced) return;
    const animation = Animated.timing(flip, { toValue: 1, duration: 520, delay: 150, easing: Easing.out(Easing.back(1.4)), useNativeDriver: true });
    animation.start();
    return () => animation.stop();
  }, [flip, reduced]);

  if (!session || !round || !round.outcome) return <Redirect href="/" />;

  const table = standings(session);
  const imposters = round.imposterIds.flatMap((id) => playerById(session.players, id) ?? []);
  const scorers = session.players.filter((p) => (round.points[p.id] ?? 0) > 0);
  const verdict = VERDICTS[round.outcome];
  const fill = topicColors[round.topicColor];
  const ink = inkOn(round.topicColor);

  const again = () => {
    haptics.select();
    nextRound();
    router.replace(PHASE_ROUTES.deal);
  };

  const finish = () =>
    Alert.alert('End the game?', 'Tonight’s rounds are saved in your stats.', [
      { text: 'Keep playing', style: 'cancel' },
      {
        text: 'End game',
        onPress: () => {
          end();
          goHome();
        },
      },
    ]);

  return (
    <Screen>
      <RoundHeader round={round.number} step={null} onClose={goHome} />
      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.center}>
          <Text variant="overline" tone="muted">
            THE WORD WAS
          </Text>
        </View>

        <Animated.View
          style={[
            styles.word,
            { backgroundColor: fill },
            {
              transform: [
                { perspective: 900 },
                { rotateX: flip.interpolate({ inputRange: [0, 1], outputRange: ['70deg', '0deg'] }) },
                { rotate: flip.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-2deg'] }) },
              ],
              opacity: flip.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0, 1, 1] }),
            },
          ]}
          accessible
          accessibilityLabel={`The word was ${round.word}. Topic: ${round.topicName}.`}
        >
          <View style={styles.blob} />
          <RNText style={[styles.topic, { color: ink }]} allowFontScaling={false}>
            {round.topicEmoji} {round.topicName.toUpperCase()}
          </RNText>
          <RNText style={[styles.wordText, { color: ink }]} numberOfLines={2} adjustsFontSizeToFit allowFontScaling={false}>
            {round.word}
          </RNText>
        </Animated.View>

        <PopIn delay={300} from="rise">
          <View style={styles.card}>
            <View style={styles.cardRow}>
              <RNText style={styles.verdictEmoji} allowFontScaling={false}>
                {verdict.emoji}
              </RNText>
              <View style={styles.flex}>
                <Text variant="caption" tone="muted">
                  {imposters.length > 1 ? 'The imposters' : 'The imposter'}
                </Text>
                <Text variant="title" numberOfLines={1}>
                  {listNames(imposters.map((p) => p.name))}
                </Text>
              </View>
              <View style={styles.stack}>
                {imposters.map((p) => (
                  <Avatar key={p.id} player={p} size={40} />
                ))}
              </View>
            </View>
            <Text variant="body" tone="muted">
              {round.outcome === 'caught'
                ? round.guess
                  ? `Caught, and guessed “${round.guess}”. Wrong.`
                  : 'Caught.'
                : round.outcome === 'stolen'
                  ? `Caught, then guessed the word. Sneaky.`
                  : round.accusedId
                    ? `Got away while the table voted out ${playerById(session.players, round.accusedId)?.name ?? 'someone'}.`
                    : 'Got away while the table argued.'}
            </Text>
          </View>
        </PopIn>

        {scorers.length > 0 ? (
          <PopIn delay={420} from="rise">
            <View style={styles.points}>
              {scorers.map((p, i) => (
                <PopIn key={p.id} delay={500 + i * 70}>
                  <View style={styles.point}>
                    <Text style={styles.pointText}>+{round.points[p.id]}</Text>
                    <Text style={styles.pointName}>{p.name}</Text>
                  </View>
                </PopIn>
              ))}
            </View>
          </PopIn>
        ) : null}

        <View style={styles.section}>
          <Text variant="overline" tone="muted">
            {`TONIGHT · ${round.number} ${round.number === 1 ? 'ROUND' : 'ROUNDS'}`}
          </Text>
          <View style={styles.board}>
            {table.map((row, i) => (
              <PopIn key={row.player.id} delay={560 + i * 50} from="rise">
                <View style={[styles.row, i > 0 && styles.rowDivider]}>
                  <Text style={styles.rank}>{row.score > 0 && row.rank <= 3 ? MEDALS[row.rank - 1] : row.rank}</Text>
                  <Avatar player={row.player} size={34} />
                  <Text variant="heading" style={styles.flex} numberOfLines={1}>
                    {row.player.name}
                  </Text>
                  <Text style={styles.score}>{row.score}</Text>
                </View>
              </PopIn>
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button label="Next round" icon="shuffle" variant="primary" size="lg" onPress={again} />
        <Button label="End game" variant="ghost" size="sm" onPress={finish} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: gutter, paddingTop: space.xs, paddingBottom: space.lg, gap: space.md },
  center: { alignItems: 'center' },
  word: {
    overflow: 'hidden',
    borderRadius: radius.lg,
    paddingVertical: space.lg,
    paddingHorizontal: space.md,
    alignItems: 'center',
    gap: space.sm,
  },
  blob: { position: 'absolute', width: 300, height: 300, top: -150, right: -100, borderRadius: 999, backgroundColor: color.cardBlob },
  topic: { fontFamily: font.heavy, fontSize: 13, lineHeight: 16, letterSpacing: 0.8 },
  wordText: { fontFamily: font.display, fontSize: 64, lineHeight: 72, letterSpacing: -1.8, textAlign: 'center' },
  card: { backgroundColor: color.surface, borderRadius: radius.lg, padding: space.md, gap: space.sm },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  verdictEmoji: { fontSize: 34, lineHeight: 40 },
  flex: { flex: 1 },
  stack: { flexDirection: 'row', gap: -8 },
  points: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, justifyContent: 'center' },
  point: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: color.glass,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  pointText: { fontFamily: font.display, fontSize: 18, lineHeight: 22, color: color.brandText },
  pointName: { fontFamily: font.heavy, fontSize: 14, lineHeight: 18, color: color.text },
  section: { gap: space.sm },
  board: { backgroundColor: color.surface, borderRadius: radius.lg, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: space.md, paddingVertical: 10 },
  rowDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: color.line },
  rank: { width: 26, textAlign: 'center', fontFamily: font.display, fontSize: 18, lineHeight: 22, color: color.textMuted },
  score: { fontFamily: font.display, fontSize: 24, lineHeight: 28, color: color.text },
  footer: { paddingHorizontal: gutter, paddingTop: space.sm, paddingBottom: space.sm, gap: 2 },
});
