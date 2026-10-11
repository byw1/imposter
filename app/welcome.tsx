import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text as RNText, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useSettingsStore } from '@/hooks/useSettings';
import { Button } from '@/ui/Button';
import { CircleButton } from '@/ui/CircleButton';
import { useLayout } from '@/ui/layout';
import { Mascot, type MascotMood } from '@/ui/Mascot';
import { StoryBar } from '@/ui/ProgressBar';
import { Caption, Sticker } from '@/ui/Social';
import { Text } from '@/ui/Text';
import { color, font, gutter, palette, space } from '@/ui/tokens';

type Story = {
  background: string;
  caption: string;
  detail: string;
  mood: MascotMood;
  glyph?: string;
  stickers?: { text: string; tint: string; tilt: number; top: string; left?: string; right?: string }[];
};

const STORIES: Story[] = [
  {
    background: palette.purple,
    caption: 'Everyone gets the secret word',
    detail: 'Pass the phone round. Hold to peek at your card. Don’t let anyone see.',
    mood: 'peek',
    stickers: [
      { text: 'PIZZA', tint: palette.lime, tilt: -10, top: '20%', left: '8%' },
      { text: 'no peeking 👀', tint: '#FFFFFF', tilt: 7, top: '64%', right: '8%' },
    ],
  },
  {
    background: palette.indigo,
    caption: 'Except the imposter',
    detail: 'They only get the topic. They have to bluff their way through.',
    mood: 'smirk',
    stickers: [
      { text: '🍕 Food', tint: palette.orange, tilt: 8, top: '20%', right: '8%' },
      { text: 'the word is… ???', tint: '#FFFFFF', tilt: -6, top: '64%', left: '8%' },
    ],
  },
  {
    background: palette.teal,
    caption: 'One word each',
    detail: 'Go round the circle. Too obvious helps the imposter. Too vague looks suspicious.',
    mood: 'wink',
    stickers: [
      { text: 'cheesy', tint: palette.yellow, tilt: -9, top: '18%', left: '6%' },
      { text: 'slice', tint: '#FFFFFF', tilt: 6, top: '26%', right: '8%' },
      { text: 'Italian?', tint: palette.magenta, tilt: -4, top: '64%', left: '12%' },
    ],
  },
];

const FINAL: Story = {
  background: palette.blue,
  caption: 'Talk, then vote',
  detail: 'Catch the imposter and they get one guess at the word to steal the win.',
  mood: 'caught',
  stickers: [
    { text: 'it was YOU', tint: palette.lime, tilt: -8, top: '20%', left: '8%' },
    { text: '🕵️ caught!', tint: '#FFFFFF', tilt: 9, top: '62%', right: '8%' },
  ],
};

const STORY_MS = 4500;

/**
 * How to play, as stories, the way Charades does it. Tap the right side for
 * next, the left side for back, and each moves on by itself. Shown once on
 * first launch, and any time from Play or You. Under reduced motion the
 * stories wait for a tap.
 */
export default function WelcomeScreen() {
  const router = useRouter();
  const { replay } = useLocalSearchParams<{ replay?: string }>();
  const setSetting = useSettingsStore((s) => s.set);
  const reduced = useReducedMotion();
  const { short } = useLayout();
  const [index, setIndex] = useState(0);
  const [room, setRoom] = useState(400);
  const [progress] = useState(() => new Animated.Value(0));
  const stories = [...STORIES, FINAL];

  const story = stories[index] ?? stories[0]!;
  const last = index === stories.length - 1;

  const finish = () => {
    setSetting('onboarded', true);
    if (replay) router.back();
    else router.replace('/');
  };

  useEffect(() => {
    progress.setValue(0);
    if (reduced || last) {
      if (last) progress.setValue(1);
      return;
    }
    const animation = Animated.timing(progress, { toValue: 1, duration: STORY_MS, easing: Easing.linear, useNativeDriver: false });
    animation.start(({ finished }) => {
      if (finished) setIndex((current) => Math.min(current + 1, stories.length - 1));
    });
    return () => animation.stop();
  }, [index, last, progress, reduced, stories.length]);

  return (
    <View style={[styles.screen, { backgroundColor: story.background }]}>
      <View style={StyleSheet.absoluteFill}>
        <View style={styles.zones}>
          <Pressable style={styles.back} onPress={() => setIndex(Math.max(0, index - 1))} accessibilityRole="button" accessibilityLabel="Previous" />
          <Pressable style={styles.next} onPress={() => (last ? undefined : setIndex(index + 1))} accessibilityRole="button" accessibilityLabel="Next" />
        </View>
      </View>

      <SafeAreaView style={styles.safe} pointerEvents="box-none">
        <View style={styles.top} pointerEvents="box-none">
          <StoryBar count={stories.length} index={index} progress={progress} />
          <View style={styles.topRow} pointerEvents="box-none">
            <View style={styles.from}>
              <Mascot size={32} animated={false} />
              <Text style={styles.fromName} maxFontSizeMultiplier={1.2}>Shade</Text>
              <Text style={styles.fromTime} maxFontSizeMultiplier={1.2}>how to play</Text>
            </View>
            <CircleButton icon="close" label="Skip" tone="scrim" size={36} onPress={finish} />
          </View>
        </View>

        <View style={[styles.body, short && styles.bodySideways]} pointerEvents="box-none">
          <View
            style={styles.middle}
            pointerEvents="none"
            key={index}
            onLayout={(event) => setRoom(event.nativeEvent.layout.height)}
          >
            {/* Shade fills the space left over, so big text or a small phone shrinks the art, not the words. */}
            <Mascot size={Math.max(96, Math.min(short ? 170 : 230, room * 0.6))} mood={story.mood} glyph={story.glyph} />
            {story.stickers?.map((sticker) => (
              <Sticker
                key={sticker.text}
                tint={sticker.tint}
                tilt={sticker.tilt}
                style={{
                  position: 'absolute',
                  top: sticker.top as `${number}%`,
                  left: sticker.left as `${number}%` | undefined,
                  right: sticker.right as `${number}%` | undefined,
                }}
              >
                {sticker.text}
              </Sticker>
            ))}
          </View>

          <View style={[styles.bottom, short && styles.bottomSideways]} pointerEvents="box-none">
            <Caption size="lg">{story.caption}</Caption>
            <RNText style={styles.detail} maxFontSizeMultiplier={1.3}>{story.detail}</RNText>
            {last ? (
              <View style={styles.cta}>
                <Button label="Let’s play" variant="white" size="lg" onPress={finish} />
              </View>
            ) : (
              <Text style={styles.tapHint} maxFontSizeMultiplier={1.2}>Tap to continue</Text>
            )}
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  zones: { flex: 1, flexDirection: 'row' },
  back: { flex: 1 },
  next: { flex: 2 },
  safe: { flex: 1 },
  top: { paddingHorizontal: space.sm, paddingTop: space.sm, gap: space.sm },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4 },
  from: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  fromName: { fontFamily: font.heavy, fontSize: 15, lineHeight: 20, color: color.bone },
  fromTime: { fontFamily: font.medium, fontSize: 13, lineHeight: 18, color: 'rgba(255,255,255,0.75)' },
  body: { flex: 1 },
  bodySideways: { flexDirection: 'row', alignItems: 'center' },
  bottomSideways: { flex: 1.2, justifyContent: 'center', paddingBottom: 0 },
  middle: { flex: 1, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center' },
  bottom: { gap: space.md, paddingBottom: space.md, alignItems: 'center' },
  detail: {
    fontFamily: font.bold,
    fontSize: 17,
    lineHeight: 23,
    color: color.bone,
    textAlign: 'center',
    paddingHorizontal: gutter * 2,
  },
  cta: { alignSelf: 'stretch', paddingHorizontal: gutter },
  tapHint: { fontFamily: font.bold, fontSize: 13, lineHeight: 18, color: 'rgba(255,255,255,0.7)', paddingBottom: space.sm },
});
