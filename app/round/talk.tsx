import { useKeepAwake } from 'expo-keep-awake';
import { Redirect, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { currentRound } from '@/game/session';
import { PHASE_ROUTES, useGameStore } from '@/hooks/useGame';
import { useHaptics } from '@/hooks/useHaptics';
import { useSounds } from '@/hooks/useSounds';
import { RoundHeader } from '@/round/RoundHeader';
import { useLeave } from '@/round/useLeave';
import { Button } from '@/ui/Button';
import { useLayout } from '@/ui/layout';
import { Mascot } from '@/ui/Mascot';
import { PopIn } from '@/ui/motion';
import { Screen } from '@/ui/Screen';
import { Text } from '@/ui/Text';
import { TimerBar } from '@/ui/TimerBar';
import { gutter, space } from '@/ui/tokens';

const PROMPTS = [
  'Who was too vague?',
  'Whose word felt off?',
  'Make someone explain their clue.',
  'Who has gone very quiet?',
  'Who copied the person before them?',
  'Anyone sweating?',
] as const;

const PROMPT_MS = 5000;

/**
 * Talk it out. The table argues; the phone keeps time with a bar, not digits,
 * and throws in a question now and then to stir things up. When the bar runs
 * out it goes straight to the vote.
 */
export default function TalkScreen() {
  useKeepAwake();
  const router = useRouter();
  const leave = useLeave();
  const haptics = useHaptics();
  const sound = useSounds();
  const { short } = useLayout();

  const session = useGameStore((s) => s.session);
  const endsAt = useGameStore((s) => s.talkEndsAt);
  const extend = useGameStore((s) => s.extendTalk);
  const go = useGameStore((s) => s.go);

  const [nowMs, setNow] = useState(() => Date.now());
  const [prompt, setPrompt] = useState(0);
  const warned = useRef(false);
  const finished = useRef(false);

  const round = session ? currentRound(session) : null;
  const total = (session?.settings.talkSeconds ?? 60) * 1000;
  const remaining = Math.max(0, (endsAt ?? nowMs) - nowMs);
  const warning = remaining <= Math.min(10_000, total * 0.2);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = setInterval(() => setPrompt((p) => (p + 1) % PROMPTS.length), PROMPT_MS);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (warning && remaining > 0 && !warned.current) {
      warned.current = true;
      haptics.warning();
    }
    if (!warning) warned.current = false;
  }, [haptics, remaining, warning]);

  useEffect(() => {
    if (remaining > 0 || finished.current || !round) return;
    finished.current = true;
    sound('timeup');
    haptics.thud();
    go('vote');
    router.replace(PHASE_ROUTES.vote);
  }, [go, haptics, remaining, round, router, sound]);

  if (!session || !round) return <Redirect href="/" />;

  // The bar can run past full after +30s; it shows the share of what's left.
  const fraction = remaining / Math.max(total, remaining);

  const vote = () => {
    finished.current = true;
    haptics.select();
    go('vote');
    router.replace(PHASE_ROUTES.vote);
  };

  return (
    <Screen>
      <RoundHeader round={round.number} step="Talk" onClose={leave} />

      <View style={styles.body}>
        <PopIn>
          <View style={styles.tilt}>
            <Mascot size={short ? 96 : 150} mood={warning ? 'gasp' : 'peek'} />
          </View>
        </PopIn>
        <Text variant="hero" align="center">
          Talk it out
        </Text>
        <PopIn key={prompt} from="rise">
          <Text variant="title" tone="muted" align="center">
            {PROMPTS[prompt]}
          </Text>
        </PopIn>
      </View>

      <View style={styles.timer}>
        <TimerBar fraction={fraction} warning={warning} />
      </View>

      <View style={styles.footer}>
        <Button label="Vote now" icon="vote" variant="primary" size="lg" onPress={vote} />
        <Button
          label="+30 seconds"
          icon="timer"
          variant="ghost"
          size="sm"
          onPress={() => {
            haptics.select();
            extend(30);
          }}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.md, paddingHorizontal: gutter },
  tilt: { transform: [{ rotate: '6deg' }] },
  timer: { paddingHorizontal: gutter, paddingBottom: space.lg },
  footer: { paddingHorizontal: gutter, paddingTop: space.sm, paddingBottom: space.sm, gap: 2 },
});
