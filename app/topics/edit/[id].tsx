import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text as RNText, View } from 'react-native';
import { makeTopicId } from '@/game/ids';
import { MIN_TOPIC_WORDS, TOPIC_COLOR_KEYS, type TopicColor } from '@/game/types';
import { useTableStore } from '@/hooks/useTable';
import { useTopicsStore } from '@/hooks/useTopics';
import { MAX_TOPIC_NAME, parseWords, TOPIC_EMOJI } from '@/topics/parse';
import { Button } from '@/ui/Button';
import { Field } from '@/ui/Field';
import { Icon } from '@/ui/Icon';
import { Footer, Screen } from '@/ui/Screen';
import { SectionLabel } from '@/ui/Section';
import { Tap } from '@/ui/Tap';
import { Text } from '@/ui/Text';
import { TopBar } from '@/ui/TopBar';
import { TopicTile } from '@/ui/TopicTile';
import { color, gutter, inkOn, radius, ringWidth, space, topicColors } from '@/ui/tokens';

/**
 * Make or edit a topic: a name, an emoji, a colour and a list of words. Paste
 * a list from anywhere, one per line or comma-separated. It needs enough words
 * to deal a fresh one most rounds and to give a caught imposter real choices.
 */
export default function EditTopicScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const custom = useTopicsStore((s) => s.custom);
  const save = useTopicsStore((s) => s.save);
  const toggleTopic = useTableStore((s) => s.toggleTopic);
  const existing = custom.find((t) => t.id === id);

  const [name, setName] = useState(existing?.name ?? '');
  const [emoji, setEmoji] = useState(existing?.emoji ?? TOPIC_EMOJI[0]);
  const [tint, setTint] = useState<TopicColor>(existing?.color ?? 'magenta');
  const [text, setText] = useState(existing?.words.join('\n') ?? '');

  const words = parseWords(text);
  const short = MIN_TOPIC_WORDS - words.length;
  const ready = name.trim().length > 0 && short <= 0;

  const submit = () => {
    if (!ready) return;
    const topicId = existing?.id ?? makeTopicId();
    save({ id: topicId, name: name.trim().slice(0, MAX_TOPIC_NAME), emoji, color: tint, words, builtIn: false });
    if (!existing) toggleTopic(topicId);
    router.back();
  };

  return (
    <Screen>
      <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <TopBar leading="close" onLeading={router.back} title={existing ? 'Edit topic' : 'New topic'} />
        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          <View style={styles.preview}>
            <TopicTile
              width={200}
              name={name.trim() || 'Your topic'}
              emoji={emoji}
              color={tint}
              count={words.length}
              selected={false}
              onPress={() => undefined}
            />
          </View>

          <View>
            <SectionLabel>Name</SectionLabel>
            <View style={styles.pad}>
              <Field
                value={name}
                onChangeText={setName}
                placeholder="The group chat"
                maxLength={MAX_TOPIC_NAME}
                autoCapitalize="words"
                size="heading"
                accessibilityLabel="Topic name"
              />
            </View>
          </View>

          <View>
            <SectionLabel>Sticker</SectionLabel>
            <View style={styles.emojis}>
              {TOPIC_EMOJI.map((e) => (
                <Tap
                  key={e}
                  onPress={() => setEmoji(e)}
                  accessibilityLabel={`Sticker ${e}`}
                  accessibilityState={{ selected: emoji === e }}
                  contentStyle={[styles.emoji, emoji === e && styles.emojiOn]}
                >
                  <RNText style={styles.emojiText} allowFontScaling={false}>
                    {e}
                  </RNText>
                </Tap>
              ))}
            </View>
          </View>

          <View>
            <SectionLabel>Colour</SectionLabel>
            <View style={styles.swatches}>
              {TOPIC_COLOR_KEYS.map((key) => (
                <Tap
                  key={key}
                  onPress={() => setTint(key)}
                  accessibilityLabel={`${key} colour`}
                  accessibilityState={{ selected: tint === key }}
                  contentStyle={[styles.swatchRing, tint === key && styles.swatchRingOn]}
                >
                  <View style={[styles.swatch, { backgroundColor: topicColors[key] }]}>
                    {tint === key ? <Icon name="check" size={20} color={inkOn(key)} weight={3.5} /> : null}
                  </View>
                </Tap>
              ))}
            </View>
          </View>

          <View>
            <SectionLabel>Words</SectionLabel>
            <View style={styles.pad}>
              <Field
                value={text}
                onChangeText={setText}
                placeholder={'One per line, or separated by commas.\nThe beach house\nKaraoke Tuesdays\nThe red car'}
                multiline
                autoCapitalize="sentences"
                style={styles.words}
                accessibilityLabel="Words, one per line"
              />
              <Text variant="caption" tone="muted" style={styles.count}>
                {short > 0
                  ? `${words.length} so far. Add ${short} more: at least ${MIN_TOPIC_WORDS}, so the imposter gets real choices when they guess.`
                  : `${words.length} words. Things everyone at your table knows work best.`}
              </Text>
            </View>
          </View>
        </ScrollView>
        <Footer>
          <Button label={existing ? 'Save' : 'Make topic'} icon="check" variant="primary" size="lg" disabled={!ready} onPress={submit} />
        </Footer>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  body: { paddingBottom: space.xl, gap: space.lg },
  preview: { alignItems: 'center', paddingTop: space.sm },
  pad: { paddingHorizontal: gutter },
  emojis: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: gutter },
  emoji: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: color.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: ringWidth,
    borderColor: color.surface,
  },
  emojiOn: { borderColor: color.brandText },
  emojiText: { fontSize: 24, lineHeight: 30 },
  swatches: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: gutter },
  swatchRing: { padding: 3, borderRadius: radius.pill },
  swatchRingOn: { backgroundColor: color.brandText },
  swatch: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  words: { minHeight: 180 },
  count: { paddingTop: space.sm },
});
