import { useKeepAwake } from 'expo-keep-awake';
import { Redirect, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { isImposter, playerById } from '@/game/deal';
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
import { TimerBar } from '@/ui/TimerBar';
import { color, gutter, space } from '@/ui/tokens';

/**
 * Pass and peek.
 *
 * The phone goes round the table. Each player's name fills the top of the
 * screen so the right person reaches for it; they hold the big pill and their
 * card turns over; they let go and it's face down again, already showing the
 * next name. Nothing else to tap: they just pass it on.
 *
 * The screen looks, sounds and buzzes the same whatever the card says: same
 * colour, same layout, same reveal, same time on screen.
 *
 * Once everyone has looked, the same screen becomes the clue sheet: who
 * starts, the order, an optional timer, and the vote.
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
    if (again) {
      setAgain(false);
      setDealIndex(players.length);
    } else {
      advanceDeal();
    }
  };

  if (done || !player) {
    return (
      <ClueTime
        onClose={leave}
        onAgain={(index) => {
          setAgain(true);
          setDealIndex(index);
        }}
        onVote={() => {
          haptics.select();
          go('vote');
          router.replace(PHASE_ROUTES.vote);
        }}
      />
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
        <HoldToReveal
          openLabel={again || !upcoming ? 'Let go when you’re done' : `Let go, pass to ${upcoming.name}`}
          onReveal={() => {
            setRevealed(true);
            sound('reveal');
          }}
          // Letting go hides the card and moves straight on to the next name.
          onHide={next}
        />
      </View>
    </Screen>
  );
}

/**
 * Clue time. The phone goes face up in the middle: who starts, the order
 * round the table, and one button for when the talking is done. The clues
 * themselves are said out loud, so there's nothing to tap through. The start
 * seat is random every round. A talk timer is there for tables that want one.
 */
function ClueTime({ onClose, onAgain, onVote }: { onClose: () => void; onAgain: (index: number) => void; onVote: () => void }) {
  const haptics = useHaptics();
  const sound = useSounds();
  const { short } = useLayout();
  const session = useGameStore((s) => s.session)!;
  const round = currentRound(session)!;
  const seconds = session.settings.talkSeconds;
  const laps = session.settings.clueRounds;
  const order = round.order.map((id) => playerById(session.players, id)).filter((p) => p !== undefined);
  const starter = order[0];

  const [endsAt, setEndsAt] = useState<number | null>(null);
  const [nowMs, setNow] = useState(() => Date.now());
  const buzzed = useRef(false);
  const remaining = endsAt === null ? seconds * 1000 : Math.max(0, endsAt - nowMs);
  const over = endsAt !== null && remaining === 0;

  useEffect(() => {
    if (endsAt === null) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [endsAt]);

  useEffect(() => {
    if (!over || buzzed.current) return;
    buzzed.current = true;
    sound('timeup');
    haptics.thud();
  }, [haptics, over, sound]);

  return (
    <Screen>
      <RoundHeader round={round.number} step="Clues" onClose={onClose} />
      <View style={[styles.doneBody, short && styles.doneShort]}>
        {!short ? (
          <PopIn>
            <View style={styles.tilt}>
              <Mascot size={130} mood="wink" poke />
            </View>
          </PopIn>
        ) : null}
        <PopIn delay={120} from="rise" style={styles.doneCopy}>
          <Text variant="hero" align="center" numberOfLines={2} adjustsFontSizeToFit>
            <Text variant="hero" style={{ color: color.brandText }}>
              {starter?.name}
            </Text>{' '}
            starts
          </Text>
          <Text variant="body" tone="muted" align="center">
            {laps > 1 ? `Go round ${laps} times, one word each.` : 'Go round once, one word each.'} Then talk it out and vote.
            {session.settings.hint ? ` Topic: ${round.topicEmoji} ${round.topicName}.` : ''}
          </Text>
        </PopIn>
        <View style={styles.againBlock}>
          <View style={styles.againRow}>
            {order.map((p) => (
              <PlayerChip key={p.id} player={p} onPress={() => onAgain(session.players.indexOf(p))} />
            ))}
          </View>
          <Text variant="caption" tone="muted" align="center">
            In this order. Missed your card? Tap your name.
          </Text>
        </View>
        {seconds > 0 && endsAt !== null ? (
          <View style={styles.timer}>
            <TimerBar fraction={remaining / (seconds * 1000)} warning={remaining <= 10_000} label={over ? 'Time’s up' : undefined} />
          </View>
        ) : null}
      </View>
      <View style={styles.footer}>
        <Button label="Vote" icon="vote" variant="primary" size="lg" onPress={onVote} />
        {seconds > 0 && endsAt === null ? (
          <Button
            label={`Start a ${seconds}s timer`}
            icon="timer"
            variant="ghost"
            size="sm"
            onPress={() => {
              haptics.select();
              setNow(Date.now());
              setEndsAt(Date.now() + seconds * 1000);
            }}
          />
        ) : null}
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
  timer: { alignSelf: 'stretch' },
});

