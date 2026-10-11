import { useKeepAwake } from 'expo-keep-awake';
import { Redirect, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, Text as RNText, View } from 'react-native';
import { isImposter, playerById } from '@/game/deal';
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
import { PopIn } from '@/ui/motion';
import { Censored } from '@/ui/Redact';
import { Screen } from '@/ui/Screen';
import { Text } from '@/ui/Text';
import { color, font, gutter, radius, space } from '@/ui/tokens';

const SUSPENSE_MS = 1700;

/**
 * The moment of truth. The person the table voted out drops in, the room gets
 * a drumroll, the sticker trembles, and the censor bar over their role slides
 * off: in, or the imposter.
 */
export default function RevealScreen() {
  useKeepAwake();
  const router = useRouter();
  const leave = useLeave();
  const haptics = useHaptics();
  const sound = useSounds();
  const reduced = useReducedMotion();
  const { short } = useLayout();

  const session = useGameStore((s) => s.session);
  const afterReveal = useGameStore((s) => s.afterReveal);
  const [open, setOpen] = useState(reduced);
  const [drop] = useState(() => new Animated.Value(reduced ? 1 : 0));
  const [shake] = useState(() => new Animated.Value(0));

  const round = session ? currentRound(session) : null;
  const accused = session && round ? playerById(session.players, round.accusedId) : undefined;
  const caught = Boolean(round && accused && isImposter(round, accused.id));

  useEffect(() => {
    if (reduced) {
      haptics.thud();
      return;
    }
    sound('drum');
    Animated.spring(drop, { toValue: 1, friction: 6, tension: 90, useNativeDriver: true }).start();
    const tremble = Animated.loop(
      Animated.sequence([
        Animated.timing(shake, { toValue: 1, duration: 55, easing: Easing.linear, useNativeDriver: true }),
        Animated.timing(shake, { toValue: -1, duration: 110, easing: Easing.linear, useNativeDriver: true }),
        Animated.timing(shake, { toValue: 0, duration: 55, easing: Easing.linear, useNativeDriver: true }),
      ]),
    );
    const startShake = setTimeout(() => tremble.start(), 500);
    const reveal = setTimeout(() => {
      tremble.stop();
      shake.setValue(0);
      setOpen(true);
      haptics.thud();
    }, SUSPENSE_MS);
    return () => {
      clearTimeout(startShake);
      clearTimeout(reveal);
      tremble.stop();
    };
  }, [drop, haptics, reduced, shake, sound]);

  if (!session || !round || !accused) return <Redirect href="/" />;

  const proceed = () => {
    haptics.select();
    afterReveal();
    router.replace(caught ? PHASE_ROUTES.guess : PHASE_ROUTES.verdict);
  };

  return (
    <Screen>
      <RoundHeader round={round.number} step={null} onClose={leave} />

      <View style={styles.body}>
        <Text variant="overline" tone="muted" align="center">
          THE TABLE VOTED OUT
        </Text>
        <Animated.View
          style={{
            opacity: drop.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 1, 1] }),
            transform: [
              { translateY: drop.interpolate({ inputRange: [0, 1], outputRange: [-200, 0] }) },
              { rotate: drop.interpolate({ inputRange: [0, 1], outputRange: ['-40deg', '0deg'] }) },
              { translateX: shake.interpolate({ inputRange: [-1, 1], outputRange: [-5, 5] }) },
            ],
          }}
        >
          <Avatar player={accused} size={short ? 96 : 150} />
        </Animated.View>
        <Text variant="hero" align="center" numberOfLines={1} adjustsFontSizeToFit>
          {accused.name}
        </Text>

        <Text variant="title" tone="muted" align="center">
          was…
        </Text>
        <Censored open={open} style={styles.verdictWrap}>
          <View style={[styles.verdict, { backgroundColor: caught ? color.escaped : color.bone }]}>
            <RNText style={styles.verdictText} allowFontScaling={false}>
              {caught ? '🎭 THE IMPOSTER' : '😇 IN'}
            </RNText>
          </View>
        </Censored>

        {open ? (
          <PopIn from="rise" delay={250} style={styles.after}>
            <Text variant="body" tone="muted" align="center">
              {caught
                ? `Not so fast. ${accused.name} gets one guess at the word to steal the win.`
                : `${accused.name} knew the word all along. The imposter is still out there.`}
            </Text>
          </PopIn>
        ) : null}
      </View>

      {open && !short ? (
        <PopIn delay={300} style={styles.peeker}>
          <Mascot size={88} mood={caught ? 'gasp' : 'smirk'} />
        </PopIn>
      ) : null}

      <View style={styles.footer}>
        <Button
          label={open ? (caught ? `Pass to ${accused.name}` : 'Who was it?') : 'Drumroll…'}
          icon={open ? (caught ? 'target' : 'mask') : undefined}
          variant="primary"
          size="lg"
          disabled={!open}
          onPress={proceed}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.sm, paddingHorizontal: gutter },
  verdictWrap: { marginTop: space.xs },
  verdict: { borderRadius: radius.pill, paddingHorizontal: space.lg, paddingVertical: space.sm + 2, transform: [{ rotate: '-3deg' }] },
  verdictText: { fontFamily: font.display, fontSize: 32, lineHeight: 38, letterSpacing: -0.5, color: color.ink },
  after: { paddingTop: space.md, paddingHorizontal: space.md },
  peeker: { position: 'absolute', right: 8, bottom: 110, transform: [{ rotate: '12deg' }] },
  footer: { paddingHorizontal: gutter, paddingTop: space.sm, paddingBottom: space.sm },
});
