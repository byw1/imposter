import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text as RNText, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { maxImposters } from '@/game/deal';
import { latestRound } from '@/game/session';
import { MIN_PLAYERS } from '@/game/types';
import { useGameStore } from '@/hooks/useGame';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useSettingsStore } from '@/hooks/useSettings';
import { useTableStore } from '@/hooks/useTable';
import { Avatar } from '@/ui/Avatar';
import { Button } from '@/ui/Button';
import { CensorField } from '@/ui/CensorField';
import { CircleButton } from '@/ui/CircleButton';
import { Icon } from '@/ui/Icon';
import { useLayout } from '@/ui/layout';
import { Mascot } from '@/ui/Mascot';
import { Float, PopIn } from '@/ui/motion';
import { Censored } from '@/ui/Redact';
import { Tap } from '@/ui/Tap';
import { Text } from '@/ui/Text';
import { color, font, gutter, radius, space } from '@/ui/tokens';

export type PlayPageProps = {
  bottomInset: number;
  onPlay: () => void;
  onResume: () => void;
  onPlayers: () => void;
  onRules: () => void;
  onHelp: () => void;
};

/** The word under the censor bar in the headline, changed every time the bar comes back. */
const HIDDEN = ['lying', 'bluffing', 'faking it', 'sweating', 'clueless'] as const;

/**
 * Play: the front door. Dark and hushed, a redacted page drifting behind,
 * Shade smirking in the middle, and one lime button. Who's at the table sits
 * underneath, so the same friends can start again with one tap. The house
 * rules have good defaults and live behind the gear, out of the way.
 */
export function PlayPage({ bottomInset, onPlay, onResume, onPlayers, onRules, onHelp }: PlayPageProps) {
  const { width, height, short } = useLayout();
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const players = useTableStore((s) => s.players);
  const settings = useTableStore((s) => s.settings);
  const session = useGameStore((s) => s.session);
  const onboarded = useSettingsStore((s) => s.onboarded);

  // The headline's censor bar lifts for a moment, then covers a new word.
  const [open, setOpen] = useState(false);
  const [word, setWord] = useState(0);
  useEffect(() => {
    if (reduced) return;
    let timeout: ReturnType<typeof setTimeout>;
    let swap: ReturnType<typeof setTimeout>;
    const cycle = (show: boolean) => {
      timeout = setTimeout(
        () => {
          setOpen(show);
          // A new word goes under the bar once it has covered the old one.
          if (!show) swap = setTimeout(() => setWord((w) => (w + 1) % HIDDEN.length), 260);
          cycle(!show);
        },
        show ? 2400 : 1600,
      );
    };
    cycle(true);
    return () => {
      clearTimeout(timeout);
      clearTimeout(swap);
    };
  }, [reduced]);

  const ready = players.length >= MIN_PLAYERS;
  const inProgress = Boolean(session && latestRound(session));

  return (
    <View style={[styles.page, { width }]}>
      <CensorField width={width} height={height} />

      <View style={[styles.top, { paddingTop: insets.top + space.sm, paddingLeft: insets.left + gutter - 4, paddingRight: insets.right + gutter - 4 }]}>
        <Text style={styles.wordmark} accessibilityRole="header">
          Imposter
        </Text>
        <View style={styles.topRight}>
          <CircleButton icon="help" label="How to play" onPress={onHelp} />
          <CircleButton icon="settings" label="House rules" onPress={onRules} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.body, { paddingLeft: insets.left + gutter, paddingRight: insets.right + gutter }]}
        showsVerticalScrollIndicator={false}
      >
        {inProgress ? (
          <PopIn from="rise">
            <Tap onPress={onResume} squish={0.97} accessibilityLabel="Game in progress. Resume." contentStyle={styles.banner}>
              <View style={styles.bannerDot} />
              <View style={styles.bannerCopy}>
                <Text style={styles.bannerTitle}>Game in progress</Text>
                <Text variant="caption" tone="muted" numberOfLines={1}>
                  Round {latestRound(session!)?.number ?? 1} · {session!.players.length} players
                </Text>
              </View>
              <View style={styles.bannerButton}>
                <Text style={styles.bannerButtonText}>Resume</Text>
              </View>
            </Tap>
          </PopIn>
        ) : null}

        <View style={[styles.hero, short && styles.heroShort]}>
          <Float distance={5}>
            <PopIn>
              <Mascot size={short ? 120 : 196} mood="smirk" poke />
            </PopIn>
          </Float>
          <View style={styles.headline} accessible accessibilityLabel="One of you is lying.">
            <Text variant="hero" align="center">
              One of you is
            </Text>
            <Censored open={open} style={styles.hidden} tint={color.text}>
              <RNText style={styles.hiddenWord} allowFontScaling={false}>
                {HIDDEN[word]}
              </RNText>
            </Censored>
          </View>
          <Text variant="body" tone="muted" align="center">
            Everyone gets the secret word. Except the imposter.
          </Text>
          {!onboarded ? (
            <Tap onPress={onHelp} squish={0.96} accessibilityLabel="New here? How to play" contentStyle={styles.learn}>
              <Text style={styles.learnText}>New here? How to play</Text>
              <Icon name="forward" size={16} color={color.brandText} />
            </Tap>
          ) : null}
        </View>

        <Tap onPress={onPlayers} squish={0.98} accessibilityLabel={`Players: ${players.length}. Edit.`} contentStyle={styles.card}>
          <View style={styles.cardHead}>
            <Icon name="users" size={18} color={color.textMuted} />
            <Text variant="overline" tone="muted" style={styles.cardLabel}>
              {`PLAYERS · ${players.length}`}
            </Text>
            <Text style={styles.cardAction}>{players.length ? 'Edit' : 'Add'}</Text>
          </View>
          {players.length ? (
            <View style={styles.avatars}>
              {players.map((p, i) => (
                <PopIn key={p.id} delay={i * 40} style={styles.avatarSpot}>
                  <Avatar player={p} size={44} />
                  <Text variant="caption" tone="muted" numberOfLines={1} style={styles.avatarName}>
                    {p.name}
                  </Text>
                </PopIn>
              ))}
            </View>
          ) : (
            <Text variant="body" tone="muted">
              Add everyone at the table. You need at least {MIN_PLAYERS}.
            </Text>
          )}
        </Tap>

        {players.length > 0 && players.length < 5 && settings.imposters !== 'surprise' && settings.imposters > maxImposters(players.length) ? (
          <Text variant="caption" tone="muted" align="center">
            {players.length} players can have 1 imposter. Add more for a second.
          </Text>
        ) : null}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: bottomInset + space.sm, paddingLeft: insets.left + gutter, paddingRight: insets.right + gutter }]}>
        <Button
          label={ready ? 'Start game' : 'Add players'}
          icon={ready ? 'play' : 'plus'}
          variant="primary"
          size="lg"
          onPress={onPlay}
          accessibilityHint={ready ? 'Deals the roles. Pass the phone round.' : `You need at least ${MIN_PLAYERS} players.`}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: color.background },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  wordmark: { fontFamily: font.display, fontSize: 26, lineHeight: 30, letterSpacing: -0.6, color: color.text, paddingLeft: 4 },
  topRight: { flexDirection: 'row', gap: space.sm },
  body: { paddingTop: space.md, paddingBottom: space.lg, gap: space.md },
  hero: { alignItems: 'center', gap: space.sm, paddingVertical: space.sm },
  heroShort: { paddingVertical: 0 },
  headline: { alignItems: 'center' },
  hidden: { alignSelf: 'center', paddingHorizontal: 6 },
  hiddenWord: { fontFamily: font.display, fontSize: 44, lineHeight: 50, letterSpacing: -1.2, color: color.brandText, textAlign: 'center' },
  card: { backgroundColor: color.surface, borderRadius: radius.lg, padding: space.md, gap: 12 },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  cardLabel: { flex: 1 },
  cardAction: { fontFamily: font.heavy, fontSize: 15, lineHeight: 20, color: color.brandText },
  avatars: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  avatarSpot: { width: 56, alignItems: 'center', gap: 4 },
  avatarName: { maxWidth: 56 },
  learn: { alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: space.xs },
  learnText: { fontFamily: font.heavy, fontSize: 15, lineHeight: 20, color: color.brandText },
  footer: { paddingTop: space.sm },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm + 2,
    backgroundColor: color.surface,
    borderRadius: radius.pill,
    paddingLeft: space.md,
    paddingRight: 6,
    paddingVertical: 6,
  },
  bannerDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: color.brand },
  bannerCopy: { flex: 1 },
  bannerTitle: { fontFamily: font.heavy, fontSize: 14, lineHeight: 18, color: color.text },
  bannerButton: { backgroundColor: color.glassStrong, borderRadius: radius.pill, paddingHorizontal: 16, paddingVertical: 9 },
  bannerButtonText: { fontFamily: font.heavy, fontSize: 14, lineHeight: 18, color: color.text },
});
