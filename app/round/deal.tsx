import { useKeepAwake } from 'expo-keep-awake';
import { Redirect, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { isImposter } from '@/game/deal';
import { currentRound } from '@/game/session';
import { PHASE_ROUTES, useGameStore } from '@/hooks/useGame';
import { useHaptics } from '@/hooks/useHaptics';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useSounds } from '@/hooks/useSounds';
import { RoundHeader } from '@/round/RoundHeader';
import { useLeave } from '@/round/useLeave';
import { Button } from '@/ui/Button';
import { HoldToReveal } from '@/ui/HoldToReveal';
import { useLayout } from '@/ui/layout';
import { Mascot } from '@/ui/Mascot';
import { PopIn } from '@/ui/motion';
import { PlayerChip } from '@/ui/PlayerChip';
import { RoleCard } from '@/ui/RoleCard';
import { Screen } from '@/ui/Screen';
import { Text } from '@/ui/Text';
import { gutter, space } from '@/ui/tokens';

/**
 * Pass and peek.
 *
 * The phone goes round the table. Each player's name fills the top of the
 * screen so the right person reaches for it; they hold the big pill and their
 * card turns over; they let go and it's face down again before anyone else
 * can lean in. Then they pass it on.
 *
 * The screen looks, sounds and buzzes the same whatever the card says: same
 * colour, same layout, same reveal, same time on screen.
 */
export default function DealScreen() {
  useKeepAwake();
  const router = useRouter();
  const leave = useLeave();
  const haptics = useHaptics();
  const sound = useSounds();
  const reduced = useReducedMotion();
  const { short } = useLayout();

  const session = useGameStore((s) => s.session);
  const dealIndex = useGameStore((s) => s.dealIndex);
  const advanceDeal = useGameStore((s) => s.advanceDeal);
  const setDealIndex = useGameStore((s) => s.setDealIndex);
  const go = useGameStore((s) => s.go);

  const [revealed, setRevealed] = useState(false);
  const [seen, setSeen] = useState(false);
  // A second look for someone who missed it jumps back to the end afterwards.
  const [again, setAgain] = useState(false);
  const [deal] = useState(() => new Animated.Value(0));

  const round = session ? currentRound(session) : null;
  const players = session?.players ?? [];
  const player = players[dealIndex];
  const done = dealIndex >= players.length;

  // Each new player gets their card dealt across the table.
  useEffect(() => {
    if (done) return;
    sound('deal');
    if (reduced) {
      deal.setValue(1);
      return;
    }
    deal.setValue(0);
    const animation = Animated.spring(deal, { toValue: 1, friction: 7, tension: 70, useNativeDriver: true });
    animation.start();
    return () => animation.stop();
  }, [deal, dealIndex, done, reduced, sound]);

  if (!session || !round) return <Redirect href="/" />;

  const next = () => {
    haptics.select();
    setRevealed(false);
    setSeen(false);
    if (again) {
      setAgain(false);
      setDealIndex(players.length);
    } else {
      advanceDeal();
    }
  };

  if (done || !player) {
    return (
      <Screen>
        <RoundHeader round={round.number} step="Peek" onClose={leave} />
        <View style={[styles.doneBody, short && styles.doneShort]}>
          <PopIn>
            <View style={styles.tilt}>
              <Mascot size={short ? 110 : 170} mood="wink" poke />
            </View>
          </PopIn>
          <PopIn delay={120} from="rise" style={styles.doneCopy}>
            <Text variant="hero" align="center">
              Everyone’s seen theirs
            </Text>
            <Text variant="body" tone="muted" align="center">
              Phone in the middle. Clues go round, one word each.
            </Text>
          </PopIn>
          <View style={styles.againBlock}>
            <Text variant="caption" tone="muted" align="center">
              Missed it? Tap your name for another look.
            </Text>
            <View style={styles.againRow}>
              {players.map((p, index) => (
                <PlayerChip
                  key={p.id}
                  player={p}
                  onPress={() => {
                    setAgain(true);
                    setDealIndex(index);
                  }}
                />
              ))}
            </View>
          </View>
        </View>
        <View style={styles.footer}>
          <Button
            label="Start clues"
            icon="chat"
            variant="primary"
            size="lg"
            onPress={() => {
              go('clues');
              router.replace(PHASE_ROUTES.clues);
            }}
          />
        </View>
      </Screen>
    );
  }

  const role = isImposter(round, player.id) ? 'imposter' : 'in';
  const upcoming = players[dealIndex + 1];

  return (
    <Screen>
      <RoundHeader round={round.number} step="Peek" onClose={leave} />

      <PopIn key={player.id} from="rise" style={styles.who}>
        <Text variant="overline" tone="muted" align="center">
          PASS THE PHONE TO
        </Text>
        <Text variant="hero" align="center" numberOfLines={1} adjustsFontSizeToFit>
          {player.name}
        </Text>
        <Text variant="caption" tone="muted" align="center">
          {again ? 'Another look' : `Player ${dealIndex + 1} of ${players.length}`} · nobody else looks
        </Text>
      </PopIn>

      <View style={styles.cardArea}>
        <Animated.View
          key={player.id}
          style={[
            styles.cardWrap,
            {
              opacity: deal.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 1, 1] }),
              transform: [
                { translateY: deal.interpolate({ inputRange: [0, 1], outputRange: [-80, 0] }) },
                { translateX: deal.interpolate({ inputRange: [0, 1], outputRange: [120, 0] }) },
                { rotate: deal.interpolate({ inputRange: [0, 1], outputRange: ['14deg', '0deg'] }) },
              ],
            },
          ]}
        >
          <View style={styles.cardBox}>
            <RoleCard
              style={styles.fill}
              topic={{ name: round.topicName, emoji: round.topicEmoji, color: round.topicColor }}
              role={role}
              word={round.word}
              revealed={revealed}
              hint={session.settings.hint}
              playerName={player.name}
            />
            {!revealed && !short ? (
              <View style={styles.peeker} pointerEvents="none">
                <Mascot size={92} mood="peek" />
              </View>
            ) : null}
          </View>
        </Animated.View>
      </View>

      <View style={styles.footer}>
        {seen && !revealed ? (
          <PopIn from="rise">
            <Button
              label={again ? 'Done' : upcoming ? `Pass to ${upcoming.name}` : 'Done, everyone'}
              icon={upcoming && !again ? 'forward' : 'check'}
              onPress={next}
            />
          </PopIn>
        ) : null}
        <HoldToReveal
          onReveal={() => {
            setRevealed(true);
            setSeen(true);
            sound('reveal');
          }}
          onHide={() => setRevealed(false)}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  who: { paddingHorizontal: gutter, gap: 2, paddingTop: space.xs },
  cardArea: { flex: 1, paddingHorizontal: gutter, paddingTop: space.md, paddingBottom: space.sm },
  cardWrap: { flex: 1, justifyContent: 'center' },
  cardBox: { flex: 1, maxHeight: 460 },
  fill: { flex: 1 },
  peeker: { position: 'absolute', top: -34, right: 6, transform: [{ rotate: '14deg' }] },
  footer: { paddingHorizontal: gutter, paddingTop: space.sm, paddingBottom: space.sm, gap: 10 },
  doneBody: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.lg, paddingHorizontal: gutter },
  doneShort: { gap: space.sm },
  doneCopy: { gap: space.sm, alignItems: 'center' },
  tilt: { transform: [{ rotate: '-6deg' }] },
  againBlock: { gap: space.sm, alignSelf: 'stretch' },
  againRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, justifyContent: 'center' },
});

