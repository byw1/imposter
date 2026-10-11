import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text as RNText, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { awards, playerStats, totals } from '@/game/stats';
import { TOPIC_COLOR_KEYS, type TopicColor } from '@/game/types';
import { useHistoryStore } from '@/hooks/useHistory';
import { Avatar } from '@/ui/Avatar';
import { Icon, type IconName } from '@/ui/Icon';
import { useLayout } from '@/ui/layout';
import { Mascot } from '@/ui/Mascot';
import { PopIn } from '@/ui/motion';
import { IconBadge } from '@/ui/Section';
import { StatTile } from '@/ui/StatTile';
import { Tap } from '@/ui/Tap';
import { Text } from '@/ui/Text';
import { color, font, gutter, palette, radius, space } from '@/ui/tokens';

export type MePageProps = {
  bottomInset: number;
  onSettings: () => void;
  onRules: () => void;
};

/** A friend's colour from their name, so the same friend wears the same colour every night. */
function colorFor(name: string): TopicColor {
  let hash = 0x811c9dc5;
  for (const ch of name.trim().toLocaleLowerCase()) {
    hash ^= ch.codePointAt(0) ?? 0;
    hash = Math.imul(hash, 0x01000193);
  }
  return TOPIC_COLOR_KEYS[(hash >>> 0) % TOPIC_COLOR_KEYS.length]!;
}

/**
 * You: what happened on every game night on this phone. Totals, the bragging
 * rights (best liar, best detective, word thief), and a board of everyone
 * who has played. All of it stays on the phone.
 */
export function MePage({ bottomInset, onSettings, onRules }: MePageProps) {
  const insets = useSafeAreaInsets();
  const { width } = useLayout();
  const records = useHistoryStore((s) => s.records);

  const sum = useMemo(() => totals(records), [records]);
  const people = useMemo(
    () =>
      playerStats(records).sort(
        (a, b) => b.caught + b.gotAway + b.stole - (a.caught + a.gotAway + a.stole) || b.rounds - a.rounds,
      ),
    [records],
  );
  const prizes = useMemo(() => awards(playerStats(records)), [records]);

  return (
    <View style={[styles.page, { width }]}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + space.md,
          paddingBottom: bottomInset + space.xl,
          paddingLeft: insets.left + gutter,
          paddingRight: insets.right + gutter,
          gap: space.lg,
        }}
      >
        <View style={styles.head}>
          <View style={styles.headCopy}>
            <Text variant="display" accessibilityRole="header">
              Game nights
            </Text>
            <Text variant="body" tone="muted">
              {sum.rounds === 0
                ? 'Play a round and the lies start piling up here.'
                : `${sum.rounds} ${sum.rounds === 1 ? 'round' : 'rounds'} over ${sum.nights} ${sum.nights === 1 ? 'night' : 'nights'}.`}
            </Text>
          </View>
          <View style={styles.sticker}>
            <Mascot size={84} mood={sum.rounds === 0 ? 'sleepy' : 'wink'} poke />
          </View>
        </View>

        <View style={styles.tiles}>
          <StatTile label="Caught" value={sum.caught} emoji="🕵️" />
          <StatTile label="Got away" value={sum.gotAway} emoji="🎭" />
          <StatTile label="Stolen" value={sum.stolen} emoji="🧠" />
        </View>

        {prizes.length > 0 ? (
          <View style={styles.section}>
            <Text variant="overline" tone="muted">
              BRAGGING RIGHTS
            </Text>
            {prizes.map((prize, i) => (
              <PopIn key={prize.title} delay={i * 80} from="rise">
                <View style={styles.award}>
                  <RNText style={styles.awardEmoji} allowFontScaling={false}>
                    {prize.emoji}
                  </RNText>
                  <View style={styles.awardCopy}>
                    <Text variant="caption" tone="muted">
                      {prize.title}
                    </Text>
                    <Text variant="title" numberOfLines={1}>
                      {prize.name}
                    </Text>
                  </View>
                  <Text variant="caption" tone="muted">
                    {prize.detail}
                  </Text>
                </View>
              </PopIn>
            ))}
          </View>
        ) : null}

        {people.length > 0 ? (
          <View style={styles.section}>
            <Text variant="overline" tone="muted">
              EVERYONE
            </Text>
            <View style={styles.board}>
              {people.slice(0, 20).map((person, i) => (
                <View key={person.name} style={[styles.row, i > 0 && styles.rowDivider]}>
                  <Text style={styles.rank}>{i + 1}</Text>
                  <Avatar player={{ id: person.name, name: person.name, color: colorFor(person.name) }} size={36} />
                  <View style={styles.rowCopy}>
                    <Text variant="heading" numberOfLines={1}>
                      {person.name}
                    </Text>
                    <Text variant="caption" tone="muted" numberOfLines={1}>
                      {person.rounds} {person.rounds === 1 ? 'round' : 'rounds'} · imposter {person.imposter}×
                    </Text>
                  </View>
                  <View style={styles.badges}>
                    <Mini emoji="🕵️" value={person.caught} />
                    <Mini emoji="🎭" value={person.gotAway} />
                    <Mini emoji="🧠" value={person.stole} />
                  </View>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text variant="overline" tone="muted">
            MORE
          </Text>
          <View style={styles.board}>
            <NavRow icon="help" tint={palette.teal} title="How to play" onPress={onRules} />
            <NavRow icon="settings" tint={palette.purple} title="Settings" onPress={onSettings} last />
          </View>
        </View>

        <Text variant="caption" tone="faint" align="center">
          No ads. No subscriptions. No account.{'\n'}Everything stays on this phone.
        </Text>
      </ScrollView>
    </View>
  );
}

function Mini({ emoji, value }: { emoji: string; value: number }) {
  return (
    <View style={styles.mini}>
      <RNText style={styles.miniEmoji} allowFontScaling={false}>
        {emoji}
      </RNText>
      <Text style={styles.miniValue}>{value}</Text>
    </View>
  );
}

function NavRow({ icon, tint, title, onPress, last = false }: { icon: IconName; tint: string; title: string; onPress: () => void; last?: boolean }) {
  return (
    <Tap onPress={onPress} squish={0.98} accessibilityLabel={title} contentStyle={[styles.row, !last && styles.rowDividerBottom]}>
      <IconBadge icon={icon} tint={tint} />
      <Text variant="heading" style={styles.rowCopy}>
        {title}
      </Text>
      <Icon name="forward" size={18} color={color.textFaint} weight={3} />
    </Tap>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: color.background },
  head: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  headCopy: { flex: 1, gap: 4 },
  sticker: { transform: [{ rotate: '-8deg' }] },
  tiles: { flexDirection: 'row', gap: 10 },
  section: { gap: space.sm },
  award: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: space.md,
    borderRadius: radius.lg,
    backgroundColor: color.surface,
  },
  awardEmoji: { fontSize: 34, lineHeight: 40 },
  awardCopy: { flex: 1 },
  board: { borderRadius: radius.lg, backgroundColor: color.surface, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: space.md, paddingVertical: 12 },
  rowDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: color.line },
  rowDividerBottom: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: color.line },
  rowCopy: { flex: 1 },
  rank: { fontFamily: font.display, fontSize: 18, lineHeight: 22, color: color.textMuted, width: 22, textAlign: 'center' },
  badges: { flexDirection: 'row', gap: 8 },
  mini: { alignItems: 'center' },
  miniEmoji: { fontSize: 14, lineHeight: 18 },
  miniValue: { fontFamily: font.heavy, fontSize: 13, lineHeight: 16, color: color.text },
});
