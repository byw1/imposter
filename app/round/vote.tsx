import { useKeepAwake } from 'expo-keep-awake';
import { Redirect, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Text as RNText, View } from 'react-native';
import { playerById } from '@/game/deal';
import { currentRound } from '@/game/session';
import type { Player } from '@/game/types';
import { ballotFor, resolveVotes, tally } from '@/game/vote';
import { PHASE_ROUTES, useGameStore } from '@/hooks/useGame';
import { useHaptics } from '@/hooks/useHaptics';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useSounds } from '@/hooks/useSounds';
import { RoundHeader } from '@/round/RoundHeader';
import { useLeave } from '@/round/useLeave';
import { Button } from '@/ui/Button';
import { useLayout } from '@/ui/layout';
import { Mascot } from '@/ui/Mascot';
import { PopIn } from '@/ui/motion';
import { Screen } from '@/ui/Screen';
import { Text } from '@/ui/Text';
import { color, font, gutter, space } from '@/ui/tokens';
import { VoteCard } from '@/ui/VoteCard';

const GAP = 10;

/**
 * The vote. Two ways, from the house rules:
 *
 * Point: everyone points on three, and the host taps whoever got the most
 * fingers. Fast, loud, and most tables' favourite.
 *
 * Secret: the phone goes round and each player votes alone. Then the votes
 * are counted out one dot at a time. A tie goes to a revote between the tied
 * players; a second tie lets the imposters slip away.
 */
export default function VoteScreen() {
  useKeepAwake();
  const leave = useLeave();
  const session = useGameStore((s) => s.session);
  const round = session ? currentRound(session) : null;

  if (!session || !round) return <Redirect href="/" />;

  return (
    <Screen>
      <RoundHeader round={round.number} step="Vote" onClose={leave} />
      {session.settings.voteMode === 'secret' ? <SecretVote /> : <PointVote />}
    </Screen>
  );
}

/** Columns for the suspect grid: as many as fit at a comfortable size. */
function useGrid(count: number) {
  const { width, landscape } = useLayout();
  const columns = landscape ? Math.min(count, 5) : count <= 4 ? 2 : 3;
  const cell = (Math.min(width, 900) - gutter * 2 - GAP * (columns - 1)) / columns;
  return { cell };
}

function useAccuse() {
  const router = useRouter();
  const accuse = useGameStore((s) => s.accuse);
  const sound = useSounds();
  const haptics = useHaptics();
  return (id: string | null) => {
    sound('lock');
    haptics.thud();
    accuse(id);
    router.replace(id === null ? PHASE_ROUTES.verdict : PHASE_ROUTES.reveal);
  };
}

function PointVote() {
  const session = useGameStore((s) => s.session)!;
  const haptics = useHaptics();
  const sound = useSounds();
  const reduced = useReducedMotion();
  const lock = useAccuse();
  const [stage, setStage] = useState<'ready' | 'count' | 'pick'>('ready');
  const [count, setCount] = useState(3);
  const [picked, setPicked] = useState<string | null>(null);
  const [pop] = useState(() => new Animated.Value(1));
  const { cell } = useGrid(session.players.length);

  const countIn = () => {
    setCount(3);
    setStage('count');
  };

  useEffect(() => {
    if (stage !== 'count') return;
    haptics.tick();
    sound('tick');
    let n = 3;
    const id = setInterval(() => {
      n -= 1;
      setCount(n);
      if (n > 0) {
        haptics.tick();
        sound('tick');
      } else if (n === 0) {
        haptics.thud();
        sound('point');
      } else {
        clearInterval(id);
        setStage('pick');
      }
    }, 750);
    return () => clearInterval(id);
  }, [haptics, sound, stage]);

  useEffect(() => {
    if (stage !== 'count' || reduced) return;
    pop.setValue(0);
    Animated.spring(pop, { toValue: 1, friction: 4, tension: 200, useNativeDriver: true }).start();
  }, [count, pop, reduced, stage]);

  if (stage === 'ready' || stage === 'count') {
    return (
      <>
        <Pressable
          style={styles.center}
          disabled={stage === 'count'}
          onPress={countIn}
          accessibilityRole="button"
          accessibilityLabel="Count us in"
        >
          {stage === 'ready' ? (
            <>
              <PopIn>
                <View style={styles.tiltLeft}>
                  <Mascot size={150} mood="gasp" />
                </View>
              </PopIn>
              <Text variant="hero" align="center">
                Who’s lying?
              </Text>
              <Text variant="body" tone="muted" align="center">
                On three, everyone points at who they think the imposter is. No changing your mind.
              </Text>
            </>
          ) : (
            <View style={styles.countWrap}>
              <Text variant="overline" tone="muted" align="center">
                {count > 0 ? 'POINT AT THE IMPOSTER IN' : 'EVERYONE'}
              </Text>
              <Animated.View
                style={[
                  styles.ring,
                  count <= 0 && styles.ringGo,
                  {
                    transform: [
                      { scale: pop.interpolate({ inputRange: [0, 1], outputRange: [1.4, 1] }) },
                      { rotate: count <= 0 ? '-6deg' : '0deg' },
                    ],
                  },
                ]}
              >
                <RNText
                  style={[styles.count, count <= 0 && styles.countGo]}
                  allowFontScaling={false}
                  accessibilityLiveRegion="assertive"
                  numberOfLines={1}
                >
                  {count > 0 ? count : 'Point!'}
                </RNText>
              </Animated.View>
            </View>
          )}
        </Pressable>
        <View style={styles.footer}>
          <Button
            label={stage === 'count' ? 'Get ready…' : 'Count us in'}
            icon="hand"
            variant="primary"
            size="lg"
            disabled={stage === 'count'}
            onPress={countIn}
          />
          <Button label="Skip the count" variant="ghost" size="sm" onPress={() => setStage('pick')} />
        </View>
      </>
    );
  }

  return (
    <>
      <ScrollView contentContainerStyle={styles.pickBody}>
        <View style={styles.pickHead}>
          <Text variant="display" align="center">
            Who got the most fingers?
          </Text>
          <Text variant="body" tone="muted" align="center">
            Tap them. A tie? Count again.
          </Text>
        </View>
        <View style={styles.grid}>
          {session.players.map((p, i) => (
            <PopIn key={p.id} delay={i * 35}>
              <VoteCard
                width={cell}
                player={p}
                picked={picked === p.id}
                onPress={() => {
                  haptics.select();
                  setPicked(p.id);
                }}
              />
            </PopIn>
          ))}
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <Button
          label="Lock vote"
          icon="lock"
          variant="primary"
          size="lg"
          disabled={!picked}
          onPress={() => picked && lock(picked)}
        />
        <Button label="Count again" variant="ghost" size="sm" onPress={countIn} />
      </View>
    </>
  );
}

function SecretVote() {
  const session = useGameStore((s) => s.session)!;
  const voterIndex = useGameStore((s) => s.voterIndex);
  const candidates = useGameStore((s) => s.candidates);
  const revote = useGameStore((s) => s.revote);
  const vote = useGameStore((s) => s.vote);
  const nextVoter = useGameStore((s) => s.nextVoter);
  const revoteBetween = useGameStore((s) => s.revoteBetween);
  const haptics = useHaptics();
  const sound = useSounds();
  const lock = useAccuse();
  const [ballotOpen, setBallotOpen] = useState(false);
  const [picked, setPicked] = useState<string | null>(null);

  const pool = candidates ?? session.players.map((p) => p.id);
  const voter = session.players[voterIndex];
  const { cell } = useGrid(Math.max(2, pool.length));

  if (!voter) {
    return <Count pool={pool} revote={revote} onAccuse={lock} onRevote={(ids) => revoteBetween(ids)} />;
  }

  if (!ballotOpen) {
    return (
      <>
        <View style={styles.center}>
          <PopIn key={voter.id}>
            <View style={styles.tiltRight}>
              <Mascot size={120} mood="wink" />
            </View>
          </PopIn>
          <PopIn key={`${voter.id}-name`} from="rise" style={styles.handoff}>
            <Text variant="overline" tone="muted" align="center">
              {revote ? 'REVOTE · PASS THE PHONE TO' : 'SECRET VOTE · PASS THE PHONE TO'}
            </Text>
            <Text variant="hero" align="center" numberOfLines={1} adjustsFontSizeToFit>
              {voter.name}
            </Text>
            <Text variant="caption" tone="muted" align="center">
              Voter {voterIndex + 1} of {session.players.length} · nobody else looks
            </Text>
          </PopIn>
        </View>
        <View style={styles.footer}>
          <Button
            label={`I'm ${voter.name}`}
            icon="vote"
            variant="primary"
            size="lg"
            onPress={() => {
              haptics.select();
              setBallotOpen(true);
            }}
          />
        </View>
      </>
    );
  }

  const ballot = ballotFor(voter.id, pool)
    .map((id) => playerById(session.players, id))
    .filter((p): p is Player => Boolean(p));

  return (
    <>
      <ScrollView contentContainerStyle={styles.pickBody}>
        <View style={styles.pickHead}>
          <Text variant="display" align="center">
            {voter.name}, who’s lying?
          </Text>
          <Text variant="body" tone="muted" align="center">
            {revote ? 'A tie. Pick between these.' : 'Only you see this. You can’t vote for yourself.'}
          </Text>
        </View>
        <View style={styles.grid}>
          {ballot.map((p, i) => (
            <PopIn key={p.id} delay={i * 35}>
              <VoteCard
                width={cell}
                player={p}
                picked={picked === p.id}
                onPress={() => {
                  haptics.select();
                  setPicked(p.id);
                }}
              />
            </PopIn>
          ))}
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <Button
          label="Lock vote"
          icon="lock"
          variant="primary"
          size="lg"
          disabled={!picked}
          onPress={() => {
            if (!picked) return;
            sound('lock');
            haptics.thud();
            vote(voter.id, picked);
            setPicked(null);
            setBallotOpen(false);
            nextVoter();
          }}
        />
      </View>
    </>
  );
}

/** The votes counted out, one dot at a time, then what they mean. */
function Count({
  pool,
  revote,
  onAccuse,
  onRevote,
}: {
  pool: string[];
  revote: boolean;
  onAccuse: (id: string | null) => void;
  onRevote: (ids: string[]) => void;
}) {
  const session = useGameStore((s) => s.session)!;
  const round = currentRound(session)!;
  const haptics = useHaptics();
  const sound = useSounds();
  const reduced = useReducedMotion();
  const ballots = useMemo(() => Object.values(round.votes), [round.votes]);
  const [shown, setShown] = useState(reduced ? ballots.length : 0);
  const { cell } = useGrid(pool.length);

  // Votes land one by one, a tick each, so the room can feel it coming.
  useEffect(() => {
    if (shown >= ballots.length) return;
    const id = setTimeout(
      () => {
        haptics.tick();
        sound('tick');
        setShown((s) => s + 1);
      },
      shown === 0 ? 700 : 420,
    );
    return () => clearTimeout(id);
  }, [ballots.length, haptics, shown, sound]);

  const partial: Record<string, string> = {};
  Object.entries(round.votes)
    .slice(0, shown)
    .forEach(([voter, suspect]) => {
      partial[voter] = suspect;
    });
  const counts = tally(partial, pool);
  const votesFor = (id: string) => counts.find((c) => c.playerId === id)?.votes ?? 0;
  const counted = shown >= ballots.length;
  const result = counted ? resolveVotes(round.votes, pool, revote) : null;

  useEffect(() => {
    if (counted) haptics.thud();
  }, [counted, haptics]);

  const accusedName = result?.kind === 'accused' ? playerById(session.players, result.playerId)?.name : null;

  return (
    <>
      <ScrollView contentContainerStyle={styles.pickBody}>
        <View style={styles.pickHead}>
          <Text variant="display" align="center">
            {!counted
              ? 'Counting the votes…'
              : result?.kind === 'accused'
                ? `The table picked ${accusedName}`
                : result?.kind === 'tie'
                  ? "It's a tie"
                  : 'Nobody agreed'}
          </Text>
          <Text variant="body" tone="muted" align="center">
            {!counted
              ? `${shown} of ${ballots.length}`
              : result?.kind === 'tie'
                ? 'Quick revote, between the tied players only.'
                : result?.kind === 'deadlock'
                  ? 'Still tied. The imposters slip away in the confusion.'
                  : 'Moment of truth.'}
          </Text>
        </View>
        <View style={styles.grid}>
          {pool.map((id) => {
            const p = playerById(session.players, id);
            if (!p) return null;
            const winner = result?.kind === 'accused' && result.playerId === id;
            return <VoteCard key={id} width={cell} player={p} picked={winner} winner={winner} votes={votesFor(id)} />;
          })}
        </View>
      </ScrollView>
      <View style={styles.footer}>
        {result?.kind === 'accused' ? (
          <Button label={`Reveal ${accusedName}`} icon="eye" variant="primary" size="lg" onPress={() => onAccuse(result.playerId)} />
        ) : result?.kind === 'tie' ? (
          <Button label="Revote" icon="reset" variant="primary" size="lg" onPress={() => onRevote(result.playerIds)} />
        ) : result?.kind === 'deadlock' ? (
          <Button label="See who it was" icon="eye" variant="primary" size="lg" onPress={() => onAccuse(null)} />
        ) : (
          <Button label="Counting…" variant="primary" size="lg" disabled onPress={() => undefined} />
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: gutter, gap: space.md },
  handoff: { alignSelf: 'stretch', gap: 2 },
  tiltLeft: { transform: [{ rotate: '-8deg' }] },
  tiltRight: { transform: [{ rotate: '8deg' }] },
  countWrap: { alignItems: 'center', gap: space.lg },
  ring: {
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 10,
    borderColor: color.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringGo: { backgroundColor: color.brand, borderColor: color.brand },
  count: { fontFamily: font.display, fontSize: 120, lineHeight: 130, letterSpacing: -3, color: color.text, textAlign: 'center' },
  countGo: { fontSize: 54, lineHeight: 60, letterSpacing: -1.5, color: color.ink },
  pickBody: { paddingHorizontal: gutter, paddingTop: space.sm, paddingBottom: space.lg, gap: space.lg },
  pickHead: { gap: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GAP, justifyContent: 'center' },
  footer: { paddingHorizontal: gutter, paddingTop: space.sm, paddingBottom: space.sm, gap: 2 },
});
