import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text as RNText, View } from 'react-native';
import { playableWords } from '@/game/deal';
import { useTableStore } from '@/hooks/useTable';
import { useAllTopics, useTopicsStore } from '@/hooks/useTopics';
import { Button } from '@/ui/Button';
import { EmojiSticker } from '@/ui/EmojiSticker';
import { PopIn } from '@/ui/motion';
import { Censored } from '@/ui/Redact';
import { Footer, Screen } from '@/ui/Screen';
import { Text } from '@/ui/Text';
import { TopBar } from '@/ui/TopBar';
import { color, font, gutter, inkOn, radius, space, topicColors } from '@/ui/tokens';

/**
 * Inside a topic. The words start under censor bars, because seeing the list
 * is a spoiler for anyone who plays it next; one tap shows them.
 */
export default function TopicScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const topics = useAllTopics();
  const remove = useTopicsStore((s) => s.remove);
  const setTopics = useTableStore((s) => s.setTopics);
  const selected = useTableStore((s) => s.settings.topicIds);
  const [shown, setShown] = useState(false);

  const topic = topics.find((t) => t.id === id);
  if (!topic) return <Redirect href="/" />;

  const words = playableWords(topic);
  const ink = inkOn(topic.color);

  const confirmDelete = () =>
    Alert.alert(`Delete ${topic.name}?`, 'Its words go too. This can’t be undone.', [
      { text: 'Keep', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          remove(topic.id);
          setTopics(selected.filter((t) => t !== topic.id));
          router.back();
        },
      },
    ]);

  return (
    <Screen>
      <TopBar
        leading="back"
        onLeading={router.back}
        title={topic.builtIn ? 'Topic' : 'Your topic'}
        trailing={topic.builtIn ? null : <Button label="Edit" size="sm" icon="edit" onPress={() => router.push(`/topics/edit/${topic.id}`)} />}
      />
      <ScrollView contentContainerStyle={styles.body}>
        <PopIn>
          <View style={[styles.hero, { backgroundColor: topicColors[topic.color] }]}>
            <View style={styles.blob} />
            <EmojiSticker emoji={topic.emoji} size={72} tilt={-8} />
            <RNText style={[styles.name, { color: ink }]} allowFontScaling={false}>
              {topic.name}
            </RNText>
            <RNText style={[styles.meta, { color: ink }]} allowFontScaling={false}>
              {words.length} words
            </RNText>
          </View>
        </PopIn>

        <View style={styles.words}>
          {words.map((word, i) => (
            <Censored key={word} open={shown} delay={shown ? Math.min(i, 40) * 12 : 0} tint={color.surfaceRaised}>
              <View style={styles.word}>
                <Text style={styles.wordText}>{word}</Text>
              </View>
            </Censored>
          ))}
        </View>
      </ScrollView>
      <Footer>
        <Button
          label="Play only this topic"
          icon="play"
          variant="primary"
          size="lg"
          onPress={() => {
            setTopics([topic.id]);
            router.back();
          }}
        />
        <View style={styles.row}>
          <Button
            label={shown ? 'Hide words' : 'Show words'}
            icon={shown ? 'eyeOff' : 'eye'}
            style={styles.flex}
            onPress={() => setShown((s) => !s)}
            accessibilityHint="Spoiler: the secret words come from this list."
          />
          {topic.builtIn ? null : <Button label="Delete" icon="trash" variant="danger" onPress={confirmDelete} />}
        </View>
      </Footer>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: gutter, paddingBottom: space.lg, gap: space.lg },
  hero: { overflow: 'hidden', borderRadius: radius.lg, padding: space.lg, gap: space.sm, alignItems: 'flex-start' },
  blob: { position: 'absolute', width: 260, height: 260, top: -120, right: -90, borderRadius: 999, backgroundColor: color.cardBlob },
  name: { fontFamily: font.display, fontSize: 40, lineHeight: 44, letterSpacing: -1, marginTop: space.sm },
  meta: { fontFamily: font.bold, fontSize: 14, lineHeight: 18, opacity: 0.8 },
  words: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  word: { backgroundColor: color.surface, borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 8 },
  wordText: { fontFamily: font.heavy, fontSize: 15, lineHeight: 20, color: color.text },
  row: { flexDirection: 'row', gap: 10 },
  flex: { flex: 1 },
});
