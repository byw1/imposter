import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { maxImposters } from '@/game/deal';
import { CLUE_ROUND_CHOICES, MIN_PLAYERS, TALK_CHOICES, type ImposterSetting } from '@/game/types';
import { useTableStore } from '@/hooks/useTable';
import { Button } from '@/ui/Button';
import { Chip } from '@/ui/Chip';
import { Footer, Screen } from '@/ui/Screen';
import { SetupHeader } from '@/ui/SetupHeader';
import { SectionLabel } from '@/ui/Section';
import { Text } from '@/ui/Text';
import { gutter, space } from '@/ui/tokens';

const IMPOSTERS: readonly { value: ImposterSetting; label: string; emoji?: string }[] = [
  { value: 1, label: '1' },
  { value: 2, label: '2' },
  { value: 3, label: '3' },
  { value: 'surprise', label: 'Surprise', emoji: '🎲' },
];

/**
 * House rules. Saved with the table, so they only need setting once.
 */
export default function RulesScreen() {
  const router = useRouter();
  const settings = useTableStore((s) => s.settings);
  const players = useTableStore((s) => s.players);
  const setRule = useTableStore((s) => s.setRule);
  const max = maxImposters(Math.max(MIN_PLAYERS, players.length));

  return (
    <Screen>
      <SetupHeader title="House rules" subtitle="Set them once. They stick until you change them." onClose={router.back} mood="wink" />

      <ScrollView contentContainerStyle={styles.body}>
        <View>
          <SectionLabel>Imposters</SectionLabel>
          <View style={styles.row}>
            {IMPOSTERS.map((option) => {
              const allowed = option.value === 'surprise' || option.value <= max;
              return (
                <Chip
                  key={String(option.value)}
                  label={option.label}
                  emoji={option.emoji}
                  grow={option.value === 'surprise'}
                  selected={settings.imposters === option.value}
                  onPress={() => allowed && setRule('imposters', option.value)}
                  accessibilityLabel={option.value === 'surprise' ? 'Surprise number of imposters' : `${option.label} imposters`}
                  style={!allowed ? styles.off : undefined}
                />
              );
            })}
          </View>
          <Text variant="caption" tone="muted" style={styles.note}>
            {settings.imposters === 'surprise'
              ? 'Nobody knows how many, the host included. Usually one. Sometimes not.'
              : max === 1
                ? 'Up to 4 players: 1 imposter. 5 or more can have 2, and 8 or more can have 3.'
                : max === 2
                  ? '5 to 7 players: up to 2 imposters. 8 or more can have 3.'
                  : '8 or more players: up to 3 imposters.'}
          </Text>
        </View>

        <View>
          <SectionLabel>Imposter hint</SectionLabel>
          <View style={styles.row}>
            <Chip
              grow
              emoji="💡"
              label="Show the topic"
              detail="Imposters know it's Food"
              selected={settings.hint}
              onPress={() => setRule('hint', true)}
            />
            <Chip
              grow
              emoji="🙈"
              label="No hint"
              detail="Hard mode: fully blind"
              selected={!settings.hint}
              onPress={() => setRule('hint', false)}
            />
          </View>
        </View>

        <View>
          <SectionLabel>Clues each</SectionLabel>
          <View style={styles.row}>
            {CLUE_ROUND_CHOICES.map((n) => (
              <Chip
                key={n}
                grow
                label={String(n)}
                detail={n === 1 ? 'Quick' : n === 2 ? 'Classic' : 'Long game'}
                selected={settings.clueRounds === n}
                onPress={() => setRule('clueRounds', n)}
                accessibilityLabel={`${n} ${n === 1 ? 'clue' : 'clues'} each`}
              />
            ))}
          </View>
          <Text variant="caption" tone="muted" style={styles.note}>
            How many times the one-word clues go round the table.
          </Text>
        </View>

        <View>
          <SectionLabel>Talk it out</SectionLabel>
          <View style={styles.wrap}>
            {TALK_CHOICES.map((seconds) => (
              <Chip
                key={seconds}
                label={seconds === 0 ? 'No timer' : seconds < 120 ? `${seconds}s` : `${seconds / 60} min`}
                selected={settings.talkSeconds === seconds}
                onPress={() => setRule('talkSeconds', seconds)}
              />
            ))}
          </View>
          <Text variant="caption" tone="muted" style={styles.note}>
            An optional timer for the arguing, started with a tap once the clues are done.
          </Text>
        </View>

        <View>
          <SectionLabel>Voting</SectionLabel>
          <View style={styles.row}>
            <Chip
              grow
              emoji="👉"
              label="Point"
              detail="Everyone points on three"
              selected={settings.voteMode === 'point'}
              onPress={() => setRule('voteMode', 'point')}
            />
            <Chip
              grow
              emoji="🤫"
              label="Secret"
              detail="Pass the phone, vote alone"
              selected={settings.voteMode === 'secret'}
              onPress={() => setRule('voteMode', 'secret')}
            />
          </View>
          <Text variant="caption" tone="muted" style={styles.note}>
            Secret votes take longer, and earn a detective’s bonus for anyone who picked an imposter.
          </Text>
        </View>

        <View style={styles.points}>
          <SectionLabel>Points</SectionLabel>
          <Text variant="body" tone="muted" style={styles.note}>
            Caught: everyone who was in gets 1.{'\n'}Got away: each imposter gets 2.{'\n'}Stole it: each imposter gets 2, and the one who guessed the word gets 1 more.
          </Text>
        </View>
      </ScrollView>

      <Footer>
        <Button label="Done" variant="primary" size="lg" onPress={router.back} />
      </Footer>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { paddingTop: space.xs, paddingBottom: space.xl, gap: space.lg },
  row: { flexDirection: 'row', gap: 10, paddingHorizontal: gutter },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: gutter },
  note: { paddingHorizontal: gutter, paddingTop: space.sm },
  off: { opacity: 0.35 },
  points: { paddingTop: space.xs },
});
