import { Redirect, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Alert, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { MIN_PLAYERS } from '@/game/types';
import { MePage } from '@/home/MePage';
import { PlayPage } from '@/home/PlayPage';
import { TopicsPage } from '@/home/TopicsPage';
import { PHASE_ROUTES, useGameStore } from '@/hooks/useGame';
import { useSettingsStore } from '@/hooks/useSettings';
import { useTableStore } from '@/hooks/useTable';
import { BottomBar, useBottomBarHeight, type BottomTab } from '@/ui/BottomBar';
import { color } from '@/ui/tokens';

const TABS: readonly BottomTab[] = [
  { key: 'topics', label: 'Topics', icon: 'decks' },
  { key: 'play', label: 'Play', icon: 'mask' },
  { key: 'me', label: 'You', icon: 'user' },
];

const PLAY = 1;

/**
 * Home: three pages side by side (Topics, Play, You) that you swipe between,
 * like Charades. It opens on Play, because the thing almost everyone wants is
 * to start a game.
 */
export default function HomeScreen() {
  const router = useRouter();
  const onboarded = useSettingsStore((s) => s.onboarded);
  const players = useTableStore((s) => s.players);
  const settings = useTableStore((s) => s.settings);
  const start = useGameStore((s) => s.start);
  const { width } = useWindowDimensions();
  const pager = useRef<ScrollView>(null);
  const bar = useBottomBarHeight();
  const [page, setPage] = useState(PLAY);

  if (!onboarded) return <Redirect href="/welcome" />;

  const goTo = (index: number) => {
    pager.current?.scrollTo({ x: index * width, animated: true });
    setPage(index);
  };

  const play = () => {
    if (players.length < MIN_PLAYERS) {
      router.push('/new/players');
      return;
    }
    const begin = () => {
      start(players, settings);
      router.push(PHASE_ROUTES.deal);
    };
    if (!useGameStore.getState().session) {
      begin();
      return;
    }
    Alert.alert('Start a new game?', 'The game in progress ends. Its finished rounds stay in your stats.', [
      { text: 'Keep it', style: 'cancel' },
      { text: 'New game', onPress: begin },
    ]);
  };

  const resume = () => {
    const phase = useGameStore.getState().phase;
    router.push(PHASE_ROUTES[phase]);
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        ref={pager}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentOffset={{ x: PLAY * width, y: 0 }}
        onLayout={() => pager.current?.scrollTo({ x: page * width, animated: false })}
        scrollEventThrottle={16}
        onScroll={(event) => {
          const next = Math.round(event.nativeEvent.contentOffset.x / width);
          if (next !== page && next >= 0 && next < TABS.length) setPage(next);
        }}
      >
        <TopicsPage bottomInset={bar} />
        <PlayPage
          bottomInset={bar}
          onPlay={play}
          onResume={resume}
          onPlayers={() => router.push('/new/players')}
          onRules={() => router.push('/new/rules')}
          onTopics={() => goTo(0)}
          onHelp={() => router.push('/welcome?replay=1')}
        />
        <MePage
          bottomInset={bar}
          onSettings={() => router.push('/settings')}
          onRules={() => router.push('/welcome?replay=1')}
        />
      </ScrollView>

      <View style={styles.bar}>
        <BottomBar tabs={TABS} active={page} onSelect={goTo} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.chrome },
  bar: { position: 'absolute', left: 0, right: 0, bottom: 0 },
});
