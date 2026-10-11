import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { playableWords } from '@/game/deal';
import { useTableStore } from '@/hooks/useTable';
import { useAllTopics } from '@/hooks/useTopics';
import { Chip } from '@/ui/Chip';
import { Icon } from '@/ui/Icon';
import { useLayout } from '@/ui/layout';
import { PopIn } from '@/ui/motion';
import { Tap } from '@/ui/Tap';
import { Text } from '@/ui/Text';
import { TopicTile } from '@/ui/TopicTile';
import { color, gutter, radius, space } from '@/ui/tokens';

const GAP = 12;

/**
 * Topics: where the secret word comes from. Tap to pick one or several; the
 * round picks one at random and shows it on every RoleCard. Nothing picked
 * means every topic. Long press a topic to look inside (the words stay under
 * censor bars until you ask), or make your own.
 */
export function TopicsPage({ bottomInset }: { bottomInset: number }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, landscape } = useLayout();
  const topics = useAllTopics();
  const selected = useTableStore((s) => s.settings.topicIds);
  const toggle = useTableStore((s) => s.toggleTopic);
  const setTopics = useTableStore((s) => s.setTopics);

  const live = selected.filter((id) => topics.some((t) => t.id === id));
  const all = live.length === 0;
  const columns = landscape ? 4 : 2;
  const inner = width - insets.left - insets.right - gutter * 2;
  const tile = (inner - GAP * (columns - 1)) / columns;

  return (
    <View style={[styles.page, { width }]}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + space.md,
          paddingBottom: bottomInset + space.xl,
          paddingLeft: insets.left + gutter,
          paddingRight: insets.right + gutter,
          gap: space.md,
        }}
      >
        <View style={styles.head}>
          <Text variant="display" accessibilityRole="header">
            Topics
          </Text>
          <Text variant="body" tone="muted">
            Pick where the secret word comes from. Each round picks one of these at random.
          </Text>
        </View>

        <View style={styles.row}>
          <Chip
            label="All topics"
            emoji="🎲"
            selected={all}
            onPress={() => setTopics([])}
            role="checkbox"
          />
          {!all ? (
            <Text variant="caption" tone="muted">
              {live.length} picked
            </Text>
          ) : null}
        </View>

        <View style={styles.grid}>
          {topics.map((topic, i) => (
            <PopIn key={topic.id} delay={Math.min(i, 12) * 30} from="rise">
              <TopicTile
                width={tile}
                name={topic.name}
                emoji={topic.emoji}
                color={topic.color}
                count={playableWords(topic).length}
                selected={live.includes(topic.id)}
                custom={!topic.builtIn}
                tilt={i % 2 === 0 ? 10 : -8}
                onPress={() => toggle(topic.id)}
                onLongPress={() => router.push(`/topics/${topic.id}`)}
              />
            </PopIn>
          ))}
          <Tap
            onPress={() => router.push('/topics/edit/new')}
            accessibilityLabel="Make a topic"
            style={{ width: tile }}
            contentStyle={styles.newTile}
          >
            <View style={styles.plus}>
              <Icon name="plus" size={26} color={color.ink} weight={3.25} />
            </View>
            <Text variant="heading" align="center">
              Make a topic
            </Text>
            <Text variant="caption" tone="muted" align="center">
              Inside jokes, your town, your group chat.
            </Text>
          </Tap>
        </View>

        <Text variant="caption" tone="muted" align="center">
          Long press a topic to see inside.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: color.background },
  head: { gap: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GAP },
  newTile: {
    height: 168 + 10,
    borderRadius: radius.lg,
    backgroundColor: color.surface,
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.md,
    gap: 6,
  },
  plus: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: color.brand,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
});
