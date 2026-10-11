import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { useHaptics } from '@/hooks/useHaptics';
import { useHistoryStore } from '@/hooks/useHistory';
import { useSettings, useSettingsStore } from '@/hooks/useSettings';
import { Chip } from '@/ui/Chip';
import { Icon, type IconName } from '@/ui/Icon';
import { Screen } from '@/ui/Screen';
import { Group, IconBadge, SectionLabel, SwitchRow } from '@/ui/Section';
import { Tap } from '@/ui/Tap';
import { Text } from '@/ui/Text';
import { TopBar } from '@/ui/TopBar';
import { color, gutter, palette, space, type ThemeChoice } from '@/ui/tokens';

const THEME_CHOICES: readonly { key: ThemeChoice; emoji: string; label: string }[] = [
  { key: 'dark', emoji: '🌙', label: 'Dark' },
  { key: 'light', emoji: '☀️', label: 'Light' },
  { key: 'system', emoji: '📱', label: 'Auto' },
];

/**
 * App settings: how the app looks and what you hear and feel. The rules for a
 * game live in House rules, with the table.
 */
export default function SettingsScreen() {
  const router = useRouter();
  const haptics = useHaptics();
  const settings = useSettings();
  const set = useSettingsStore((s) => s.set);
  const setTheme = useSettingsStore((s) => s.setTheme);
  const resetAll = useSettingsStore((s) => s.resetAll);
  const clearHistory = useHistoryStore((s) => s.clear);

  const switchTheme = (next: ThemeChoice) => {
    if (next === settings.theme) return;
    Alert.alert('Switch the look?', 'The app restarts for a second to repaint. Your game, players and topics are all kept.', [
      { text: 'Not now', style: 'cancel' },
      { text: 'Switch', onPress: () => setTheme(next) },
    ]);
  };

  const confirmReset = () =>
    Alert.alert('Reset settings?', 'Sound and haptics go back to on. Your players, topics and stats are not touched.', [
      { text: 'Keep', style: 'cancel' },
      {
        text: 'Reset',
        style: 'destructive',
        onPress: () => {
          resetAll();
          haptics.select();
        },
      },
    ]);

  const confirmClear = () =>
    Alert.alert('Clear all stats?', 'Every round on the You page goes. This can’t be undone.', [
      { text: 'Keep', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: clearHistory },
    ]);

  return (
    <Screen>
      <TopBar leading="close" onLeading={router.back} leadingLabel="Close settings" title="Settings" />

      <ScrollView contentContainerStyle={styles.body}>
        <View>
          <SectionLabel>Look</SectionLabel>
          <View style={styles.choices}>
            {THEME_CHOICES.map((choice) => (
              <Chip
                key={choice.key}
                grow
                emoji={choice.emoji}
                label={choice.label}
                selected={settings.theme === choice.key}
                onPress={() => switchTheme(choice.key)}
                accessibilityLabel={`${choice.label} theme`}
              />
            ))}
          </View>
          <Text variant="caption" tone="muted" style={styles.note}>
            Light is easier outside in the sun. Role cards and verdicts look the same either way.
          </Text>
        </View>

        <View>
          <SectionLabel>Sound and feel</SectionLabel>
          <Group>
            <SwitchRow
              icon="sound"
              tint={palette.orange}
              title="Sound effects"
              detail="The deal, the drumroll, the verdict. The reveal sounds the same for everyone."
              value={settings.sound}
              onChange={(value) => set('sound', value)}
            />
            <SwitchRow
              icon="phone"
              tint={palette.purple}
              title="Haptics"
              detail="Buzzes for the countdown and the verdict. Never different for the imposter."
              value={settings.haptics}
              onChange={(value) => set('haptics', value)}
              last
            />
          </Group>
        </View>

        <View>
          <SectionLabel>More</SectionLabel>
          <Group>
            <NavRow icon="help" tint={palette.teal} title="How to play" onPress={() => router.push('/welcome?replay=1')} />
            <NavRow icon="reset" tint={palette.yellow} title="Reset settings" onPress={confirmReset} />
            <NavRow icon="trash" tint={palette.magenta} title="Clear stats" onPress={confirmClear} last />
          </Group>
        </View>

        <View style={styles.colophon}>
          <Text variant="label" tone="faint" align="center">
            Imposter {Constants.expoConfig?.version ?? ''}
          </Text>
          <Text variant="caption" tone="faint" align="center">
            Works offline. No ads. No subscriptions. No account.{'\n'}Nothing leaves your phone.
          </Text>
        </View>
      </ScrollView>
    </Screen>
  );
}

function NavRow({ icon, tint, title, onPress, last = false }: { icon: IconName; tint: string; title: string; onPress: () => void; last?: boolean }) {
  return (
    <Tap onPress={onPress} squish={0.98} accessibilityLabel={title} contentStyle={[styles.row, !last && styles.rowDivider]}>
      <IconBadge icon={icon} tint={tint} />
      <Text variant="heading" style={styles.rowTitle}>
        {title}
      </Text>
      <Icon name="forward" size={18} color={color.textFaint} weight={3} />
    </Tap>
  );
}

const styles = StyleSheet.create({
  body: { paddingTop: space.sm, paddingBottom: space.xl, gap: space.lg },
  choices: { flexDirection: 'row', gap: 10, paddingHorizontal: gutter },
  note: { paddingHorizontal: gutter, paddingTop: space.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: space.md, paddingVertical: 12 },
  rowDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: color.line },
  rowTitle: { flex: 1 },
  colophon: { gap: space.xs, paddingHorizontal: space.xl, paddingTop: space.md },
});
