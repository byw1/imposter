import { useKeepAwake } from 'expo-keep-awake';
import { Redirect, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { verdictLine } from '@/game/lines';
import { latestRound } from '@/game/session';
import { PHASE_ROUTES, useGameStore } from '@/hooks/useGame';
import { useHaptics } from '@/hooks/useHaptics';
import { useSounds } from '@/hooks/useSounds';
import { PopIn } from '@/ui/motion';
import { Text } from '@/ui/Text';
import { color, font, space, verdictMs } from '@/ui/tokens';
import { VerdictFlash } from '@/ui/VerdictFlash';

/**
 * The verdict owns the screen: blue if the table caught the imposter, red if
 * the imposter got away or stole the word. It holds for a beat, then moves on
 * to the recap and the secret word by itself; a tap after the beat skips the
 * wait.
 */

/** How long the verdict stays up after it can be tapped away, before moving on alone. */
const LINGER_MS = 2200;
export default function VerdictScreen() {
  useKeepAwake();
  const router = useRouter();
  const haptics = useHaptics();
  const sound = useSounds();
  const session = useGameStore((s) => s.session);
  const go = useGameStore((s) => s.go);
  const round = session ? latestRound(session) : null;
  const [ready, setReady] = useState(false);
  const outcome = round?.outcome ?? null;

  useEffect(() => {
    if (!outcome) return;
    if (outcome === 'caught') {
      sound('caught');
      haptics.caught();
    } else {
      sound(outcome === 'stolen' ? 'steal' : 'escaped');
      haptics.escaped();
    }
    const id = setTimeout(() => setReady(true), verdictMs);
    return () => clearTimeout(id);
  }, [haptics, outcome, sound]);

  useEffect(() => {
    if (!ready) return;
    const id = setTimeout(() => {
      go('recap');
      router.replace(PHASE_ROUTES.recap);
    }, LINGER_MS);
    return () => clearTimeout(id);
  }, [go, ready, router]);

  if (!session || !round || !outcome) return <Redirect href="/" />;

  const next = () => {
    if (!ready) return;
    haptics.select();
    go('recap');
    router.replace(PHASE_ROUTES.recap);
  };

  return (
    <Pressable style={styles.screen} onPress={next} accessibilityRole="button" accessibilityLabel="Continue to the recap">
      <VerdictFlash outcome={outcome} line={verdictLine(round, session.players)} />
      <SafeAreaView style={styles.safe} pointerEvents="none">
        {ready ? (
          <PopIn from="rise" style={styles.hint}>
            <View style={styles.pill}>
              <Text style={styles.hintText}>Tap to see the word</Text>
            </View>
          </PopIn>
        ) : null}
      </SafeAreaView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.background },
  safe: { flex: 1, justifyContent: 'flex-start' },
  hint: { alignItems: 'center', paddingTop: space.md },
  pill: { backgroundColor: color.hintStrip, borderRadius: 999, paddingHorizontal: space.md, paddingVertical: space.sm },
  hintText: { fontFamily: font.heavy, fontSize: 15, lineHeight: 20, color: color.bone },
});
