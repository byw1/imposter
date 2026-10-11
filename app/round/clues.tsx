import { useKeepAwake } from 'expo-keep-awake';
import { Redirect, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { playerById } from '@/game/deal';
import { currentRound } from '@/game/session';
import { PHASE_ROUTES, useGameStore } from '@/hooks/useGame';
import { useHaptics } from '@/hooks/useHaptics';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useSounds } from '@/hooks/useSounds';
import { RoundHeader } from '@/round/RoundHeader';
import { useLeave } from '@/round/useLeave';
import { Avatar } from '@/ui/Avatar';
import { Button } from '@/ui/Button';
import { useLayout } from '@/ui/layout';
import { Mascot } from '@/ui/Mascot';
import { PlayerChip } from '@/ui/PlayerChip';
import { Screen } from '@/ui/Screen';
import { Text } from '@/ui/Text';
import { color, font, gutter, radius, space } from '@/ui/tokens';

const TIPS = [
  'Too obvious helps the imposter. Too vague looks suspicious.',
  'Imposter? Listen first, then sound sure.',
  'No repeats. Say a new word each time.',
  'Watch who hesitates.',
] as const;

/**
 * Clues. The phone sits face up in the middle of the table and points at
 * whoever is next: their sticker, their name, "one word." Most tables just say
 * the clues; tap anywhere for the next player. The start seat is random every
 * round and never announced as "first", so it carries no hint.
 */
export default function CluesScreen() {
  useKeepAwake();
  const router = useRouter();
  const leave = useLeave();
  const haptics = useHaptics();
  const sound = useSounds();
  const reduced = useReducedMotion();
  const { short } = useLayout();

  const session = useGameStore((s) => s.session);
  const clueStep = useGameStore((s) => s.clueStep);
  const advanceClue = useGameStore((s) => s.advanceClue);
  const startTalk = useGameStore((s) => s.startTalk);
  const go = useGameStore((s) => s.go);
  const [pop] = useState(() => new Animated.Value(1));

  const round = session ? currentRound(session) : null;

  useEffect(() => {
    if (reduced) return;
    pop.setValue(0);
    const animation = Animated.spring(pop, { toValue: 1, friction: 5, tension: 160, useNativeDriver: true });
    animation.start();
    return () => animation.stop();
  }, [clueStep, pop, reduced]);

  if (!session || !round) return <Redirect href="/" />;

  const n = round.order.length;
  const laps = session.settings.clueRounds;
  const total = n * laps;
  const step = Math.min(clueStep, total - 1);
  const lap = Math.floor(step / n) + 1;
  const seat = step % n;
  const speaker = playerById(session.players, round.order[seat]);
  const last = step >= total - 1;

  const toTalk = () => {
    if (session.settings.talkSeconds > 0) {
      startTalk(session.settings.talkSeconds);
      router.replace(PHASE_ROUTES.talk);
    } else {
      go('vote');
      router.replace(PHASE_ROUTES.vote);
    }
  };

  const next = () => {
    if (last) {
      haptics.select();
      toTalk();
      return;
    }
    haptics.tick();
    sound('tick');
    advanceClue();
  };

  return (
    <Screen>
      <RoundHeader round={round.number} step="Clues" onClose={leave} />

      <Pressable
        style={styles.stage}
        onPress={next}
        accessibilityRole="button"
        accessibilityLabel={`${speaker?.name ?? 'Next player'}, one word. Tap for the next player.`}
      >
        <Animated.View
          style={[
            styles.speaker,
            short && styles.speakerShort,
            {
              opacity: pop.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 1, 1] }),
              transform: [
                { scale: pop.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) },
                { rotate: pop.interpolate({ inputRange: [0, 1], outputRange: ['-12deg', '0deg'] }) },
              ],
            },
          ]}
        >
          {speaker ? <Avatar player={speaker} size={short ? 80 : 128} /> : null}
        </Animated.View>

        <Text style={[styles.prompt, short && styles.promptShort]} align="center" numberOfLines={2} adjustsFontSizeToFit>
          <Text style={[styles.prompt, short && styles.promptShort, { color: color.brandText }]}>{speaker?.name}</Text>, one
          word.
        </Text>
        <Text variant="body" tone="muted" align="center">
          {laps > 1 ? `Clue ${lap} of ${laps}` : 'One clue each'}
          {session.settings.hint ? ` · ${round.topicEmoji} ${round.topicName}` : ''}
        </Text>
        <View style={styles.tip}>
          <Text variant="caption" tone="muted" align="center">
            {TIPS[(round.number + lap) % TIPS.length]}
          </Text>
        </View>
      </Pressable>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.lineWrap} contentContainerStyle={styles.line}>
        {round.order.map((id, index) => {
          const player = playerById(session.players, id);
          if (!player) return null;
          const state = index === seat ? 'speaking' : index < seat ? 'done' : 'idle';
          return <PlayerChip key={id} player={player} state={state} />;
        })}
      </ScrollView>

      {!short ? (
        <View style={styles.peeker} pointerEvents="none">
          <Mascot size={74} mood="peek" />
        </View>
      ) : null}

      <View style={styles.footer}>
        <Button
          label={last ? (session.settings.talkSeconds > 0 ? 'Talk it out' : 'Vote') : 'Next'}
          icon={last ? (session.settings.talkSeconds > 0 ? 'chat' : 'vote') : 'forward'}
          variant="primary"
          size="lg"
          onPress={next}
        />
        {!last ? <Button label="Skip to talking" variant="ghost" size="sm" onPress={toTalk} /> : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  stage: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: gutter, gap: space.sm },
  speaker: { marginBottom: space.md },
  speakerShort: { marginBottom: 0 },
  prompt: { fontFamily: font.display, fontSize: 44, lineHeight: 48, letterSpacing: -1.2, color: color.text },
  promptShort: { fontSize: 32, lineHeight: 36 },
  tip: {
    marginTop: space.md,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderRadius: radius.pill,
    backgroundColor: color.surface,
  },
  lineWrap: { flexGrow: 0 },
  line: { paddingHorizontal: gutter, gap: space.sm, paddingVertical: space.sm },
  peeker: { position: 'absolute', right: 12, top: 76, transform: [{ rotate: '12deg' }] },
  footer: { paddingHorizontal: gutter, paddingTop: space.sm, paddingBottom: space.sm, gap: 2 },
});
