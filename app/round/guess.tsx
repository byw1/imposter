import { useKeepAwake } from 'expo-keep-awake';
import { Redirect, useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { guessChoices, playerById } from '@/game/deal';
import { currentRound } from '@/game/session';
import { PHASE_ROUTES, useGameStore } from '@/hooks/useGame';
import { useHaptics } from '@/hooks/useHaptics';
import { allTopics } from '@/hooks/useTopics';
import { RoundHeader } from '@/round/RoundHeader';
import { useLeave } from '@/round/useLeave';
import { Avatar } from '@/ui/Avatar';
import { Button } from '@/ui/Button';
import { PopIn } from '@/ui/motion';
import { Screen } from '@/ui/Screen';
import { Tap } from '@/ui/Tap';
import { Text } from '@/ui/Text';
import { color, font, gutter, radius, ringWidth, space } from '@/ui/tokens';

/**
 * The steal. A caught imposter gets one guess at the secret word, picked from
 * a handful of words from the same topic. An imposter who listened to the
 * clues will know it; one who bluffed blind is guessing.
 */
export default function GuessScreen() {
  useKeepAwake();
  const router = useRouter();
  const leave = useLeave();
  const haptics = useHaptics();
  const session = useGameStore((s) => s.session);
  const guess = useGameStore((s) => s.guess);
  const round = session ? currentRound(session) : null;
  const [picked, setPicked] = useState<string | null>(null);

  // Decoys come from the round's topic; a topic deleted mid-game borrows from all of them.
  const [choices] = useState(() => {
    if (!round) return [];
    const topics = allTopics();
    const topic = topics.find((t) => t.id === round.topicId) ?? { words: topics.flatMap((t) => t.words) };
    return guessChoices(round.word, topic, Math.random, 8);
  });

  const imposter = session && round ? playerById(session.players, round.accusedId) : undefined;
  if (!session || !round || !imposter) return <Redirect href="/" />;

  return (
    <Screen>
      <RoundHeader round={round.number} step={null} onClose={leave} />
      <ScrollView contentContainerStyle={styles.body}>
        <PopIn style={styles.head}>
          <View style={styles.tilt}>
            <Avatar player={imposter} size={72} />
          </View>
          <Text variant="display" align="center">
            {imposter.name}, last chance
          </Text>
          <Text variant="body" tone="muted" align="center">
            {session.settings.hint ? `The topic was ${round.topicEmoji} ${round.topicName}. ` : ''}Pick the secret word. Get it
            right and you steal the win.
          </Text>
        </PopIn>

        <View style={styles.grid}>
          {choices.map((word, i) => {
            const on = picked === word;
            return (
              <PopIn key={word} delay={i * 45} style={styles.cell}>
                <Tap
                  onPress={() => {
                    haptics.select();
                    setPicked(word);
                  }}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: on }}
                  accessibilityLabel={word}
                  contentStyle={[styles.word, on && styles.wordOn]}
                >
                  <Text style={[styles.wordText, on && styles.wordTextOn]} numberOfLines={2} align="center" adjustsFontSizeToFit>
                    {word}
                  </Text>
                </Tap>
              </PopIn>
            );
          })}
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <Button
          label="Lock guess"
          icon="target"
          variant="primary"
          size="lg"
          disabled={!picked}
          onPress={() => {
            if (!picked) return;
            haptics.thud();
            guess(picked);
            router.replace(PHASE_ROUTES.verdict);
          }}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: gutter, paddingBottom: space.lg, gap: space.lg },
  head: { alignItems: 'center', gap: space.sm, paddingTop: space.sm },
  tilt: { transform: [{ rotate: '-8deg' }], marginBottom: space.xs },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  cell: { width: '48%', flexGrow: 1 },
  word: {
    minHeight: 64,
    borderRadius: radius.md,
    backgroundColor: color.surface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.sm,
    borderWidth: ringWidth,
    borderColor: color.surface,
  },
  wordOn: { backgroundColor: color.text, borderColor: color.brandText },
  wordText: { fontFamily: font.display, fontSize: 22, lineHeight: 26, color: color.text },
  wordTextOn: { color: color.background },
  footer: { paddingHorizontal: gutter, paddingTop: space.sm, paddingBottom: space.sm },
});
